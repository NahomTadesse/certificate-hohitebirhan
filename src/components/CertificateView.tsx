"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Award, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type CertKind = "BAPTISM" | "WEDDING" | "DEATH";

export interface CertPhotos {
  main?: string | null;
  groom?: string | null;
  bride?: string | null;
}

const CERT_COLOR = "#6bb1f7";

export const CERT_TITLES: Record<CertKind, string> = {
  BAPTISM: "Baptism Certificate",
  WEDDING: "Wedding Certificate",
  DEATH: "Death Certificate",
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

// Passport-style photo box. Falls back to a labelled empty frame.
function CertPhoto({ src, label }: { src?: string | null; label: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div
      className="w-20 h-24 border flex items-center justify-center text-[9px] text-center text-muted-foreground overflow-hidden shrink-0 bg-white"
      style={{ borderColor: CERT_COLOR }}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        label
      )}
    </div>
  );
}

const getFields = (type: CertKind, d: any): { am: string; en: string; value: string }[] => {
  if (type === "BAPTISM") {
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
  if (type === "WEDDING") {
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
  return [
    { am: "ሙሉ ስም", en: "Full Name", value: d.fullName || d.memberName },
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

const getSubject = (type: CertKind, d: any) => {
  if (type === "BAPTISM") return `${d.properName || ""} ${d.familyName || ""}`.trim();
  if (type === "WEDDING") return `${d.groomFullName || ""} & ${d.brideFullName || ""}`.trim();
  return d.fullName || d.memberName || "";
};

const getEventDate = (type: CertKind, d: any) =>
  type === "BAPTISM" ? fmtDate(d.dateOfBaptism) : type === "WEDDING" ? fmtDate(d.dateOfMarriage) : fmtDate(d.dateOfDeath);

const getSentence = (type: CertKind) =>
  type === "BAPTISM"
    ? "is baptized according to the Law and Order of Ethiopian Orthodox Tewahido Church at the above mentioned place and date."
    : type === "WEDDING"
    ? "were married according to the Law and Order of Ethiopian Orthodox Tewahido Church at the above mentioned church and date."
    : "departed this life, as recorded according to the records of Ethiopian Orthodox Tewahido Church.";

interface CertificatePaperProps {
  type: CertKind;
  data: any;
  photos?: CertPhotos;
}

// The printable certificate itself. Forward the ref so react-to-print can target it.
export const CertificatePaper = forwardRef<HTMLDivElement, CertificatePaperProps>(
  ({ type, data, photos }, ref) => {
    const { t, i18n } = useTranslation();
    const certLang = i18n.language === "am" ? "am" : "en";
    const d = data || {};

    return (
      <div ref={ref} className="relative border-4 p-3 bg-[#fbfcfd] text-slate-900" style={{ borderColor: CERT_COLOR }}>
        <div className="border-2 p-6" style={{ borderColor: CERT_COLOR }}>
          <div className="flex items-start justify-between gap-4">
            {type === "WEDDING" ? (
              <CertPhoto src={photos?.groom} label={t("Groom")} />
            ) : (
              <div className="flex flex-col items-center w-20 pt-1">
                <Award className="h-10 w-10" style={{ color: CERT_COLOR }} />
              </div>
            )}
            <div className="flex-1 text-center">
              <p className="text-sm font-bold" style={{ color: CERT_COLOR }}>
                {certLang === "am" ? "የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን" : "ETHIOPIAN ORTHODOX TEWAHIDO CHURCH"}
              </p>
              <p className="text-base font-bold uppercase" style={{ color: CERT_COLOR }}>
                {t(CERT_TITLES[type])}
              </p>
            </div>
            {type === "WEDDING" ? (
              <CertPhoto src={photos?.bride} label={t("Bride")} />
            ) : (
              <CertPhoto src={photos?.main} label={t("Photo")} />
            )}
          </div>

          <div className="text-right text-xs mt-2" style={{ color: CERT_COLOR }}>
            {t("Registration No.")} <span className="font-mono">{d.registrationNo || ""}</span>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {getFields(type, d).map((f, i) => (
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
            {t("This is to certify that")} <strong>{getSubject(type, d)}</strong> {t(getSentence(type))}
          </p>

          <div className="flex justify-between mt-8 text-xs">
            <div className="text-center">
              <div className="w-32 border-t border-slate-500 mb-1" />
              {t("Church's administrator Signature")}
            </div>
            <div className="text-center">
              <div className="w-32 border-t border-slate-500 mb-1" />
              {t("Date")} {getEventDate(type, d)}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
CertificatePaper.displayName = "CertificatePaper";

interface CertificateViewDialogProps {
  open: boolean;
  onClose: () => void;
  type: CertKind;
  data: any;
  photos?: CertPhotos;
}

// "Show certificate": opens a saved record as the printable certificate so it can be
// printed again or saved as a PDF (choose "Save as PDF" in the print dialog).
export function CertificateViewDialog({ open, onClose, type, data, photos }: CertificateViewDialogProps) {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${type.toLowerCase()}-certificate-${data?.registrationNo || ""}`,
    pageStyle: "@page { size: A4; margin: 12mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(CERT_TITLES[type])}</DialogTitle>
        </DialogHeader>
        {data && <CertificatePaper ref={printRef} type={type} data={data} photos={photos} />}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("Close")}
          </Button>
          <Button onClick={() => handlePrint()}>
            <Printer className="h-4 w-4 mr-2" />
            {t("Print / Save as PDF")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CertificateViewDialog;
