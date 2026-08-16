

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle,
  XCircle,
  Droplets,
  Cross,
  HeartHandshake,
  Award,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DashboardLayout from "../dashboard/layout";
import {
  issueBaptismCertificate,
  verifyBaptismCertificate,
  fetchBaptismCertificates,
  BaptismCertificateRequestDTO,
} from "@/services/baptismCertificateService";
import {
  issueWeddingCertificate,
  verifyWeddingCertificate,
  fetchWeddingCertificates,
  WeddingCertificateRequestDTO,
} from "@/services/weddingCertificateService";
import {
  recordDeath,
  verifyDeathRecord,
  fetchDeathRecords,
  DeathRecord,
  DeathRecordRequestDTO,
} from "@/services/deathRecordService";
import { fetchChildrenForDropdown } from "@/services/childrenService";
import { fetchChurchesForDropdown } from "@/services/churchService";
import { fetchFathersForDropdown } from "@/services/fatherService";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Unified brand color for certificates - a deep blue-green (teal) mix
const CERT_COLOR = "#6bb1f7";
const CERT_COLOR_DARK = "#6bb1f7";

// Only types that have a real issuing endpoint in the API are offered.
type CertificateType = "BAPTISM" | "WEDDING" | "DEATH";

const certificateOptions: { value: CertificateType; label: string; icon: any; color: string }[] = [
  { value: "BAPTISM", label: "Baptism Certificate", icon: Droplets, color: "text-teal-700 bg-teal-100" },
  { value: "WEDDING", label: "Wedding Certificate", icon: HeartHandshake, color: "text-teal-700 bg-teal-100" },
  { value: "DEATH", label: "Death Certificate", icon: Cross, color: "text-cyan-800 bg-cyan-100" },
];

function CertificatesPageWr() {
  const { t, i18n } = useTranslation();
  const certLang = i18n.language === "am" ? "am" : "en";
  const searchParams = useSearchParams();
  const [children, setChildren] = useState<{ id: string; fullName: string }[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [childId, setChildId] = useState(searchParams?.get("childId") || "");
  const [type, setType] = useState<CertificateType>("BAPTISM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCert, setGeneratedCert] = useState<{
    type: CertificateType;
    data: any; // raw response payload from the issue endpoint (fields differ per type)
  } | null>(null);

  // --- Churches dropdown (shared by the generate form and the records browser) ---
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchChurchesForDropdown();
        setChurches(data || []);
      } catch {
        // ignore
      }
    })();
  }, []);

  // --- Fathers dropdown (for the priest / officiant field) ---
  const [fathers, setFathers] = useState<{ id: string; fullName: string; churchName?: string }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFathersForDropdown();
        setFathers(data || []);
      } catch {
        // ignore
      }
    })();
  }, []);

  // --- Per-type issue form fields (only the ones each controller needs) ---
  const [dateOfEvent, setDateOfEvent] = useState(""); // baptism date / marriage date / death date
  const [church, setChurch] = useState(""); // church name, sent as-is to the DTO
  const [officiantId, setOfficiantId] = useState(""); // selected father's id
  const [brideChildId, setBrideChildId] = useState(""); // WEDDING only, groom = childId
  const [burialPlace, setBurialPlace] = useState(""); // DEATH only
  const [deathMemberType, setDeathMemberType] = useState<"CHILD" | "FAMILY_HEAD" | "CLERGY">("CHILD");

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const data = await fetchChildrenForDropdown();
      setChildren(data || []);
    } catch (err) {
      // ignore
    } finally {
      setLoadingChildren(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const nameOf = (id: string) => children.find((c) => c.id === id)?.fullName || "Unknown";

  const handleGenerate = async () => {
    if (!childId) {
      toast.error(t("Please select a child."));
      return;
    }
    if (!dateOfEvent) {
      toast.error(t("Please select a date."));
      return;
    }

    setIsSubmitting(true);
    try {
      const childName = nameOf(childId);
      const officiantName = fathers.find((f) => f.id === officiantId)?.fullName || "";
      let issued: any = null;

      if (type === "BAPTISM") {
        const payload: BaptismCertificateRequestDTO = {
          properName: childName.split(" ")[0],
          familyName: childName.split(" ").slice(-1)[0],
          dateOfBaptism: dateOfEvent,
          church,
          baptizingPriestId: officiantId || undefined,
          baptizingPriestName: officiantName,
        };
        const res = await issueBaptismCertificate(childId, payload);
        issued = res?.data;
      } else if (type === "WEDDING") {
        if (!brideChildId) {
          toast.error(t("Please select the bride/groom's counterpart."));
          setIsSubmitting(false);
          return;
        }
        const payload: WeddingCertificateRequestDTO = {
          groomChildId: childId,
          groomFullName: childName,
          brideChildId,
          brideFullName: nameOf(brideChildId),
          church,
          officiatingPriestId: officiantId || undefined,
          officiatingPriestName: officiantName,
          dateOfMarriage: dateOfEvent,
        };
        const res = await issueWeddingCertificate(payload);
        issued = res?.data;
      } else {
        const payload: DeathRecordRequestDTO = {
          memberType: deathMemberType,
          memberId: childId,
          dateOfDeath: dateOfEvent,
          burialPlace,
          officiant: officiantName,
        };
        const res = await recordDeath(payload);
        issued = res?.data;
      }

      setGeneratedCert({ type, data: issued || {} });
      toast.success(t("Certificate generated successfully!"));
      loadRecords();
    } catch (err: any) {
      toast.error(err.message || t("Certificate generation failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Verification tool ---
  const [verifyType, setVerifyType] = useState<CertificateType>("BAPTISM");
  const [verifyRegNo, setVerifyRegNo] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!verifyRegNo) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      let res;
      if (verifyType === "BAPTISM") res = await verifyBaptismCertificate(verifyRegNo);
      else if (verifyType === "WEDDING") res = await verifyWeddingCertificate(verifyRegNo);
      else res = await verifyDeathRecord(verifyRegNo);
      setVerifyResult({ ok: res?.success !== false, message: res?.message || t("Verification complete.") });
    } catch (err: any) {
      setVerifyResult({ ok: false, message: err.message || t("Verification failed.") });
    } finally {
      setVerifying(false);
    }
  };

  // --- Certificate records list (Baptism, Wedding, Death) ---
  type RecordTab = CertificateType;
  const [recordTab, setRecordTab] = useState<RecordTab>("BAPTISM");
  const [recordsChurchId, setRecordsChurchId] = useState("");
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [baptismRecords, setBaptismRecords] = useState<any[]>([]);
  const [weddingRecords, setWeddingRecords] = useState<any[]>([]);
  const [deathRecords, setDeathRecords] = useState<DeathRecord[]>([]);

  // Default the records-browser church filter once the shared church list loads
  useEffect(() => {
    if (churches.length > 0) setRecordsChurchId((prev) => prev || churches[0].id);
  }, [churches]);

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      if (recordTab === "DEATH") {
        const data = await fetchDeathRecords(0, 20);
        setDeathRecords(data || []);
      } else if (recordsChurchId) {
        if (recordTab === "BAPTISM") {
          const page = await fetchBaptismCertificates(recordsChurchId, 0, 20);
          setBaptismRecords(page.content || []);
        } else {
          const page = await fetchWeddingCertificates(recordsChurchId, 0, 20);
          setWeddingRecords(page.content || []);
        }
      }
    } catch (err: any) {
      toast.error(err.message || t("Failed to load certificate records"));
    } finally {
      setLoadingRecords(false);
    }
  }, [recordTab, recordsChurchId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

  // Builds the printable field rows straight from the raw API response for each type.
  const getCertificateFields = (): { am: string; en: string; value: string }[] => {
    if (!generatedCert) return [];
    const d = generatedCert.data || {};
    if (generatedCert.type === "BAPTISM") {
      return [
        { am: "የቤተሰብ ስም", en: "Family Name", value: d.familyName },
        { am: "የግል ስም", en: "Proper Name", value: d.properName },
        { am: "የተጠመቀው(ችው) ክርስትና ስም", en: "Christian Name", value: d.christianName },
        { am: "የአባት ስም", en: "Father's Name", value: d.fatherName },
        { am: "የእናት ስም", en: "Mother's Name", value: d.motherName },
        { am: "የክርስትና አባት (እናት) ስም", en: "God Father's or Mothers' Name", value: d.godParentName },
        { am: "ሀገር", en: "Country", value: d.country },
        { am: "የተወለደበት(ችበት) ቦታ", en: "Place of Birth", value: d.placeOfBirth },
        { am: "የትውልድ ሀገር", en: "Nationality", value: d.nationality },
        { am: "የተወለደበት(ችበት) ቀን", en: "Date of Birth", value: fmtDate(d.dateOfBirth) },
        { am: "የተጠመቀበት(ችበት) ቀን", en: "Date of Baptism", value: fmtDate(d.dateOfBaptism) },
        { am: "የተጠመቀበት(ችበት) ቤተ ክርስቲያን", en: "Church", value: d.church },
        { am: "ዜግነት", en: "Citizenship", value: d.citizenship },
        { am: "አጥማቂው ካህን", en: "Baptizing Priest", value: d.baptizingPriestName },
      ].map((f) => ({ ...f, value: f.value || "" }));
    }
    if (generatedCert.type === "WEDDING") {
      return [
        { am: "የሙሽራው ስም", en: "Groom's Name", value: d.groomFullName },
        { am: "የሙሽራው ዜግነት", en: "Groom's Nationality", value: d.groomNationality },
        { am: "የሙሽሪት ስም", en: "Bride's Name", value: d.brideFullName },
        { am: "የሙሽሪት ዜግነት", en: "Bride's Nationality", value: d.brideNationality },
        { am: "ሀገር", en: "Country", value: d.country },
        { am: "የተጋቡበት ቤተ ክርስቲያን", en: "Church", value: d.church },
        { am: "የተጋቡበት ቀን", en: "Date of Marriage", value: fmtDate(d.dateOfMarriage) },
        { am: "አጋቢው ካህን", en: "Officiating Priest", value: d.officiatingPriestName },
        { am: "ምስክር 1", en: "Witness 1", value: d.witness1Name },
        { am: "ምስክር 2", en: "Witness 2", value: d.witness2Name },
        { am: "ምስክር 3", en: "Witness 3", value: d.witness3Name },
      ].map((f) => ({ ...f, value: f.value || "" }));
    }
    // DEATH
    return [
      { am: "ሙሉ ስም", en: "Full Name", value: d.fullName },
      { am: "የሰበካ አባል መለያ", en: "Sebeka Member ID", value: d.sebekaMemberId },
      { am: "የአባልነት ዓይነት", en: "Member Type", value: d.memberType },
      { am: "የስራ መደብ", en: "Occupation", value: d.occupation },
      { am: "ማዕረግ", en: "Rank / Title", value: d.rankOrTitle },
      { am: "የሞተበት ቀን", en: "Date of Death", value: fmtDate(d.dateOfDeath) },
      { am: "የተቀበረበት ቦታ", en: "Burial Place", value: d.burialPlace },
      { am: "አስፈጻሚ", en: "Officiant", value: d.officiant },
      { am: "ማስታወሻ", en: "Remarks", value: d.remarks },
    ].map((f) => ({ ...f, value: f.value || "" }));
  };

  const getCertifySubject = (): string => {
    if (!generatedCert) return "";
    const d = generatedCert.data || {};
    if (generatedCert.type === "BAPTISM") return `${d.properName || ""} ${d.familyName || ""}`.trim();
    if (generatedCert.type === "WEDDING") return `${d.groomFullName || ""} & ${d.brideFullName || ""}`.trim();
    return d.fullName || "";
  };

  const getCertifyEventDate = (): string => {
    if (!generatedCert) return "";
    const d = generatedCert.data || {};
    if (generatedCert.type === "BAPTISM") return fmtDate(d.dateOfBaptism);
    if (generatedCert.type === "WEDDING") return fmtDate(d.dateOfMarriage);
    return fmtDate(d.dateOfDeath);
  };

  const getCertifySentence = (): string => {
    if (!generatedCert) return "";
    if (generatedCert.type === "BAPTISM")
      return "is baptized according to the Law and Order of Ethiopian Orthodox Tewahido Church at the above mentioned place and date.";
    if (generatedCert.type === "WEDDING")
      return "were married according to the Law and Order of Ethiopian Orthodox Tewahido Church at the above mentioned church and date.";
    return "departed this life, as recorded according to the records of Ethiopian Orthodox Tewahido Church.";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" /> {t("Certificates")}
          </h1>
          <p className="text-muted-foreground">{t("Generate official certificates for children")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {certificateOptions.map((opt) => {
            const Icon = opt.icon;
            const selected = type === opt.value;
            return (
              <Card
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selected ? "ring-2 ring-primary border-primary" : ""
                }`}
              >
                <CardContent className="flex items-center gap-4 py-6">
                  <div className={`p-3 rounded-xl ${opt.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">{t(opt.label)}</div>
                    <div className="text-xs text-muted-foreground">{opt.value}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> {t("Generate Certificate")}
            </CardTitle>
            <CardDescription>{t("Select the certificate type above and fill in the details")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{type === "WEDDING" ? t("Groom") : t("Child")} *</Label>
              <Select value={childId} onValueChange={setChildId} disabled={loadingChildren}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingChildren ? t("Loading...") : t("Select a child")} />
                </SelectTrigger>
                <SelectContent>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === "WEDDING" && (
              <div>
                <Label>{t("Bride")} *</Label>
                <Select value={brideChildId} onValueChange={setBrideChildId} disabled={loadingChildren}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select the bride")} />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "DEATH" && (
              <div>
                <Label>{t("Member Type")}</Label>
                <Select value={deathMemberType} onValueChange={(v) => setDeathMemberType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHILD">{t("Child")}</SelectItem>
                    <SelectItem value="FAMILY_HEAD">{t("Family Head")}</SelectItem>
                    <SelectItem value="CLERGY">{t("Clergy")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>
                {type === "BAPTISM" ? t("Date of Baptism") : type === "WEDDING" ? t("Date of Marriage") : t("Date of Death")} *
              </Label>
              <Input type="date" value={dateOfEvent} onChange={(e) => setDateOfEvent(e.target.value)} />
            </div>

            {type !== "DEATH" && (
              <div>
                <Label>{t("Church")}</Label>
                <Select value={church} onValueChange={setChurch}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select a church")} />
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "DEATH" && (
              <div>
                <Label>{t("Burial Place")}</Label>
                <Input value={burialPlace} onChange={(e) => setBurialPlace(e.target.value)} />
              </div>
            )}

            <div>
              <Label>
                {type === "BAPTISM" ? t("Baptizing Priest") : type === "WEDDING" ? t("Officiating Priest") : t("Officiant")}
              </Label>
              <Select value={officiantId} onValueChange={setOfficiantId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select a priest")} />
                </SelectTrigger>
                <SelectContent>
                  {fathers.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.fullName}
                      {f.churchName ? ` — ${f.churchName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerate} disabled={isSubmitting} size="lg" className="w-full">
              {isSubmitting ? t("Generating...") : t("Generate Certificate")}
            </Button>
          </CardContent>
        </Card>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> {t("Verify a Certificate")}
            </CardTitle>
            <CardDescription>{t("Look up a baptism, wedding, or death record by registration number")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <Label>{t("Type")}</Label>
                <Select value={verifyType} onValueChange={(v) => setVerifyType(v as CertificateType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {certificateOptions.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {t(v.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>{t("Registration Number")}</Label>
                <Input value={verifyRegNo} onChange={(e) => setVerifyRegNo(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleVerify} disabled={verifying || !verifyRegNo} variant="outline" className="w-full">
              {verifying ? t("Verifying...") : t("Verify")}
            </Button>
            {verifyResult && (
              <Alert variant={verifyResult.ok ? "default" : "destructive"}>
                {verifyResult.ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>{verifyResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" >
              <FileText className="h-5 w-5" style={{ color: CERT_COLOR }} /> {t("Certificate Records")}
            </CardTitle>
            <CardDescription>{t("Browse issued baptism, wedding, and death certificates")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-primary">
              {(
                [
                  { value: "BAPTISM", label: "Baptism", icon: Droplets },
                  { value: "WEDDING", label: "Wedding", icon: HeartHandshake },
                  { value: "DEATH", label: "Death", icon: Cross },
                ] as { value: RecordTab; label: string; icon: any }[]
              ).map((tab) => {
                const TabIcon = tab.icon;
                const active = recordTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setRecordTab(tab.value)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
                    style={
                      active
                        ? { backgroundColor:"#1a365d", borderColor: "#1a365d", color: "white" }
                        : { borderColor: "#cbd5e1", color: "#1a365d "}
                    }
                  >
                    <TabIcon className="h-4 w-4" />
                    {t(tab.label)}
                  </button>
                );
              })}

              {recordTab !== "DEATH" && (
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-56">
                    <Select value={recordsChurchId} onValueChange={setRecordsChurchId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select a church")} />
                      </SelectTrigger>
                      <SelectContent>
                        {churches.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Link
                    href={recordTab === "BAPTISM" ? "/baptism-certificates" : "/wedding-certificates"}
                    className="text-sm font-medium underline whitespace-nowrap"
                    style={{ color: "#1a365d" }}
                  >
                    {t("Open full page")}
                  </Link>
                </div>
              )}
              {recordTab === "DEATH" && (
                <Link
                  href="/death-records"
                  className="ml-auto text-sm font-medium underline whitespace-nowrap"
                  style={{ color: "#1a365d" }}
                >
                  {t("Open full page")}
                </Link>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "#cbd5e1" }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#e6f3f2" }}>
                  {recordTab === "BAPTISM" && (
                    <tr>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Registration No.")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Proper Name")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Christian Name")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Date of Baptism")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Church")}</th>
                    </tr>
                  )}
                  {recordTab === "WEDDING" && (
                    <tr>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Registration No.")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Groom")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Bride")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Date of Marriage")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Church")}</th>
                    </tr>
                  )}
                  {recordTab === "DEATH" && (
                    <tr>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Registration No.")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Member")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Type")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Date of Death")}</th>
                      <th className="text-left px-4 py-2" style={{ color: "#1a365d" }}>{t("Burial Place")}</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {loadingRecords && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        {t("Loading...")}
                      </td>
                    </tr>
                  )}

                  {!loadingRecords && recordTab === "BAPTISM" && baptismRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        {t("No baptism certificates found")}
                      </td>
                    </tr>
                  )}
                  {!loadingRecords &&
                    recordTab === "BAPTISM" &&
                    baptismRecords.map((r, i) => (
                      <tr key={r.registrationNo || i} className="border-t" style={{ borderColor: "#e2e8f0" }}>
                        <td className="px-4 py-2 font-mono text-xs">{r.registrationNo}</td>
                        <td className="px-4 py-2">{r.properName}</td>
                        <td className="px-4 py-2">{r.christianName}</td>
                        <td className="px-4 py-2">{r.dateOfBaptism}</td>
                        <td className="px-4 py-2">{r.church}</td>
                      </tr>
                    ))}

                  {!loadingRecords && recordTab === "WEDDING" && weddingRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        {t("No wedding certificates found")}
                      </td>
                    </tr>
                  )}
                  {!loadingRecords &&
                    recordTab === "WEDDING" &&
                    weddingRecords.map((r, i) => (
                      <tr key={r.registrationNo || i} className="border-t" style={{ borderColor: "#e2e8f0" }}>
                        <td className="px-4 py-2 font-mono text-xs">{r.registrationNo}</td>
                        <td className="px-4 py-2">{r.groomFullName}</td>
                        <td className="px-4 py-2">{r.brideFullName}</td>
                        <td className="px-4 py-2">{r.dateOfMarriage}</td>
                        <td className="px-4 py-2">{r.church}</td>
                      </tr>
                    ))}

                  {!loadingRecords && recordTab === "DEATH" && deathRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        {t("No death records found")}
                      </td>
                    </tr>
                  )}
                  {!loadingRecords &&
                    recordTab === "DEATH" &&
                    deathRecords.map((r, i) => (
                      <tr key={r.registrationNo || i} className="border-t" style={{ borderColor: "#e2e8f0" }}>
                        <td className="px-4 py-2 font-mono text-xs">{r.registrationNo}</td>
                        <td className="px-4 py-2">{r.memberName}</td>
                        <td className="px-4 py-2">{r.memberType}</td>
                        <td className="px-4 py-2">{r.dateOfDeath}</td>
                        <td className="px-4 py-2">{r.burialPlace}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {generatedCert && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{t("Preview")}</h2>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                {t("Print / Save as PDF")}
              </Button>
            </div>
            <div
              id="certificate-preview"
              className="relative border-4 p-3 bg-[#fbfcfd]"
              style={{ borderColor: CERT_COLOR }}
            >
              <div className="border-2 p-6" style={{ borderColor: CERT_COLOR }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col items-center w-20 pt-1">
                    <Award className="h-10 w-10" style={{ color: CERT_COLOR }} />
                  </div>
                  <div className="flex-1 text-center">
                    {certLang === "am" ? (
                      <p className="text-sm font-bold" style={{ color: CERT_COLOR }}>
                        የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን
                      </p>
                    ) : (
                      <p className="text-sm font-bold" style={{ color: CERT_COLOR }}>
                        ETHIOPIAN ORTHODOX TEWAHIDO CHURCH
                      </p>
                    )}
                    <p className="text-base font-bold uppercase" style={{ color: CERT_COLOR }}>
                      {t(certificateOptions.find((o) => o.value === generatedCert.type)?.label || "Certificate")}
                    </p>
                  </div>
                  <div
                    className="w-16 h-20 border flex items-center justify-center text-[9px] text-center px-1 text-muted-foreground"
                    style={{ borderColor: CERT_COLOR }}
                  >
                    {t("Photo")}
                  </div>
                </div>

                <div className="text-right text-xs mt-2" style={{ color: CERT_COLOR }}>
                  {t("Registration No.")}{" "}
                  <span className="font-mono">{generatedCert.data?.registrationNo || ""}</span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {getCertificateFields().map((f, i) => (
                    <div key={i} className="grid grid-cols-[1.4fr_1.6fr] gap-2 border-b border-dotted pb-1">
                      <span
                        className={certLang === "am" ? "text-xs" : "text-xs italic"}
                        style={certLang === "am" ? { color: CERT_COLOR } : undefined}
                      >
                        {certLang === "am" ? f.am : f.en}
                      </span>
                      <span className="text-xs font-medium">{f.value || "……………………………"}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs mt-4 leading-relaxed">
                  {t("This is to certify that")} <strong>{getCertifySubject()}</strong> {t(getCertifySentence())}
                </p>

                <div className="flex justify-between mt-8 text-xs">
                  <div className="text-center">
                    <div className="w-32 border-t border-slate-500 mb-1" />
                    {t("Church's administrator Signature")}
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-t border-slate-500 mb-1" />
                    {t("Date")} {getCertifyEventDate()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-preview,
          #certificate-preview * {
            visibility: visible;
          }
          #certificate-preview {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default function CertificatesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CertificatesPageWr />
    </Suspense>
  );
}