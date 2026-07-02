import { authenticatedFetch } from "./api";

export type PaymentType = "MONTHLY" | "PREPAID";

export interface MakePaymentPayload {
  childId: string;
  rate: number;
  type: PaymentType;
  months: number;
}

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

// POST: Make a payment for a child
export const makePayment = async (payload: MakePaymentPayload): Promise<BaseResponse> => {
  const params = new URLSearchParams({
    childId: payload.childId,
    rate: String(payload.rate),
    type: payload.type,
    months: String(payload.months),
  });
  return await authenticatedFetch<BaseResponse>(`/api/payments?${params.toString()}`, {
    method: "POST",
  });
};
