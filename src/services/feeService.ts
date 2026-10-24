import { authenticatedFetch } from "./api";
import { BaseResponse, qs } from "./serviceHelpers";
import type { PaymentFeeType } from "./paymentService";

// PUT /api/fees?type=&amount=&churchId=  -> set the fee for a type (church-specific when churchId is given)
export const setFee = async (type: PaymentFeeType, amount: number, churchId?: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/fees${qs({ type, amount, churchId })}`, { method: "PUT" });

// GET /api/fees/standard?type=&months=&churchId=  -> the standard fee that applies
export const fetchStandardFee = async (
  type: PaymentFeeType,
  months = 1,
  churchId?: string
): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/fees/standard${qs({ type, months, churchId })}`);
