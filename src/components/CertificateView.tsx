"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Award, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useTranslation } from "react-i18next";
import { fetchChildById } from "@/services/childrenService";

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

// ---- Dates: Gregorian (English) and Ethiopian calendar (Amharic) ----
const fmtDateEn = (d?: string) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  } catch {
    return d;
  }
};
const fmtDateAm = (d?: string) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("am-ET-u-ca-ethiopic", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
};

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

interface CertField {
  key: string;
  am: string; // Amharic label
  en: string; // English label
  value?: string; // value as stored (the language it was entered in)
  valueEn?: string; // English spelling, when known
  date?: string; // raw ISO date - rendered in both calendars
}

const getFields = (type: CertKind, d: any, en: Record<string, string>): CertField[] => {
  const f = (key: string, am: string, enLabel: string, value?: string): CertField => ({
    key,
    am,
    en: enLabel,
    value: value || "",
    valueEn: en[key] || "",
  });
  const dt = (key: string, am: string, enLabel: string, value?: string): CertField => ({
    key,
    am,
    en: enLabel,
    date: value || "",
  });
  if (type === "BAPTISM") {
    return [
      f("familyName", "የቤተሰብ ስም", "Family Name", d.familyName),
      f("properName", "የግል ስም", "Proper Name", d.properName),
      f("christianName", "የተጠመቀው(ችው) ክርስትና ስም", "Christian Name", d.christianName),
      f("fatherName", "የአባት ስም", "Father's Name", d.fatherName),
      f("motherName", "የእናት ስም", "Mother's Name", d.motherName),
      f("godParentName", "የክርስትና አባት (እናት) ስም", "God Father's or Mothers' Name", d.godParentName),
      f("country", "ሀገር", "Country", d.country),
      f("placeOfBirth", "የተወለደበት(ችበት) ቦታ", "Place of Birth", d.placeOfBirth),
      f("nationality", "የትውልድ ሀገር", "Nationality", d.nationality),
      dt("dateOfBirth", "የተወለደበት(ችበት) ቀን", "Date of Birth", d.dateOfBirth),
      dt("dateOfBaptism", "የተጠመቀበት(ችበት) ቀን", "Date of Baptism", d.dateOfBaptism),
      f("church", "የተጠመቀበት(ችበት) ቤተ ክርስቲያን", "Church", d.church),
      f("citizenship", "ዜግነት", "Citizenship", d.citizenship),
      f("baptizingPriestName", "አጥማቂው ካህን", "Baptizing Priest", d.baptizingPriestName),
    ];
  }
  if (type === "WEDDING") {
    return [
      f("groomFullName", "የሙሽራው ስም", "Groom's Name", d.groomFullName),
      f("groomNationality", "የሙሽራው ዜግነት", "Groom's Nationality", d.groomNationality),
      f("brideFullName", "የሙሽሪት ስም", "Bride's Name", d.brideFullName),
      f("brideNationality", "የሙሽሪት ዜግነት", "Bride's Nationality", d.brideNationality),
      f("country", "ሀገር", "Country", d.country),
      f("church", "የተጋቡበት ቤተ ክርስቲያን", "Church", d.church),
      dt("dateOfMarriage", "የተጋቡበት ቀን", "Date of Marriage", d.dateOfMarriage),
      f("officiatingPriestName", "አጋቢው ካህን", "Officiating Priest", d.officiatingPriestName),
      f("witness1Name", "ምስክር 1", "Witness 1", d.witness1Name),
      f("witness2Name", "ምስክር 2", "Witness 2", d.witness2Name),
      f("witness3Name", "ምስክር 3", "Witness 3", d.witness3Name),
    ];
  }
  return [
    f("fullName", "ሙሉ ስም", "Full Name", d.fullName || d.memberName),
    f("sebekaMemberId", "የሰበካ አባል መለያ", "Sebeka Member ID", d.sebekaMemberId),
    f("memberType", "የአባልነት ዓይነት", "Member Type", d.memberType),
    f("occupation", "የስራ መደብ", "Occupation", d.occupation),
    f("rankOrTitle", "ማዕረግ", "Rank / Title", d.rankOrTitle),
    dt("dateOfDeath", "የሞተበት ቀን", "Date of Death", d.dateOfDeath),
    f("burialPlace", "የተቀበረበት ቦታ", "Burial Place", d.burialPlace),
    f("officiant", "አስፈጻሚ", "Officiant", d.officiant),
    f("remarks", "ማስታወሻ", "Remarks", d.remarks),
  ];
};

const getSubject = (type: CertKind, d: any, en: Record<string, string>) => {
  const am =
    type === "BAPTISM"
      ? `${d.properName || ""} ${d.familyName || ""}`.trim()
      : type === "WEDDING"
      ? `${d.groomFullName || ""} & ${d.brideFullName || ""}`.trim()
      : d.fullName || d.memberName || "";
  const eng =
    type === "BAPTISM"
      ? `${en.properName || ""} ${en.familyName || ""}`.trim()
      : type === "WEDDING"
      ? en.groomFullName && en.brideFullName
        ? `${en.groomFullName} & ${en.brideFullName}`
        : ""
      : en.fullName || "";
  return { am, en: eng };
};

const getEventDate = (type: CertKind, d: any) =>
  type === "BAPTISM" ? d.dateOfBaptism : type === "WEDDING" ? d.dateOfMarriage : d.dateOfDeath;

const SENTENCE: Record<CertKind, { am: string; en: string }> = {
  BAPTISM: {
    am: "በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ሥርዓትና ሕግ መሠረት ከላይ በተገለጸው ቦታና ቀን መጠመቁን(ቋን) እናረጋግጣለን።",
    en: "is baptized according to the Law and Order of Ethiopian Orthodox Tewahido Church at the above mentioned place and date.",
  },
  WEDDING: {
    am: "በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ሥርዓትና ሕግ መሠረት ከላይ በተገለጸው ቤተ ክርስቲያንና ቀን መጋባታቸውን እናረጋግጣለን።",
    en: "were married according to the Law and Order of Ethiopian Orthodox Tewahido Church at the above mentioned church and date.",
  },
  DEATH: {
    am: "በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን መዝገብ መሠረት ማረፉን(ፏን) እናረጋግጣለን።",
    en: "departed this life, as recorded according to the records of Ethiopian Orthodox Tewahido Church.",
  },
};

const CERT_TITLES_AM: Record<CertKind, string> = {
  BAPTISM: "የጥምቀት የምስክር ወረቀት",
  WEDDING: "የጋብቻ የምስክር ወረቀት",
  DEATH: "የሞት የምስክር ወረቀት",
};

const enName = (c: any) =>
  [c?.firstNameEn, c?.middleNameEn, c?.lastNameEn].filter(Boolean).join(" ");

interface CertificatePaperProps {
  type: CertKind;
  data: any;
  photos?: CertPhotos;
  // optional explicit child ids (otherwise taken from the record: childId / groomChildId / brideChildId / memberId)
  childIds?: { main?: string; groom?: string; bride?: string };
}

// The printable certificate itself - always bilingual (Amharic + English).
// English spellings of the names come from the child records (firstNameEn / middleNameEn / lastNameEn).
// Forward the ref so react-to-print can target it.
export const CertificatePaper = forwardRef<HTMLDivElement, CertificatePaperProps>(
  ({ type, data, photos, childIds }, ref) => {
    const { t } = useTranslation();
    const d = data || {};
    const [en, setEn] = useState<Record<string, string>>({});

    const mainId = childIds?.main || d.childId || (type === "DEATH" && (!d.memberType || d.memberType === "CHILD") ? d.memberId : undefined);
    const groomId = childIds?.groom || d.groomChildId;
    const brideId = childIds?.bride || d.brideChildId;

    useEffect(() => {
      let cancelled = false;
      (async () => {
        const out: Record<string, string> = {};
        try {
          if (type === "WEDDING") {
            const [g, b] = await Promise.all([
              groomId ? fetchChildById(groomId).catch(() => null) : null,
              brideId ? fetchChildById(brideId).catch(() => null) : null,
            ]);
            if (g && enName(g)) out.groomFullName = enName(g);
            if (b && enName(b)) out.brideFullName = enName(b);
          } else if (mainId) {
            const c: any = await fetchChildById(mainId).catch(() => null);
            if (c && enName(c)) {
              if (type === "BAPTISM") {
                if (c.firstNameEn) out.properName = c.firstNameEn;
                if (c.lastNameEn) out.familyName = c.lastNameEn;
              } else {
                out.fullName = enName(c);
              }
            }
          }
        } catch {
          /* English spelling is optional */
        }
        if (!cancelled) setEn(out);
      })();
      return () => {
        cancelled = true;
      };
    }, [type, mainId, groomId, brideId]);

    const subject = getSubject(type, d, en);
    const eventDate = getEventDate(type, d);

    return (
      <div ref={ref} className="relative border-4 p-3 bg-[#fbfcfd] text-slate-900" style={{ borderColor: CERT_COLOR }}>
        <div className="border-2 p-6" style={{ borderColor: CERT_COLOR }}>
          <div className="flex items-start justify-between gap-4">
            {type === "WEDDING" ? (
              <CertPhoto src={photos?.groom} label={`${t("Groom")} / Groom`} />
            ) : (
              <div className="flex flex-col items-center w-20 pt-1">
                <Award className="h-10 w-10" style={{ color: CERT_COLOR }} />
              </div>
            )}
            <div className="flex-1 text-center space-y-0.5">
              <p className="text-sm font-bold" style={{ color: CERT_COLOR }}>
                የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን
              </p>
              <p className="text-xs font-bold tracking-wide" style={{ color: CERT_COLOR }}>
                ETHIOPIAN ORTHODOX TEWAHIDO CHURCH
              </p>
              <p className="text-base font-bold pt-1" style={{ color: CERT_COLOR }}>
                {CERT_TITLES_AM[type]}
              </p>
              <p className="text-sm font-bold uppercase" style={{ color: CERT_COLOR }}>
                {CERT_TITLES[type]}
              </p>
            </div>
            {type === "WEDDING" ? (
              <CertPhoto src={photos?.bride} label={`${t("Bride")} / Bride`} />
            ) : (
              <CertPhoto src={photos?.main} label="ፎቶ / Photo" />
            )}
          </div>

          <div className="text-right text-xs mt-2" style={{ color: CERT_COLOR }}>
            የምዝገባ ቁጥር / Registration No. <span className="font-mono">{d.registrationNo || ""}</span>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {getFields(type, d, en).map((f) => (
              <div key={f.key} className="grid grid-cols-[1.4fr_1.6fr] gap-2 border-b border-dotted pb-1">
                <span className="text-xs leading-tight">
                  <span className="block" style={{ color: CERT_COLOR }}>
                    {f.am}
                  </span>
                  <span className="block italic text-slate-600">{f.en}</span>
                </span>
                <span className="text-xs font-medium leading-tight">
                  {f.date !== undefined ? (
                    f.date ? (
                      <>
                        <span className="block">{fmtDateAm(f.date) || fmtDateEn(f.date)}</span>
                        {fmtDateAm(f.date) && <span className="block text-slate-600">{fmtDateEn(f.date)}</span>}
                      </>
                    ) : (
                      "……………………………"
                    )
                  ) : f.value || f.valueEn ? (
                    <>
                      {f.value && <span className="block">{f.value}</span>}
                      {f.valueEn && f.valueEn !== f.value && <span className="block text-slate-600">{f.valueEn}</span>}
                    </>
                  ) : (
                    "……………………………"
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="text-xs mt-4 leading-relaxed space-y-2">
            <p>
              ይህ የምስክር ወረቀት <strong>{subject.am}</strong> {SENTENCE[type].am}
            </p>
            <p className="text-slate-700">
              This is to certify that <strong>{subject.en || subject.am}</strong> {SENTENCE[type].en}
            </p>
          </div>

          <div className="flex justify-between mt-8 text-xs">
            <div className="text-center">
              <div className="w-36 border-t border-slate-500 mb-1" />
              <div>የቤተ ክርስቲያኑ አስተዳዳሪ ፊርማ</div>
              <div className="text-slate-600">Church&apos;s administrator Signature</div>
            </div>
            <div className="text-center">
              <div className="w-36 border-t border-slate-500 mb-1" />
              <div>ቀን / Date</div>
              <div>{eventDate ? fmtDateAm(eventDate) || fmtDateEn(eventDate) : ""}</div>
              <div className="text-slate-600">{eventDate ? fmtDateEn(eventDate) : ""}</div>
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
