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
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { generateCertificate, CertificateType } from "@/services/certificateService";
import { fetchChildrenForDropdown } from "@/services/childrenService";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

const certificateOptions: { value: CertificateType; label: string; icon: any; color: string }[] = [
  { value: "BIRTH", label: "Birth Certificate", icon: Baby, color: "text-emerald-600 bg-emerald-100" },
  { value: "DEATH", label: "Death Certificate", icon: Cross, color: "text-slate-600 bg-slate-100" },
  { value: "WEDDING", label: "Wedding Certificate", icon: HeartHandshake, color: "text-rose-600 bg-rose-100" },
];

function CertificatesPageWr() {
  const { t } = useTranslation();
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

            <Button onClick={handleGenerate} disabled={isSubmitting} size="lg" className="w-full">
              {isSubmitting ? t("Generating...") : t("Generate Certificate")}
            </Button>
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
              className="relative border-8 border-double p-10 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50"
              style={{ borderColor: "#c8a951" }}
            >
              <div className="absolute inset-4 border-2 rounded" style={{ borderColor: "#c8a95155" }} />
              <div className="relative text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-amber-100 border-2" style={{ borderColor: "#c8a951" }}>
                    <Award className="h-10 w-10" style={{ color: "#c8a951" }} />
                  </div>
                </div>
                <p className="uppercase tracking-widest text-xs text-amber-700">
                  {t("Holy Trinity Church Administration")}
                </p>
                <h3 className="text-3xl font-serif font-bold text-amber-900">
                  {t(certificateOptions.find((o) => o.value === generatedCert.type)?.label || "Certificate")}
                </h3>
                <p className="text-sm text-muted-foreground">{t("This is to certify that")}</p>
                <p className="text-2xl font-serif font-semibold text-slate-800">{generatedCert.childName}</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t("is duly recorded in the church registry with the certificate details below.")}
                </p>
                <div className="flex justify-center gap-10 pt-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">{t("Certificate No.")}</div>
                    <div className="font-mono font-semibold">{generatedCert.certId}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">{t("Date Issued")}</div>
                    <div className="font-semibold">{generatedCert.date}</div>
                  </div>
                </div>
                <div className="pt-6 flex justify-between max-w-sm mx-auto text-xs text-muted-foreground">
                  <div className="text-center">
                    <div className="w-24 border-t border-slate-400 mb-1" />
                    {t("Registrar")}
                  </div>
                  <div className="text-center">
                    <div className="w-24 border-t border-slate-400 mb-1" />
                    {t("Bishop's Seal")}
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