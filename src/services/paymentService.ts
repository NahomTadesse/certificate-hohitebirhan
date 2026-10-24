import { authenticatedFetch } from "./api";

// Swagger: PaymentResponseDTO.type / CreatePaymentRequest.type / fee-controller type
export type PaymentFeeType =
  | "MEMBERSHIP"
  | "CERTIFICATE_BAPTISM"
  | "CERTIFICATE_BIRTH"
  | "CERTIFICATE_DEATH"
  | "CERTIFICATE_WEDDING"
  | "WEDDING_BOOKING"
  | "BAPTISM_SERVICE"
  | "OTHER";

export const PAYMENT_FEE_TYPES: PaymentFeeType[] = [
  "MEMBERSHIP",
  "CERTIFICATE_BAPTISM",
  "CERTIFICATE_BIRTH",
  "CERTIFICATE_DEATH",
  "CERTIFICATE_WEDDING",
  "WEDDING_BOOKING",
  "BAPTISM_SERVICE",
  "OTHER",
];

export type CertificateFeeKind = "BAPTISM" | "BIRTH" | "DEATH" | "WEDDING";
export const CERTIFICATE_FEE_KINDS: CertificateFeeKind[] = ["BAPTISM", "BIRTH", "DEATH", "WEDDING"];

export type PaymentType = "MONTHLY" | "PREPAID"; // UI-only (legacy form)
// Report types now follow the full fee-type list from the Swagger.
export type PaymentReportType = PaymentFeeType;
export type PaymentStatus = "PAID" | "PARTIAL" | "WAIVED" | "OVERDUE" | "PENDING";

export interface MakePaymentPayload {
  childId: string;
  rate?: number;
  type: PaymentType;
  months: number;
  promoCode?: string;
}

// PaymentResponseDTO
export interface Payment {
  id?: string;
  childId?: string;
  childName?: string;
  type: PaymentFeeType | string;
  amount?: number;
  validFrom?: string;
  validTo?: string;
  status?: PaymentStatus;
  standardRate?: number;
  customAmount?: boolean;
  customReason?: string;
  periodStart?: string;
  periodEnd?: string;
  receiptNumber?: string;
  churchId?: string;
  promoCode?: string;
  discountAmount?: number;
}

// CreatePaymentRequest
export interface CreatePaymentRequest {
  childId?: string;
  churchId?: string;
  type: PaymentFeeType;
  months?: number;
  customAmount?: number;
  customReason?: string;
  promoCode?: string;
  waive?: boolean;
  referenceId?: string;
}

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

// POST /api/payments  (generic payment - any fee type)
export const createPayment = async (payload: CreatePaymentRequest): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>("/api/payments", { method: "POST", body: JSON.stringify(payload) });

// POST /api/payments/quote  (price preview incl. promo code / custom amount, nothing is saved)
export const quotePayment = async (payload: CreatePaymentRequest): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>("/api/payments/quote", { method: "POST", body: JSON.stringify(payload) });

// POST /api/payments/membership
export const payMembership = async (
  childId: string,
  months = 1,
  customRate?: number,
  customReason?: string,
  promoCode?: string
): Promise<BaseResponse> => {
  const params = new URLSearchParams({ childId, months: String(months) });
  if (promoCode) params.set("promoCode", promoCode);
  if (customRate !== undefined && !Number.isNaN(customRate)) params.set("customRate", String(customRate));
  if (customReason) params.set("customReason", customReason);
  return authenticatedFetch<BaseResponse>(`/api/payments/membership?${params.toString()}`, { method: "POST" });
};

// POST /api/payments/certificate  (certificateType is now required)
export const payCertificateFee = async (
  childId: string,
  certificateType: CertificateFeeKind,
  customRate?: number,
  customReason?: string,
  promoCode?: string
): Promise<BaseResponse> => {
  const params = new URLSearchParams({ childId, certificateType });
  if (promoCode) params.set("promoCode", promoCode);
  if (customRate !== undefined && !Number.isNaN(customRate)) params.set("customRate", String(customRate));
  if (customReason) params.set("customReason", customReason);
  return authenticatedFetch<BaseResponse>(`/api/payments/certificate?${params.toString()}`, { method: "POST" });
};

// POST /api/payments/certificate/waive  (certificateType is now required)
export const waiveCertificateFee = async (
  childId: string,
  certificateType: CertificateFeeKind,
  reason: string
): Promise<BaseResponse> => {
  const params = new URLSearchParams({ childId, certificateType, reason });
  return authenticatedFetch<BaseResponse>(`/api/payments/certificate/waive?${params.toString()}`, { method: "POST" });
};

// GET /api/payments/report
export const fetchPaymentsReport = async (
  type: PaymentReportType,
  startDate: string,
  endDate: string
): Promise<Payment[]> => {
  const params = new URLSearchParams({ type, startDate, endDate });
  const response = await authenticatedFetch<any>(`/api/payments/report?${params.toString()}`);
  return Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
};

// GET /api/payments/receipt/{receiptNumber}
export const fetchPaymentByReceipt = async (receiptNumber: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/payments/receipt/${encodeURIComponent(receiptNumber)}`);

// GET /api/payments/membership/status
export const hasActiveMembership = async (childId: string): Promise<boolean> => {
  const response = await authenticatedFetch<boolean>(
    `/api/payments/membership/status?childId=${encodeURIComponent(childId)}`
  );
  return Boolean(response);
};

// GET /api/payments/history/{childId}
export const fetchPaymentHistory = async (childId: string): Promise<Payment[]> => {
  const response = await authenticatedFetch<any>(`/api/payments/history/${childId}`);
  return Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
};

// GET /api/payments/can-issue  (certificateType is now required)
export const canIssueCertificate = async (childId: string, certificateType: CertificateFeeKind): Promise<boolean> => {
  const response = await authenticatedFetch<boolean>(
    `/api/payments/can-issue?childId=${encodeURIComponent(childId)}&certificateType=${certificateType}`
  );
  return Boolean(response);
};

// Backward-compatible wrapper used by the Payments page (membership payment).
export const makePayment = async (payload: MakePaymentPayload): Promise<BaseResponse> =>
  payMembership(
    payload.childId,
    payload.months,
    payload.rate,
    payload.rate !== undefined ? (payload.type === "PREPAID" ? "Prepaid membership payment" : "Custom membership rate") : undefined,
    payload.promoCode
  );

// Map a certificate kind used across the app to its fee type
export const certificateFeeType = (kind: CertificateFeeKind): PaymentFeeType =>
  (`CERTIFICATE_${kind}` as PaymentFeeType);
