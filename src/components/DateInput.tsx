"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ETHIOPIAN_MONTHS_AM,
  daysInEthiopianMonth,
  ethiopianToIso,
  isEthiopianLang,
  isoToEthiopian,
  todayEthiopian,
} from "@/utils/ethiopianDate";

interface DateInputProps {
  /** Gregorian ISO date "yyyy-MM-dd" (what the API uses) */
  value?: string | null;
  /** Called with { target: { value } } where value is Gregorian ISO or "" - same shape as <input onChange> */
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
  placeholder?: string;
}

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Drop-in replacement for <Input type="date">.
 * - English / other languages: the normal browser date picker.
 * - Amharic (and Tigrinya / Oromo): Ethiopian calendar day / month / year pickers.
 * The value in and out is always Gregorian ISO, so API payloads are unchanged.
 */
export default function DateInput({
  value,
  onChange,
  className,
  disabled,
  required,
  id,
  name,
  min,
  max,
  placeholder,
}: DateInputProps) {
  const { i18n } = useTranslation();
  const ethiopian = isEthiopianLang(i18n.language);

  const fromValue = useMemo(() => isoToEthiopian(value), [value]);
  const [parts, setParts] = useState<{ year?: number; month?: number; day?: number }>(
    fromValue || {}
  );

  // keep local parts in sync when the value changes from outside (form reset, edit prefill)
  useEffect(() => {
    if (fromValue) setParts(fromValue);
    else if (!value) setParts({});
  }, [fromValue, value]);

  if (!ethiopian) {
    return (
      <Input
        type="date"
        id={id}
        name={name}
        className={className}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        value={value ? String(value).slice(0, 10) : ""}
        onChange={(e) => onChange?.({ target: { value: e.target.value } })}
      />
    );
  }

  const thisYear = todayEthiopian().year;
  const years: number[] = [];
  for (let y = thisYear + 10; y >= thisYear - 120; y--) years.push(y);

  const maxDay = parts.year && parts.month ? daysInEthiopianMonth(parts.year, parts.month) : 30;
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const update = (next: { year?: number; month?: number; day?: number }) => {
    const merged = { ...parts, ...next };
    // clamp the day if the month/year changed (e.g. Pagume has only 5-6 days)
    if (merged.year && merged.month && merged.day) {
      merged.day = Math.min(merged.day, daysInEthiopianMonth(merged.year, merged.month));
    }
    setParts(merged);
    if (merged.year && merged.month && merged.day) {
      onChange?.({ target: { value: ethiopianToIso(merged.year, merged.month, merged.day) } });
    } else if (!merged.year && !merged.month && !merged.day) {
      onChange?.({ target: { value: "" } });
    }
  };

  const num = (v: string) => (v ? parseInt(v, 10) : undefined);

  return (
    <div className={cn("space-y-1", className)} id={id}>
      <div className="flex gap-2">
        <select
          aria-label="Day"
          className={cn(selectClass, "w-[4.5rem]")}
          disabled={disabled}
          required={required}
          value={parts.day ?? ""}
          onChange={(e) => update({ day: num(e.target.value) })}
        >
          <option value="">{placeholder ? "" : "ቀን"}</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          aria-label="Month"
          className={cn(selectClass, "flex-1 min-w-0")}
          disabled={disabled}
          required={required}
          value={parts.month ?? ""}
          onChange={(e) => update({ month: num(e.target.value) })}
        >
          <option value="">ወር</option>
          {ETHIOPIAN_MONTHS_AM.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          aria-label="Year"
          className={cn(selectClass, "w-24")}
          disabled={disabled}
          required={required}
          value={parts.year ?? ""}
          onChange={(e) => update({ year: num(e.target.value) })}
        >
          <option value="">ዓ.ም</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      {name && <input type="hidden" name={name} value={value || ""} />}
      {value && <p className="text-xs text-muted-foreground">{String(value).slice(0, 10)} (G.C.)</p>}
    </div>
  );
}
