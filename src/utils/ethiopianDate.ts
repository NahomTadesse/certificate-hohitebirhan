import i18n from "i18next";

// Ethiopian (Ge'ez) calendar helpers.
// The API always stores/accepts Gregorian dates ("yyyy-MM-dd"); these helpers only convert
// for display and for the date picker when an Ethiopian language is selected.

/** Languages that use the Ethiopian calendar. Add/remove codes here to change the behaviour. */
export const ETHIOPIAN_CALENDAR_LANGS = ["am", "ti", "om"];

export const isEthiopianLang = (lang?: string | null): boolean => {
  if (!lang) return false;
  const base = lang.toLowerCase().split("-")[0];
  return ETHIOPIAN_CALENDAR_LANGS.includes(base);
};

export const ETHIOPIAN_MONTHS_AM = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሣሥ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜን",
];

export interface EthDate {
  year: number;
  month: number; // 1..13
  day: number; // 1..30 (Pagume: 1..5/6)
}

const JDN_UNIX_EPOCH = 2440588; // Julian Day Number of 1970-01-01
const ETH_EPOCH = 1723856;

const gregorianToJdn = (y: number, m: number, d: number): number =>
  Math.floor(Date.UTC(y, m - 1, d) / 86400000) + JDN_UNIX_EPOCH;

const jdnToGregorian = (jdn: number): { y: number; m: number; d: number } => {
  const dt = new Date((jdn - JDN_UNIX_EPOCH) * 86400000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
};

export const ethiopianToJdn = (y: number, m: number, d: number): number =>
  ETH_EPOCH + 365 + 365 * (y - 1) + Math.floor(y / 4) + 30 * m + d - 31;

export const jdnToEthiopian = (jdn: number): EthDate => {
  const r = (jdn - ETH_EPOCH) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - ETH_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  return { year, month: Math.floor(n / 30) + 1, day: (n % 30) + 1 };
};

/** Number of days in an Ethiopian month (Pagume has 5, or 6 in a leap year). */
export const daysInEthiopianMonth = (year: number, month: number): number =>
  month === 13 ? (year % 4 === 3 ? 6 : 5) : 30;

const parseIso = (iso?: string | null): { y: number; m: number; d: number } | null => {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!match) return null;
  return { y: +match[1], m: +match[2], d: +match[3] };
};

/** "2024-09-11" -> { year: 2017, month: 1, day: 1 } */
export const isoToEthiopian = (iso?: string | null): EthDate | null => {
  const g = parseIso(iso);
  return g ? jdnToEthiopian(gregorianToJdn(g.y, g.m, g.d)) : null;
};

/** Ethiopian y/m/d -> Gregorian "yyyy-MM-dd" */
export const ethiopianToIso = (year: number, month: number, day: number): string => {
  const g = jdnToGregorian(ethiopianToJdn(year, month, day));
  return `${String(g.y).padStart(4, "0")}-${String(g.m).padStart(2, "0")}-${String(g.d).padStart(2, "0")}`;
};

/**
 * Format a Gregorian ISO date (or Date) for display in the selected language.
 * Ethiopian languages -> "11 መስከረም 2017"; everything else -> the browser's local format.
 */
export const formatDate = (value?: string | Date | null, langArg?: string | null): string => {
  if (!value) return "-";
  const lang = langArg ?? i18n.language;
  const iso = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (isEthiopianLang(lang)) {
    const e = isoToEthiopian(iso);
    if (e) return `${e.day} ${ETHIOPIAN_MONTHS_AM[e.month - 1]} ${e.year}`;
  }
  const dt = value instanceof Date ? value : new Date(iso);
  return isNaN(dt.getTime()) ? String(value) : dt.toLocaleDateString();
};

/** Today in the Ethiopian calendar. */
export const todayEthiopian = (): EthDate => {
  const n = new Date();
  return jdnToEthiopian(gregorianToJdn(n.getFullYear(), n.getMonth() + 1, n.getDate()));
};
