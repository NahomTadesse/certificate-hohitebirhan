// "use client";

// import { forwardRef, useEffect, useRef, useState } from "react";
// import { Award, Printer } from "lucide-react";
// import { useReactToPrint } from "react-to-print";
// import { useTranslation } from "react-i18next";
// import { fetchChildById } from "@/services/childrenService";

// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// export type CertKind = "BAPTISM" | "WEDDING" | "DEATH";

// export interface CertPhotos {
//   main?: string | null;
//   groom?: string | null;
//   bride?: string | null;
// }

// const CERT_COLOR = "#6bb1f7";

// export const CERT_TITLES: Record<CertKind, string> = {
//   BAPTISM: "Baptism Certificate",
//   WEDDING: "Wedding Certificate",
//   DEATH: "Death Certificate",
// };

// // ---- Dates: Gregorian (English) and Ethiopian calendar (Amharic) ----
// const fmtDateEn = (d?: string) => {
//   if (!d) return "";
//   try {
//     return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
//   } catch {
//     return d;
//   }
// };
// const fmtDateAm = (d?: string) => {
//   if (!d) return "";
//   try {
//     return new Date(d).toLocaleDateString("am-ET-u-ca-ethiopic", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       timeZone: "UTC",
//     });
//   } catch {
//     return "";
//   }
// };

// // Passport-style photo box. Falls back to a labelled empty frame.
// function CertPhoto({ src, label }: { src?: string | null; label: string }) {
//   const [failed, setFailed] = useState(false);
//   useEffect(() => setFailed(false), [src]);
//   return (
//     <div
//       className="w-20 h-24 border flex items-center justify-center text-[9px] text-center text-muted-foreground overflow-hidden shrink-0 bg-white"
//       style={{ borderColor: CERT_COLOR }}
//     >
//       {src && !failed ? (
//         // eslint-disable-next-line @next/next/no-img-element
//         <img src={src} alt={label} className="h-full w-full object-cover" onError={() => setFailed(true)} />
//       ) : (
//         label
//       )}
//     </div>
//   );
// }

// interface CertField {
//   key: string;
//   am: string; // Amharic label
//   en: string; // English label
//   value?: string; // value as stored (the language it was entered in)
//   valueEn?: string; // English spelling, when known
//   date?: string; // raw ISO date - rendered in both calendars
// }

// const getFields = (type: CertKind, d: any, en: Record<string, string>): CertField[] => {
//   const f = (key: string, am: string, enLabel: string, value?: string): CertField => ({
//     key,
//     am,
//     en: enLabel,
//     value: value || "",
//     valueEn: en[key] || "",
//   });
//   const dt = (key: string, am: string, enLabel: string, value?: string): CertField => ({
//     key,
//     am,
//     en: enLabel,
//     date: value || "",
//   });
//   if (type === "BAPTISM") {
//     return [
//       f("familyName", "የቤተሰብ ስም", "Family Name", d.familyName),
//       f("properName", "የግል ስም", "Proper Name", d.properName),
//       f("christianName", "የተጠመቀው(ችው) ክርስትና ስም", "Christian Name", d.christianName),
//       f("fatherName", "የአባት ስም", "Father's Name", d.fatherName),
//       f("motherName", "የእናት ስም", "Mother's Name", d.motherName),
//       f("godParentName", "የክርስትና አባት (እናት) ስም", "God Father's or Mothers' Name", d.godParentName),
//       f("country", "ሀገር", "Country", d.country),
//       f("placeOfBirth", "የተወለደበት(ችበት) ቦታ", "Place of Birth", d.placeOfBirth),
//       f("nationality", "የትውልድ ሀገር", "Nationality", d.nationality),
//       dt("dateOfBirth", "የተወለደበት(ችበት) ቀን", "Date of Birth", d.dateOfBirth),
//       dt("dateOfBaptism", "የተጠመቀበት(ችበት) ቀን", "Date of Baptism", d.dateOfBaptism),
//       f("church", "የተጠመቀበት(ችበት) ቤተ ክርስቲያን", "Church", d.church),
//       f("citizenship", "ዜግነት", "Citizenship", d.citizenship),
//       f("baptizingPriestName", "አጥማቂው ካህን", "Baptizing Priest", d.baptizingPriestName),
//     ];
//   }
//   if (type === "WEDDING") {
//     return [
//       f("groomFullName", "የሙሽራው ስም", "Groom's Name", d.groomFullName),
//       f("groomNationality", "የሙሽራው ዜግነት", "Groom's Nationality", d.groomNationality),
//       f("brideFullName", "የሙሽሪት ስም", "Bride's Name", d.brideFullName),
//       f("brideNationality", "የሙሽሪት ዜግነት", "Bride's Nationality", d.brideNationality),
//       f("country", "ሀገር", "Country", d.country),
//       f("church", "የተጋቡበት ቤተ ክርስቲያን", "Church", d.church),
//       dt("dateOfMarriage", "የተጋቡበት ቀን", "Date of Marriage", d.dateOfMarriage),
//       f("officiatingPriestName", "አጋቢው ካህን", "Officiating Priest", d.officiatingPriestName),
//       f("witness1Name", "ምስክር 1", "Witness 1", d.witness1Name),
//       f("witness2Name", "ምስክር 2", "Witness 2", d.witness2Name),
//       f("witness3Name", "ምስክር 3", "Witness 3", d.witness3Name),
//     ];
//   }
//   return [
//     f("fullName", "ሙሉ ስም", "Full Name", d.fullName || d.memberName),
//     f("sebekaMemberId", "የሰበካ አባል መለያ", "Sebeka Member ID", d.sebekaMemberId),
//     f("memberType", "የአባልነት ዓይነት", "Member Type", d.memberType),
//     f("occupation", "የስራ መደብ", "Occupation", d.occupation),
//     f("rankOrTitle", "ማዕረግ", "Rank / Title", d.rankOrTitle),
//     dt("dateOfDeath", "የሞተበት ቀን", "Date of Death", d.dateOfDeath),
//     f("burialPlace", "የተቀበረበት ቦታ", "Burial Place", d.burialPlace),
//     f("officiant", "አስፈጻሚ", "Officiant", d.officiant),
//     f("remarks", "ማስታወሻ", "Remarks", d.remarks),
//   ];
// };

// const getSubject = (type: CertKind, d: any, en: Record<string, string>) => {
//   const am =
//     type === "BAPTISM"
//       ? `${d.properName || ""} ${d.familyName || ""}`.trim()
//       : type === "WEDDING"
//       ? `${d.groomFullName || ""} & ${d.brideFullName || ""}`.trim()
//       : d.fullName || d.memberName || "";
//   const eng =
//     type === "BAPTISM"
//       ? `${en.properName || ""} ${en.familyName || ""}`.trim()
//       : type === "WEDDING"
//       ? en.groomFullName && en.brideFullName
//         ? `${en.groomFullName} & ${en.brideFullName}`
//         : ""
//       : en.fullName || "";
//   return { am, en: eng };
// };

// const getEventDate = (type: CertKind, d: any) =>
//   type === "BAPTISM" ? d.dateOfBaptism : type === "WEDDING" ? d.dateOfMarriage : d.dateOfDeath;

// const SENTENCE: Record<CertKind, { am: string; en: string }> = {
//   BAPTISM: {
//     am: "በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ሥርዓትና ሕግ መሠረት ከላይ በተገለጸው ቦታና ቀን መጠመቁን(ቋን) እናረጋግጣለን።",
//     en: "is baptized according to the Law and Order of Ethiopian Orthodox Tewahido Church at the above mentioned place and date.",
//   },
//   WEDDING: {
//     am: "በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ሥርዓትና ሕግ መሠረት ከላይ በተገለጸው ቤተ ክርስቲያንና ቀን መጋባታቸውን እናረጋግጣለን።",
//     en: "were married according to the Law and Order of Ethiopian Orthodox Tewahido Church at the above mentioned church and date.",
//   },
//   DEATH: {
//     am: "በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን መዝገብ መሠረት ማረፉን(ፏን) እናረጋግጣለን።",
//     en: "departed this life, as recorded according to the records of Ethiopian Orthodox Tewahido Church.",
//   },
// };

// const CERT_TITLES_AM: Record<CertKind, string> = {
//   BAPTISM: "የጥምቀት የምስክር ወረቀት",
//   WEDDING: "የጋብቻ የምስክር ወረቀት",
//   DEATH: "የሞት የምስክር ወረቀት",
// };

// const enName = (c: any) =>
//   [c?.firstNameEn, c?.middleNameEn, c?.lastNameEn].filter(Boolean).join(" ");

// interface CertificatePaperProps {
//   type: CertKind;
//   data: any;
//   photos?: CertPhotos;
//   // optional explicit child ids (otherwise taken from the record: childId / groomChildId / brideChildId / memberId)
//   childIds?: { main?: string; groom?: string; bride?: string };
// }

// // The printable certificate itself - always bilingual (Amharic + English).
// // English spellings of the names come from the child records (firstNameEn / middleNameEn / lastNameEn).
// // Forward the ref so react-to-print can target it.
// export const CertificatePaper = forwardRef<HTMLDivElement, CertificatePaperProps>(
//   ({ type, data, photos, childIds }, ref) => {
//     const { t } = useTranslation();
//     const d = data || {};
//     const [en, setEn] = useState<Record<string, string>>({});

//     const mainId = childIds?.main || d.childId || (type === "DEATH" && (!d.memberType || d.memberType === "CHILD") ? d.memberId : undefined);
//     const groomId = childIds?.groom || d.groomChildId;
//     const brideId = childIds?.bride || d.brideChildId;

//     useEffect(() => {
//       let cancelled = false;
//       (async () => {
//         const out: Record<string, string> = {};
//         try {
//           if (type === "WEDDING") {
//             const [g, b] = await Promise.all([
//               groomId ? fetchChildById(groomId).catch(() => null) : null,
//               brideId ? fetchChildById(brideId).catch(() => null) : null,
//             ]);
//             if (g && enName(g)) out.groomFullName = enName(g);
//             if (b && enName(b)) out.brideFullName = enName(b);
//           } else if (mainId) {
//             const c: any = await fetchChildById(mainId).catch(() => null);
//             if (c && enName(c)) {
//               if (type === "BAPTISM") {
//                 if (c.firstNameEn) out.properName = c.firstNameEn;
//                 if (c.lastNameEn) out.familyName = c.lastNameEn;
//               } else {
//                 out.fullName = enName(c);
//               }
//             }
//           }
//         } catch {
//           /* English spelling is optional */
//         }
//         if (!cancelled) setEn(out);
//       })();
//       return () => {
//         cancelled = true;
//       };
//     }, [type, mainId, groomId, brideId]);

//     const subject = getSubject(type, d, en);
//     const eventDate = getEventDate(type, d);

//     return (
//       <div ref={ref} className="relative border-4 p-3 bg-[#fbfcfd] text-slate-900" style={{ borderColor: CERT_COLOR }}>
//         <div className="border-2 p-6" style={{ borderColor: CERT_COLOR }}>
//           <div className="flex items-start justify-between gap-4">
//             {type === "WEDDING" ? (
//               <CertPhoto src={photos?.groom} label={`${t("Groom")} / Groom`} />
//             ) : (
//               <div className="flex flex-col items-center w-20 pt-1">
//                 <Award className="h-10 w-10" style={{ color: CERT_COLOR }} />
//               </div>
//             )}
//             <div className="flex-1 text-center space-y-0.5">
//               <p className="text-sm font-bold" style={{ color: CERT_COLOR }}>
//                 የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን
//               </p>
//               <p className="text-xs font-bold tracking-wide" style={{ color: CERT_COLOR }}>
//                 ETHIOPIAN ORTHODOX TEWAHIDO CHURCH
//               </p>
//               <p className="text-base font-bold pt-1" style={{ color: CERT_COLOR }}>
//                 {CERT_TITLES_AM[type]}
//               </p>
//               <p className="text-sm font-bold uppercase" style={{ color: CERT_COLOR }}>
//                 {CERT_TITLES[type]}
//               </p>
//             </div>
//             {type === "WEDDING" ? (
//               <CertPhoto src={photos?.bride} label={`${t("Bride")} / Bride`} />
//             ) : (
//               <CertPhoto src={photos?.main} label="ፎቶ / Photo" />
//             )}
//           </div>

//           <div className="text-right text-xs mt-2" style={{ color: CERT_COLOR }}>
//             የምዝገባ ቁጥር / Registration No. <span className="font-mono">{d.registrationNo || ""}</span>
//           </div>

//           <div className="mt-4 space-y-2 text-sm">
//             {getFields(type, d, en).map((f) => (
//               <div key={f.key} className="grid grid-cols-[1.4fr_1.6fr] gap-2 border-b border-dotted pb-1">
//                 <span className="text-xs leading-tight">
//                   <span className="block" style={{ color: CERT_COLOR }}>
//                     {f.am}
//                   </span>
//                   <span className="block italic text-slate-600">{f.en}</span>
//                 </span>
//                 <span className="text-xs font-medium leading-tight">
//                   {f.date !== undefined ? (
//                     f.date ? (
//                       <>
//                         <span className="block">{fmtDateAm(f.date) || fmtDateEn(f.date)}</span>
//                         {fmtDateAm(f.date) && <span className="block text-slate-600">{fmtDateEn(f.date)}</span>}
//                       </>
//                     ) : (
//                       "……………………………"
//                     )
//                   ) : f.value || f.valueEn ? (
//                     <>
//                       {f.value && <span className="block">{f.value}</span>}
//                       {f.valueEn && f.valueEn !== f.value && <span className="block text-slate-600">{f.valueEn}</span>}
//                     </>
//                   ) : (
//                     "……………………………"
//                   )}
//                 </span>
//               </div>
//             ))}
//           </div>

//           <div className="text-xs mt-4 leading-relaxed space-y-2">
//             <p>
//               ይህ የምስክር ወረቀት <strong>{subject.am}</strong> {SENTENCE[type].am}
//             </p>
//             <p className="text-slate-700">
//               This is to certify that <strong>{subject.en || subject.am}</strong> {SENTENCE[type].en}
//             </p>
//           </div>

//           <div className="flex justify-between mt-8 text-xs">
//             <div className="text-center">
//               <div className="w-36 border-t border-slate-500 mb-1" />
//               <div>የቤተ ክርስቲያኑ አስተዳዳሪ ፊርማ</div>
//               <div className="text-slate-600">Church&apos;s administrator Signature</div>
//             </div>
//             <div className="text-center">
//               <div className="w-36 border-t border-slate-500 mb-1" />
//               <div>ቀን / Date</div>
//               <div>{eventDate ? fmtDateAm(eventDate) || fmtDateEn(eventDate) : ""}</div>
//               <div className="text-slate-600">{eventDate ? fmtDateEn(eventDate) : ""}</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }
// );
// CertificatePaper.displayName = "CertificatePaper";

// interface CertificateViewDialogProps {
//   open: boolean;
//   onClose: () => void;
//   type: CertKind;
//   data: any;
//   photos?: CertPhotos;
// }

// // "Show certificate": opens a saved record as the printable certificate so it can be
// // printed again or saved as a PDF (choose "Save as PDF" in the print dialog).
// export function CertificateViewDialog({ open, onClose, type, data, photos }: CertificateViewDialogProps) {
//   const { t } = useTranslation();
//   const printRef = useRef<HTMLDivElement>(null);

//   const handlePrint = useReactToPrint({
//     contentRef: printRef,
//     documentTitle: `${type.toLowerCase()}-certificate-${data?.registrationNo || ""}`,
//     pageStyle: "@page { size: A4; margin: 12mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
//   });

//   return (
//     <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
//       <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>{t(CERT_TITLES[type])}</DialogTitle>
//         </DialogHeader>
//         {data && <CertificatePaper ref={printRef} type={type} data={data} photos={photos} />}
//         <DialogFooter>
//           <Button variant="outline" onClick={onClose}>
//             {t("Close")}
//           </Button>
//           <Button onClick={() => handlePrint()}>
//             <Printer className="h-4 w-4 mr-2" />
//             {t("Print / Save as PDF")}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// export default CertificateViewDialog;



"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
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

const CERT_COLOR = "#1a8fd8";
const INK = "#14215f"; // colour of the filled-in values (like pen ink on the paper form)
const FONT = `"Abyssinica SIL","Noto Serif Ethiopic","Noto Sans Ethiopic",Georgia,"Times New Roman",serif`;

// A4 landscape at 96dpi. The certificate is drawn at this fixed size, then scaled to fit the screen.
const PAPER_W = 1122;
const PAPER_H = 793;

export const CERT_TITLES: Record<CertKind, string> = {
  BAPTISM: "Baptism Certificate",
  WEDDING: "Wedding Certificate",
  DEATH: "Death Certificate",
};

const PAPER_TITLES_EN: Record<CertKind, string> = {
  BAPTISM: "BAPTISMAL CERTIFICATE",
  WEDDING: "MARRIAGE CERTIFICATE",
  DEATH: "DEATH CERTIFICATE",
};

// ---- Dates: Gregorian (English side) and Ethiopian calendar (Amharic side) ----
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

const hasEthiopic = (s?: string) => !!s && /[\u1200-\u137F]/.test(s);

// ---------------------------------------------------------------------------
// Decorative frame (SVG) - blue band of alternating rosette / cross tiles on
// top and bottom, leaf tiles on the sides, like the printed paper certificates.
// ---------------------------------------------------------------------------
function CertFrame() {
  const BAND = 34;
  const TILE_W = 68;
  const COLS = 16;
  const bandW = TILE_W * COLS; // 1088
  const x0 = (PAPER_W - bandW) / 2; // 17
  const y0 = 17;
  const innerH = PAPER_H - 2 * y0 - 2 * BAND; // 691
  const ROWS = 16;
  const vTileH = innerH / ROWS;
  const C = CERT_COLOR;

  return (
    <svg width={PAPER_W} height={PAPER_H} className="absolute inset-0" aria-hidden="true">
      <defs>
        <pattern id="cert-h" x={x0} y={y0} width={TILE_W} height={BAND} patternUnits="userSpaceOnUse">
          {/* rosette tile */}
          <rect x="1.5" y="1.5" width="31" height="31" fill="none" stroke={C} strokeWidth="2.2" />
          <rect x="5" y="5" width="24" height="24" fill="none" stroke={C} strokeWidth="1" />
          <circle cx="17" cy="17" r="9" fill="none" stroke={C} strokeWidth="1.6" />
          <path d="M17 6V28M6 17H28M9.2 9.2L24.8 24.8M24.8 9.2L9.2 24.8" stroke={C} strokeWidth="1.4" fill="none" />
          <circle cx="17" cy="17" r="3" fill={C} />
          {/* cross tile */}
          <rect x="35.5" y="1.5" width="31" height="31" fill="none" stroke={C} strokeWidth="2.2" />
          <rect x="39" y="5" width="24" height="24" fill="none" stroke={C} strokeWidth="1" />
          <path d="M51 7.5V27M41.5 14H60.5" stroke={C} strokeWidth="4.2" fill="none" />
          <path d="M51 5V9M51 25V29M39 14H43M59 14H63" stroke={C} strokeWidth="1.2" fill="none" />
        </pattern>
        <pattern id="cert-v" x={x0} y={y0 + BAND} width={BAND} height={vTileH} patternUnits="userSpaceOnUse">
          <rect x="1.5" y="1" width="31" height={vTileH - 2} fill="none" stroke={C} strokeWidth="2" />
          <path
            d={`M17 4C29 12 29 ${vTileH - 14} 17 ${vTileH - 4}C5 ${vTileH - 14} 5 12 17 4Z`}
            fill="none"
            stroke={C}
            strokeWidth="1.6"
          />
          <path d={`M17 8V${vTileH - 8}`} stroke={C} strokeWidth="1.3" />
          <path
            d={`M17 16L24 12M17 22L25 18M17 28L24 24M17 16L10 12M17 22L9 18M17 28L10 24`}
            stroke={C}
            strokeWidth="1.2"
            fill="none"
          />
        </pattern>
      </defs>

      {/* top / bottom bands */}
      <rect x={x0} y={y0} width={bandW} height={BAND} fill="url(#cert-h)" />
      <rect x={x0} y={PAPER_H - y0 - BAND} width={bandW} height={BAND} fill="url(#cert-h)" />
      {/* left / right bands */}
      <rect x={x0} y={y0 + BAND} width={BAND} height={innerH} fill="url(#cert-v)" />
      <rect x={x0 + bandW - BAND} y={y0 + BAND} width={BAND} height={innerH} fill="url(#cert-v)" />
      {/* inner hairline */}
      <rect
        x={x0 + BAND + 4}
        y={y0 + BAND + 4}
        width={bandW - 2 * BAND - 8}
        height={innerH - 8}
        fill="none"
        stroke={C}
        strokeWidth="1.2"
      />
    </svg>
  );
}

// Vertical ornament that separates the Amharic column from the English column.
function CenterOrnament() {
  const C = CERT_COLOR;
  return (
    <svg width="26" height="100%" className="absolute left-1/2 top-0 -translate-x-1/2" aria-hidden="true">
      <defs>
        <pattern id="cert-orn" width="26" height="30" patternUnits="userSpaceOnUse">
          <path d="M13 2L22 15L13 28L4 15Z" fill="none" stroke={C} strokeWidth="1.6" />
          <path d="M13 8L17 15L13 22L9 15Z" fill={C} />
        </pattern>
      </defs>
      <rect x="0" y="0" width="26" height="100%" fill="url(#cert-orn)" />
    </svg>
  );
}

// Passport-style photo box. Falls back to a labelled empty frame.
function CertPhoto({ src, label, w = 86, h = 106 }: { src?: string | null; label: string; w?: number; h?: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div
      className="flex items-center justify-center text-center overflow-hidden shrink-0 bg-white font-bold leading-tight"
      style={{ width: w, height: h, border: `1.5px solid ${CERT_COLOR}`, color: CERT_COLOR, fontSize: 11 }}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="px-1">{label}</span>
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
      f("properName", "የተጸውዖ ስም", "Proper Name", d.properName),
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
      f("groomFullName", "የሙሽራው ስም", "Name of Bridegroom", d.groomFullName),
      f("groomNationality", "ዜግነት", "Nationality", d.groomNationality),
      f("brideFullName", "የሙሽሪት ስም", "Bride", d.brideFullName),
      f("brideNationality", "ዜግነት", "Nationality", d.brideNationality),
      f("officiatingPriestName", "የጋብቻውን ሥነ ሥርዓት የፈጸመው ካህን", "Performing Priest", d.officiatingPriestName),
      f("church", "የጋብቻው ሥነ ሥርዓት የተፈጸመበት ቤተ ክርስቲያን", "Church", d.church),
      f("country", "ጋብቻው የተፈጸመበት ሀገር", "Country", d.country),
      dt("dateOfMarriage", "ቀን", "Date", d.dateOfMarriage),
      f("witness1Name", "የሦስቱ ምስክሮች ስም  ሀ.", "Name of three Witnesses  a)", d.witness1Name),
      f("witness2Name", "ለ.", "b)", d.witness2Name),
      f("witness3Name", "ሐ.", "c)", d.witness3Name),
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

const VERSES: Record<CertKind, { am: string; en: string }> = {
  BAPTISM: {
    am: "«እንግዲህ ሂዱና አሕዛብን ሁሉ አስተምሩ አጥምቋቸውም በአብ በወልድ በመንፈስ ቅዱስ ስም» (ማቴ. ፳፰፥፲፱)",
    en: "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit. Mt. 28:19",
  },
  WEDDING: {
    am: "«እግዚአብሔር አንድ ያደረገውን ሰው አይለየው» (ማቴ. ፲፱፥፮)",
    en: "Those whom God has joined together let no man put asunder. (Mt. 19.6)",
  },
  DEATH: { am: "", en: "" },
};

const enName = (c: any) =>
  [c?.firstNameEn, c?.middleNameEn, c?.lastNameEn].filter(Boolean).join(" ");

// One half of a field row: "label ........ value" with a dotted leader line.
function Half({ label, value, bold, align = "left" }: { label: string; value?: string; bold?: boolean; align?: "left" | "right" }) {
  return (
    <div className="flex items-end gap-1.5 min-w-0" style={{ minHeight: 21 }}>
      <span
        className={`shrink-0 leading-tight ${bold ? "font-extrabold" : ""}`}
        style={{ color: CERT_COLOR, fontSize: 12.5, textAlign: align }}
      >
        {label}
      </span>
      <span
        className="flex-1 min-w-0 px-1 leading-tight font-semibold"
        style={{ borderBottom: `1.6px dotted ${CERT_COLOR}`, color: INK, fontSize: 13, minHeight: 18, paddingBottom: 1 }}
      >
        {value}
      </span>
    </div>
  );
}

function FieldRow({ f }: { f: CertField }) {
  let left = "";
  let right = "";
  if (f.date !== undefined) {
    left = fmtDateAm(f.date);
    right = fmtDateEn(f.date);
  } else {
    const v = f.value || "";
    if (hasEthiopic(v)) {
      left = v;
      right = f.valueEn || "";
    } else {
      left = "";
      right = v || f.valueEn || "";
    }
  }
  return (
    <div className="grid grid-cols-2" style={{ columnGap: 46 }}>
      <Half label={f.am} value={left} bold />
      <Half label={f.en} value={right} />
    </div>
  );
}

function SignatureBlock({ am, en, value, valueEn }: { am: string; en: string; value?: string; valueEn?: string }) {
  return (
    <div className="text-center" style={{ fontSize: 11.5, color: CERT_COLOR, minWidth: 170 }}>
      <div className="leading-tight font-semibold" style={{ color: INK, minHeight: 30, fontSize: 12 }}>
        {value && <div>{value}</div>}
        {valueEn && <div>{valueEn}</div>}
      </div>
      <div className="mb-1" style={{ borderTop: `1.5px solid ${CERT_COLOR}` }} />
      <div className="font-extrabold">{am}</div>
      <div>{en}</div>
    </div>
  );
}

// Scales the fixed-size paper to the width available (screen preview only - printing uses the unscaled paper).
function useFitScale() {
  const holder = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(1, w / PAPER_W));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { holder, scale };
}

interface CertificatePaperProps {
  type: CertKind;
  data: any;
  photos?: CertPhotos;
  // optional explicit child ids (otherwise taken from the record: childId / groomChildId / brideChildId / memberId)
  childIds?: { main?: string; groom?: string; bride?: string };
}

// The printable certificate itself - always bilingual (Amharic left, English right), landscape A4,
// laid out like the pre-printed paper certificates.
// English spellings of the names come from the child records (firstNameEn / middleNameEn / lastNameEn).
// The forwarded ref points at the unscaled paper so react-to-print can target it.
export const CertificatePaper = forwardRef<HTMLDivElement, CertificatePaperProps>(
  ({ type, data, photos, childIds }, ref) => {
    const d = data || {};
    const [en, setEn] = useState<Record<string, string>>({});
    const { holder, scale } = useFitScale();

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
    const verse = VERSES[type];
    const isWedding = type === "WEDDING";

    const dateAm = eventDate ? fmtDateAm(eventDate) || fmtDateEn(eventDate) : "";
    const dateEn = eventDate && fmtDateAm(eventDate) ? fmtDateEn(eventDate) : eventDate ? "" : "";

    return (
      <div ref={holder} className="w-full overflow-hidden" style={{ height: PAPER_H * scale }}>
        <div style={{ width: PAPER_W, height: PAPER_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div
            ref={ref}
            className="relative bg-white overflow-hidden"
            style={{
              width: PAPER_W,
              height: PAPER_H,
              fontFamily: FONT,
              color: CERT_COLOR,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            <CertFrame />

            <div className="absolute flex flex-col" style={{ left: 74, right: 74, top: 64, bottom: 58 }}>
              {/* ---------- header ---------- */}
              <div className="grid items-start" style={{ gridTemplateColumns: "1fr 1.7fr 1fr", columnGap: 14, minHeight: 150 }}>
                <div style={{ fontSize: 12 }}>
                  <div className="flex items-end gap-1.5">
                    <span className="font-extrabold shrink-0 leading-tight">
                      የመዝገብ ቁ.
                      <span className="block font-normal">Registration No.</span>
                    </span>
                    <span
                      className="flex-1 font-mono font-semibold px-1"
                      style={{ borderBottom: `1.5px dotted ${CERT_COLOR}`, color: INK, minHeight: 18, fontSize: 12 }}
                    >
                      {d.registrationNo || ""}
                    </span>
                  </div>
                  {verse.am && (
                    <p className="mt-3 font-bold leading-snug text-center" style={{ fontSize: 12.5 }}>
                      {verse.am}
                    </p>
                  )}
                  {isWedding && verse.en && (
                    <p className="mt-2 leading-snug text-center" style={{ fontSize: 11.5 }}>
                      {verse.en}
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <p className="font-extrabold leading-tight" style={{ fontSize: 17 }}>
                    የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን
                  </p>
                  <p className="font-extrabold leading-tight mt-1" style={{ fontSize: 17 }}>
                    {CERT_TITLES_AM[type]}
                  </p>
                  <p className="font-bold leading-tight mt-2" style={{ fontSize: 15.5, letterSpacing: "0.01em" }}>
                    ETHIOPIAN ORTHODOX TEWAHIDO CHURCH
                  </p>
                  <p
                    className="font-bold leading-tight mt-0.5 inline-block"
                    style={{ fontSize: 15.5, borderBottom: `2px solid ${CERT_COLOR}` }}
                  >
                    {PAPER_TITLES_EN[type]}
                  </p>
                </div>

                {isWedding ? (
                  <div className="flex justify-end gap-2">
                    <CertPhoto src={photos?.bride} label="ሙሽሪት / Bride" w={90} h={112} />
                    <CertPhoto src={photos?.groom} label="ሙሽራ / Groom" w={90} h={112} />
                  </div>
                ) : (
                  <div className="flex items-start justify-end gap-2">
                    {verse.en && (
                      <p className="leading-snug text-center flex-1" style={{ fontSize: 11 }}>
                        {verse.en}
                      </p>
                    )}
                    <CertPhoto src={photos?.main} label="ፎቶ / Photograph" w={90} h={112} />
                  </div>
                )}
              </div>

              {/* ---------- fields: Amharic | ornament | English ---------- */}
              <div className="relative mt-2 flex flex-col" style={{ rowGap: 3 }}>
                <CenterOrnament />
                {getFields(type, d, en).map((f) => (
                  <FieldRow key={f.key} f={f} />
                ))}
              </div>

              {/* ---------- certifying sentence ---------- */}
              <div className="mt-3 leading-relaxed" style={{ fontSize: 12.5 }}>
                <p className="font-bold">
                  ይህ የምስክር ወረቀት{" "}
                  <span style={{ color: INK, borderBottom: `1.5px dotted ${CERT_COLOR}`, padding: "0 6px" }}>{subject.am}</span>{" "}
                  {SENTENCE[type].am}
                </p>
                <p className="mt-1">
                  This is to certify that{" "}
                  <span style={{ color: INK, borderBottom: `1.5px dotted ${CERT_COLOR}`, padding: "0 6px", fontWeight: 600 }}>
                    {subject.en || subject.am}
                  </span>{" "}
                  {SENTENCE[type].en}
                </p>
              </div>

              {/* ---------- date + signatures ---------- */}
              <div className="mt-auto flex items-end justify-between">
                <SignatureBlock am="ቀን" en="Date" value={dateAm} valueEn={dateEn} />
                {isWedding ? (
                  <>
                    <SignatureBlock am="የደብሩ አስተዳዳሪ" en="Performing Priest" />
                    <SignatureBlock am="ሙሽራው" en="Bridegroom" />
                    <SignatureBlock am="ሙሽራዋ" en="Bride" />
                  </>
                ) : (
                  <SignatureBlock am="የቤተ ክርስቲያኑ አስተዳዳሪ ፊርማ" en="Church's administrator Signature" />
                )}
              </div>
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
// printed again or saved as a PDF (choose "Save as PDF" in the print dialog - landscape A4).
export function CertificateViewDialog({ open, onClose, type, data, photos }: CertificateViewDialogProps) {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${type.toLowerCase()}-certificate-${data?.registrationNo || ""}`,
    pageStyle:
      "@page { size: A4 landscape; margin: 0; } html, body { margin: 0; padding: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-6xl max-h-[92vh] overflow-y-auto">
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