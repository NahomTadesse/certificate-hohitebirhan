import { authenticatedFetch } from "./api";
import { BaseResponse, unwrapList } from "./serviceHelpers";
import type { PaymentFeeType } from "./paymentService";

export type DiscountType = "PERCENT" | "FIXED" | "FREE";

// PromoCodeRequest (swagger)
export interface PromoCodePayload {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue?: number;
  churchId?: string;
  applicableTypes?: PaymentFeeType[];
  validFrom?: string;
  validTo?: string;
  maxUses?: number;
  oncePerChild?: boolean;
}

export interface PromoCode extends Partial<PromoCodePayload> {
  id?: string;
  active?: boolean;
  usedCount?: number;
}

// GET /api/promo-codes
export const fetchPromoCodes = async (): Promise<PromoCode[]> =>
  unwrapList<PromoCode>(await authenticatedFetch<any>("/api/promo-codes"));

// POST /api/promo-codes
export const createPromoCode = async (payload: PromoCodePayload): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>("/api/promo-codes", { method: "POST", body: JSON.stringify(payload) });

// PATCH /api/promo-codes/{code}/deactivate
export const deactivatePromoCode = async (code: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/promo-codes/${encodeURIComponent(code)}/deactivate`, { method: "PATCH" });
