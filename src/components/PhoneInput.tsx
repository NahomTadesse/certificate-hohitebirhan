"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_DIAL_CODE, getPhoneValidationError } from "@/utils/phone";

interface PhoneInputProps {
  value: string; // full number, e.g. "+251912345678"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  showError?: boolean; // set true after a submit attempt / blur
}

// Splits a stored value like "+251912345678" into dial code + local part so
// the two controls stay in sync, defaulting to Ethiopia when unrecognized.
function splitValue(value: string) {
  const match = COUNTRY_DIAL_CODES
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((c) => value?.startsWith(c.dialCode));
  if (match) {
    return { dialCode: match.dialCode, local: value.slice(match.dialCode.length) };
  }
  return { dialCode: DEFAULT_COUNTRY_DIAL_CODE, local: value?.replace(/^\+?/, "") || "" };
}

export default function PhoneInput({ value, onChange, label, required, className, showError }: PhoneInputProps) {
  const [touched, setTouched] = useState(false);
  const { dialCode, local } = useMemo(() => splitValue(value || ""), [value]);
  const error = getPhoneValidationError(value);
  const displayError = (showError || touched) && error;

  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium mb-1 block">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <Select value={dialCode} onValueChange={(dc) => onChange(`${dc}${local}`)}>
          <SelectTrigger className="w-[110px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_DIAL_CODES.map((c) => (
              <SelectItem key={c.code} value={c.dialCode}>
                {c.code} {c.dialCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={local}
          onChange={(e) => onChange(`${dialCode}${e.target.value.replace(/[^\d]/g, "")}`)}
          onBlur={() => setTouched(true)}
          placeholder="912345678"
          className="flex-1"
        />
      </div>
      {displayError && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
