"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DateInput from "@/components/DateInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CertificateViewDialog } from "@/components/CertificateView";
import { manualToCertificateRecord } from "@/utils/manualCertificate";
import {
  generateManualCertificate,
  CertificateType,
  ManualCertificatePayload,
} from "@/services/certificateService";

const TYPE_LABELS: Record<CertificateType, string> = {
  BAPTISM: "Baptism Certificate",
  BIRTH: "Birth Certificate",
  DEATH: "Death Certificate",
  WEDDING: "Wedding Certificate",
};

const EVENT_DATE_LABELS: Record<CertificateType, string> = {
  BAPTISM: "Date of Baptism",
  BIRTH: "Date of Birth (event)",
  DEATH: "Date of Death",
  WEDDING: "Date of Marriage",
};

const emptyForm = (type: CertificateType): ManualCertificatePayload => ({
  type,
  firstName: "",
  middleName: "",
  lastName: "",
  firstNameEn: "",
  middleNameEn: "",
  lastNameEn: "",
  gender: "MALE",
  dateOfBirth: "",
  phoneNumber: "",
  christianName: "",
  namePrefixLabel: "",
  motherName: "",
  placeOfBirth: "",
  nationality: "",
  fatherFullName: "",
  godParentName: "",
  country: "",
  citizenship: "",
  originChurchName: "",
  originChurchAddress: "",
  officiatingPriestName: "",
  officiatingPriestRank: "",
  eventDate: "",
  receiptNumber: "",
  feeNote: "",
  notes: "",
  confirmDuplicate: false,
});

interface Props {
  open: boolean;
  onClose: () => void;
  /** Initial certificate type */
  defaultType: CertificateType;
  /** Types the user may choose from. One entry = type is fixed. */
  allowedTypes?: CertificateType[];
  /** Pre-fill the origin church name (e.g. currently selected church) */
  defaultChurchName?: string;
  /** Called with the API response after a successful save */
  onCreated?: (response: any) => void;
}

export default function ManualCertificateDialog({
  open,
  onClose,
  defaultType,
  allowedTypes,
  defaultChurchName,
  onCreated,
}: Props) {
  const { t } = useTranslation();
  const types = allowedTypes && allowedTypes.length > 0 ? allowedTypes : [defaultType];
  const [form, setForm] = useState<ManualCertificatePayload>(emptyForm(defaultType));
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  // the generated certificate, shown like a normal one right after saving
  const [generated, setGenerated] = useState<{ type: CertificateType; data: any } | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm(defaultType), originChurchName: defaultChurchName || "" });
      setDuplicateWarning(null);
    }
  }, [open, defaultType, defaultChurchName]);

  const set = <K extends keyof ManualCertificatePayload>(key: K, value: ManualCertificatePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const text = (key: keyof ManualCertificatePayload, label: string, required = false, type = "text") => (
    <div>
      <Label>
        {t(label)} {required && "*"}
      </Label>
      {type === "date" ? (
        <DateInput value={(form[key] as string) || ""} onChange={(e) => set(key, e.target.value as any)} />
      ) : (
        <Input
          type={type}
          value={(form[key] as string) || ""}
          onChange={(e) => set(key, e.target.value as any)}
        />
      )}
    </div>
  );

  const handleSubmit = async (confirmDuplicate = false) => {
    const missing =
      !form.firstName ||
      !form.lastName ||
      !form.gender ||
      !form.dateOfBirth ||
      !form.fatherFullName ||
      !form.originChurchName ||
      !form.eventDate;
    if (missing) {
      toast.error(t("Please fill in all required fields (*)"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await generateManualCertificate({ ...form, confirmDuplicate });
      if (res?.success === false) {
        // Backend may flag a possible duplicate - let the user confirm and resubmit
        if (/duplicate|already exist/i.test(res.message || "")) {
          setDuplicateWarning(res.message || "A similar certificate already exists.");
        } else {
          toast.error(res.message || t("Failed to generate certificate"));
        }
        return;
      }
      toast.success(res?.message || t("Manual certificate generated successfully!"));
      const saved: any = (res as any)?.data;
      if (saved) {
        const kind = (saved.type || form.type) as CertificateType;
        setGenerated({ type: kind, data: manualToCertificateRecord(saved, kind) });
      }
      onCreated?.(res);
      onClose();
    } catch (err: any) {
      const msg: string = err?.message || t("Failed to generate certificate");
      if (/duplicate|already exist/i.test(msg)) setDuplicateWarning(msg);
      else toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t("Manual")} {t(TYPE_LABELS[form.type])}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
          {types.length > 1 && (
            <div>
              <Label>{t("Certificate Type")} *</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v as CertificateType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((ty) => (
                    <SelectItem key={ty} value={ty}>
                      {t(TYPE_LABELS[ty])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <h3 className="font-semibold pt-2">{t("Name (Amharic / local)")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {text("firstName", "First Name", true)}
            {text("middleName", "Middle Name")}
            {text("lastName", "Last Name", true)}
          </div>

          <h3 className="font-semibold pt-2">{t("Name (English)")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {text("firstNameEn", "First Name (English)")}
            {text("middleNameEn", "Middle Name (English)")}
            {text("lastNameEn", "Last Name (English)")}
          </div>

          <h3 className="font-semibold pt-2">{t("Personal Details")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("Gender")} *</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v as "MALE" | "FEMALE")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">{t("Male")}</SelectItem>
                  <SelectItem value="FEMALE">{t("Female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {text("dateOfBirth", "Date of Birth", true, "date")}
            {text("christianName", "Christian Name")}
            {text("namePrefixLabel", "Name Prefix")}
            {text("fatherFullName", "Father's Full Name", true)}
            {text("motherName", "Mother's Name")}
            {text("placeOfBirth", "Place of Birth")}
            {text("nationality", "Nationality")}
            {text("citizenship", "Citizenship")}
            {text("country", "Country")}
            {text("phoneNumber", "Phone Number")}
            {form.type === "BAPTISM" && text("godParentName", "God Parent's Name")}
          </div>

          <h3 className="font-semibold pt-2">{t("Church & Event")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {text("originChurchName", "Origin Church", true)}
            {text("originChurchAddress", "Origin Church Address")}
            {text("eventDate", EVENT_DATE_LABELS[form.type], true, "date")}
            {text("officiatingPriestName", "Officiating Priest")}
            {text("officiatingPriestRank", "Officiating Priest Rank")}
          </div>

          <h3 className="font-semibold pt-2">{t("Fee & Notes")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {text("receiptNumber", "Receipt Number")}
            {text("feeNote", "Fee Note")}
          </div>
          <div>
            <Label>{t("Notes")}</Label>
            <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>

          {duplicateWarning && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium mb-2">{duplicateWarning}</p>
              <Button size="sm" variant="outline" disabled={submitting} onClick={() => handleSubmit(true)}>
                {t("Create anyway")}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("Cancel")}
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? t("Generating...") : t("Generate Certificate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {generated && (
      <CertificateViewDialog
        open
        onClose={() => setGenerated(null)}
        type={generated.type}
        data={generated.data}
      />
    )}
    </>
  );
}