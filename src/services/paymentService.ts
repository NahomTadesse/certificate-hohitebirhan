import { authenticatedFetch } from "./api";

export type PaymentType = "MONTHLY" | "PREPAID";
export type PaymentReportType = "MEMBERSHIP" | "CERTIFICATE";
export type PaymentStatus = "PAID" | "PARTIAL" | "WAIVED" | "OVERDUE";

export interface MakePaymentPayload {
  childId: string;
  rate: number;
  type: PaymentType;
  months: number;
}

export interface Payment {
  id?: string;
  childId?: string;
  childName?: string;
  type: PaymentReportType;
  amount?: number;
  validFrom?: string;
  validTo?: string;
  status?: PaymentStatus;
  standardRate?: number;
  customAmount?: boolean;
  customReason?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

// POST: Pay membership fee for a child (supports optional custom rate/reason)
export const payMembership = async (
  childId: string,
  months = 1,
  customRate?: number,
  customReason?: string
): Promise<BaseResponse> => {
  const params = new URLSearchParams({ childId, months: String(months) });
  if (customRate !== undefined) params.set("customRate", String(customRate));
  if (customReason) params.set("customReason", customReason);
  return await authenticatedFetch<BaseResponse>(`/api/payments/membership?${params.toString()}`, {
    method: "POST",
  });
};

// POST: Pay certificate fee for a child (supports optional custom rate/reason)
export const payCertificateFee = async (
  childId: string,
  customRate?: number,
  customReason?: string
): Promise<BaseResponse> => {
  const params = new URLSearchParams({ childId });
  if (customRate !== undefined) params.set("customRate", String(customRate));
  if (customReason) params.set("customReason", customReason);
  return await authenticatedFetch<BaseResponse>(`/api/payments/certificate?${params.toString()}`, {
    method: "POST",
  });
};

// POST: Waive certificate fee for a child
export const waiveCertificateFee = async (
  childId: string,
  reason: string
): Promise<BaseResponse> => {
  const params = new URLSearchParams({ childId, reason });
  return await authenticatedFetch<BaseResponse>(`/api/payments/certificate/waive?${params.toString()}`, {
    method: "POST",
  });
};

// GET: Payments report within a date range
export const fetchPaymentsReport = async (
  type: PaymentReportType,
  startDate: string,
  endDate: string
): Promise<Payment[]> => {
  const params = new URLSearchParams({ type, startDate, endDate });
  const response = await authenticatedFetch<any>(`/api/payments/report?${params.toString()}`);
  return Array.isArray(response) ? response : [];
};

// GET: Whether a child has an active membership
export const hasActiveMembership = async (childId: string): Promise<boolean> => {
  const response = await authenticatedFetch<boolean>(
    `/api/payments/membership/status?childId=${encodeURIComponent(childId)}`
  );
  return Boolean(response);
};

// GET: Payment history for a child
export const fetchPaymentHistory = async (childId: string): Promise<Payment[]> => {
  const response = await authenticatedFetch<any>(`/api/payments/history/${childId}`);
  return Array.isArray(response) ? response : [];
};

// GET: Whether a child has settled their certificate fee
export const hasSettledCertificateFee = async (childId: string): Promise<boolean> => {
  const response = await authenticatedFetch<boolean>(
    `/api/payments/certificate/status?childId=${encodeURIComponent(childId)}`
  );
  return Boolean(response);
};

// GET: Whether a certificate can be issued for a child
export const canIssueCertificate = async (childId: string): Promise<boolean> => {
  const response = await authenticatedFetch<boolean>(
    `/api/payments/can-issue?childId=${encodeURIComponent(childId)}`
  );
  return Boolean(response);
};

// Backward-compatible wrapper used by the existing Payments page.
// Maps the legacy (childId, rate, type, months) shape onto the membership endpoint,
// treating `rate` as a custom rate override for the standard membership fee.
export const makePayment = async (payload: MakePaymentPayload): Promise<BaseResponse> => {
  return payMembership(
    payload.childId,
    payload.months,
    payload.rate,
    payload.type === "PREPAID" ? "Prepaid membership payment" : undefined
  );
};
