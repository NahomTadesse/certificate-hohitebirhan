"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Baby,
  Cross,
  HeartHandshake,
  Award,
  Droplets,
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
import { generateCertificate, CertificateType, checkCertificateEligibility } from "@/services/certificateService";
import { verifyBaptismCertificate } from "@/services/baptismCertificateService";
import { verifyWeddingCertificate } from "@/services/weddingCertificateService";
import { verifyDeathRecord } from "@/services/deathRecordService";
import { fetchChildrenForDropdown } from "@/services/childrenService";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

const certificateOptions: { value: CertificateType; label: string; icon: any; color: string }[] = [
  { value: "BAPTISM", label: "Baptism Certificate", icon: Droplets, color: "text-sky-600 bg-sky-100" },
  { value: "BIRTH", label: "Birth Certificate", icon: Baby, color: "text-emerald-600 bg-emerald-100" },
  { value: "DEATH", label: "Death Certificate", icon: Cross, color: "text-slate-600 bg-slate-100" },
  { value: "WEDDING", label: "Wedding Certificate", icon: HeartHandshake, color: "text-rose-600 bg-rose-100" },
];

const verifiableTypes: { value: "BAPTISM" | "WEDDING" | "DEATH"; label: string }[] = [
  { value: "BAPTISM", label: "Baptism Certificate" },
  { value: "WEDDING", label: "Wedding Certificate" },
  { value: "DEATH", label: "Death Record" },
];

function CertificatesPageWr() {
  const { t, i18n } = useTranslation();
  const certLang = i18n.language === "am" ? "am" : "en";
  const searchParams = useSearchParams();
  const [children, setChildren] = useState<{ id: string; fullName: string }[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [childId, setChildId] = useState(searchParams?.get("childId") || "");
  const [type, setType] = useState<CertificateType>("BIRTH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [generatedCert, setGeneratedCert] = useState<{
    type: CertificateType;
    childName: string;
    certId: string;
    date: string;
  } | null>(null);

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

  const handleGenerate = async () => {
    if (!childId) {
      setAlert({ type: "error", message: "Please select a child." });
      return;
    }
    setIsSubmitting(true);
    setAlert(null);
    try {
      await generateCertificate(childId, type);
      const childName = children.find((c) => c.id === childId)?.fullName || "Unknown";
      setGeneratedCert({
        type,
        childName,
        certId: `HC-${type.slice(0, 3)}-${Math.floor(100000 + Math.random() * 899999)}`,
        date: new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
      });
      setAlert({ type: "success", message: "Certificate generated successfully!" });
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Certificate generation failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const [eligibility, setEligibility] = useState<string | null>(null);
  const handleCheckEligibility = async () => {
    if (!childId) {
      setAlert({ type: "error", message: "Please select a child first." });
      return;
    }
    try {
      const res = await checkCertificateEligibility(childId);
      setEligibility(res?.message || (res?.success ? "Eligible" : "Not eligible"));
    } catch (err: any) {
      setEligibility(err.message || "Could not determine eligibility");
    }
  };

  // --- Verification tool ---
  const [verifyType, setVerifyType] = useState<"BAPTISM" | "WEDDING" | "DEATH">("BAPTISM");
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
      setVerifyResult({ ok: res?.success !== false, message: res?.message || "Verification complete." });
    } catch (err: any) {
      setVerifyResult({ ok: false, message: err.message || "Verification failed." });
    } finally {
      setVerifying(false);
    }
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

        {alert && (
          <Alert variant={alert.type === "error" ? "destructive" : "default"}>
            {alert.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

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
            <CardDescription>{t("Select the child and certificate type above, then generate")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("Child")} *</Label>
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

            <div>
              <Label>{t("Certificate Type")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as CertificateType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {certificateOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={isSubmitting} size="lg" className="flex-1">
                {isSubmitting ? t("Generating...") : t("Generate Certificate")}
              </Button>
              <Button onClick={handleCheckEligibility} variant="outline" size="lg">
                {t("Check Eligibility")}
              </Button>
            </div>
            {eligibility && (
              <p className="text-sm text-muted-foreground border rounded-md p-2">{eligibility}</p>
            )}
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
                <Select value={verifyType} onValueChange={(v) => setVerifyType(v as typeof verifyType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {verifiableTypes.map((v) => (
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
              className="relative border-4 p-3 bg-[#fdf8ec]"
              style={{ borderColor: "#1e3a8a" }}
            >
              <div className="border-2 p-6" style={{ borderColor: "#1e3a8a" }}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col items-center w-20 pt-1">
                    <Award className="h-10 w-10" style={{ color: "#1e3a8a" }} />
                  </div>
                  <div className="flex-1 text-center">
                    {certLang === "am" ? (
                      <p className="text-sm font-bold" style={{ color: "#1e3a8a" }}>
                        የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን
                      </p>
                    ) : (
                      <p className="text-sm font-bold" style={{ color: "#1e3a8a" }}>
                        ETHIOPIAN ORTHODOX TEWAHIDO CHURCH
                      </p>
                    )}
                    <p className="text-base font-bold uppercase" style={{ color: "#1e3a8a" }}>
                      {t(certificateOptions.find((o) => o.value === generatedCert.type)?.label || "Certificate")}
                    </p>
                  </div>
                  <div
                    className="w-16 h-20 border flex items-center justify-center text-[9px] text-center px-1 text-muted-foreground"
                    style={{ borderColor: "#1e3a8a" }}
                  >
                    {t("Photo")}
                  </div>
                </div>

                <div className="text-right text-xs mt-2" style={{ color: "#1e3a8a" }}>
                  {t("Registration No.")} <span className="font-mono">{generatedCert.certId}</span>
                </div>

                {/* Fields */}
                <div className="mt-4 space-y-2 text-sm">
                  {[
                    { am: "የቤተሰብ ስም", en: "Family Name", value: generatedCert.childName.split(" ").slice(-1)[0] },
                    { am: "የግል ስም", en: "Proper Name", value: generatedCert.childName.split(" ")[0] },
                    { am: "የተጠመቀው(ችው) ክርስትና ስም", en: "Christian Name", value: "" },
                    { am: "የአባት ስም", en: "Father's Name", value: "" },
                    { am: "የእናት ስም", en: "Mother's Name", value: "" },
                    { am: "የክርስትና አባት (እናት) ስም", en: "God Father's or Mothers' Name", value: "" },
                    { am: "ሀገር", en: "Country", value: "" },
                    { am: "የተወለደበት(ችበት) ቦታ", en: "Place of Birth", value: "" },
                    { am: "የትውልድ ሀገር", en: "Nationality", value: "" },
                    { am: "የተወለደበት(ችበት) ቀን", en: "Date of Birth", value: "" },
                    { am: "የተጠመቀበት(ችበት) ቀን", en: "Date of Baptism", value: generatedCert.date },
                    { am: "የተጠመቀበት(ችበት) ቤተ ክርስቲያን", en: "Church", value: "" },
                    { am: "ዜግነት", en: "Citizenship", value: "" },
                    { am: "አጥማቂው ካህን", en: "Baptizing Priest", value: "" },
                  ].map((f, i) => (
                    <div key={i} className="grid grid-cols-[1.4fr_1.6fr] gap-2 border-b border-dotted pb-1">
                      <span
                        className={certLang === "am" ? "text-xs" : "text-xs italic"}
                        style={certLang === "am" ? { color: "#1e3a8a" } : undefined}
                      >
                        {certLang === "am" ? f.am : f.en}
                      </span>
                      <span className="text-xs font-medium">{f.value || "……………………………"}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs mt-4 leading-relaxed">
                  {t("This is to certify that")} <strong>{generatedCert.childName}</strong>{" "}
                  {t(
                    "is baptized according to the Law and Order of Ethiopian Orthodox Tewahido Church at the above mentioned place and date."
                  )}
                </p>

                <div className="flex justify-between mt-8 text-xs">
                  <div className="text-center">
                    <div className="w-32 border-t border-slate-500 mb-1" />
                    {t("Church's administrator Signature")}
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-t border-slate-500 mb-1" />
                    {t("Date")} {generatedCert.date}
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