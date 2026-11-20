import type { CertKind } from "@/components/CertificateView";

const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" ");
const clean = (o: Record<string, any>) => {
  Object.keys(o).forEach((k) => (o[k] === undefined || o[k] === null || o[k] === "") && delete o[k]);
  return o;
};

/**
 * Turns the response of POST /api/certificates/manual (the saved certificate) into the record shape the
 * printable certificate (CertificatePaper / CertificateViewDialog) expects, so a manual certificate is
 * shown exactly like a normal one. English spellings travel in `__en` because there is no child record
 * to look them up from.
 */
export const manualToCertificateRecord = (c: any, type: CertKind): any => {
  const first = c.firstName;
  const nameAm = join(c.firstName, c.middleName, c.lastName);
  const nameEn = join(c.firstNameEn, c.middleNameEn, c.lastNameEn);
  const father = c.fatherFullName || c.fatherName;
  const base = {
    registrationNo: c.certificateNumber,
    certificateNumber: c.certificateNumber,
    qrCodeValue: c.qrCodeValue,
    source: c.source,
    receiptNumber: c.receiptNumber,
  };

  if (type === "BAPTISM" || type === "BIRTH") {
    return clean({
      ...base,
      properName: first,
      familyName: join(c.middleName, c.lastName),
      christianName: c.christianName,
      fatherName: father,
      motherName: c.motherName,
      godParentName: type === "BAPTISM" ? c.godParentName : undefined,
      country: c.country,
      placeOfBirth: c.placeOfBirth,
      nationality: c.nationality,
      citizenship: c.citizenship,
      dateOfBirth: c.dateOfBirth,
      dateOfBaptism: type === "BAPTISM" ? c.eventDate : undefined,
      church: c.originChurchName || c.churchName,
      baptizingPriestName: c.officiatingPriestName,
      __en: clean({
        properName: c.firstNameEn,
        familyName: join(c.middleNameEn, c.lastNameEn),
        fatherName: c.fatherNameEn,
      }),
    });
  }

  if (type === "WEDDING") {
    const isMale = c.gender === "MALE";
    return clean({
      ...base,
      groomFullName: isMale ? nameAm : undefined,
      brideFullName: !isMale ? nameAm : undefined,
      groomNationality: isMale ? c.nationality : undefined,
      brideNationality: !isMale ? c.nationality : undefined,
      officiatingPriestName: c.officiatingPriestName,
      church: c.originChurchName || c.churchName,
      country: c.country,
      dateOfMarriage: c.eventDate,
      __en: clean({
        groomFullName: isMale ? nameEn : undefined,
        brideFullName: !isMale ? nameEn : undefined,
      }),
    });
  }

  // DEATH
  return clean({
    ...base,
    fullName: nameAm,
    sebekaMemberId: c.sebekaMemberId,
    dateOfDeath: c.eventDate,
    officiant: c.officiatingPriestName,
    remarks: c.notes,
    __en: clean({ fullName: nameEn }),
  });
};
