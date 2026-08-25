// Shared phone-number helpers: a small country/dial-code list plus a loose
// E.164-ish validator, used across every form that collects a phone number
// (Users, Fathers, Children, Family members, etc.)

export interface CountryDialCode {
  code: string; // ISO country code, e.g. "ET"
  name: string; // Display name
  dialCode: string; // e.g. "+251"
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: "ET", name: "Ethiopia", dialCode: "+251" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "SE", name: "Sweden", dialCode: "+46" },
  { code: "NO", name: "Norway", dialCode: "+47" },
  { code: "IT", name: "Italy", dialCode: "+39" },
  { code: "IL", name: "Israel", dialCode: "+972" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966" },
  { code: "SD", name: "Sudan", dialCode: "+249" },
  { code: "KE", name: "Kenya", dialCode: "+254" },
  { code: "DJ", name: "Djibouti", dialCode: "+253" },
  { code: "EG", name: "Egypt", dialCode: "+20" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "IN", name: "India", dialCode: "+91" },
];

export const DEFAULT_COUNTRY_DIAL_CODE = "+251"; // Ethiopia default

// Accepts numbers like "+251912345678" or "0912345678" (7-15 digits after
// an optional leading 0 or +countrycode).
export function isValidPhoneNumber(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  const pattern = /^(\+\d{1,3}\d{6,12}|0\d{6,12})$/;
  return pattern.test(trimmed.replace(/[\s-]/g, ""));
}

export function getPhoneValidationError(value: string): string | null {
  if (!value || !value.trim()) return null; // empty handled by required-field checks elsewhere
  if (!isValidPhoneNumber(value)) {
    return "Enter a valid phone number (e.g. +251912345678 or 0912345678)";
  }
  return null;
}

// Combine a selected dial code with a local number the user typed, avoiding
// double "+" or duplicated leading zero.
export function composePhoneNumber(dialCode: string, localNumber: string): string {
  const local = (localNumber || "").trim().replace(/^0+/, "");
  if (!local) return "";
  return `${dialCode}${local}`;
}
