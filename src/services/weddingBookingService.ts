import { authenticatedFetch } from "./api";
import { BaseResponse, qs, unwrapList } from "./serviceHelpers";

// LocalTime as the swagger declares it ({hour, minute, second, nano}); the API also accepts "HH:mm" strings
// in practice, so the UI sends the object form that matches the schema.
export interface LocalTime {
  hour: number;
  minute: number;
  second?: number;
  nano?: number;
}

export const toLocalTime = (hhmm: string): LocalTime | undefined => {
  if (!hhmm) return undefined;
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h)) return undefined;
  return { hour: h, minute: m || 0, second: 0, nano: 0 };
};

export const fromLocalTime = (t?: LocalTime | string | null): string => {
  if (!t) return "";
  if (typeof t === "string") return t.slice(0, 5);
  return `${String(t.hour ?? 0).padStart(2, "0")}:${String(t.minute ?? 0).padStart(2, "0")}`;
};

// WeddingBookingRequestDTO
export interface WeddingBookingPayload {
  churchId?: string;
  groomChildId?: string;
  groomFullName?: string;
  brideChildId?: string;
  brideFullName?: string;
  officiatingPriestId?: string;
  bookingDate?: string;
  bookingTime?: LocalTime;
  contactPhone?: string;
  notes?: string;
  bookingFee?: number;
}

export interface WeddingBooking extends Omit<WeddingBookingPayload, "bookingTime"> {
  id?: string;
  bookingTime?: LocalTime | string;
  status?: string;
  churchName?: string;
  paymentStatus?: string;
  officiatingPriestName?: string;
  receiptNumber?: string;
}

// GET /api/v1/wedding-bookings?churchId=&from=&to=
export const fetchWeddingBookings = async (churchId: string, from: string, to: string): Promise<WeddingBooking[]> =>
  unwrapList<WeddingBooking>(await authenticatedFetch<any>(`/api/v1/wedding-bookings${qs({ churchId, from, to })}`));

// POST /api/v1/wedding-bookings
export const createWeddingBooking = async (payload: WeddingBookingPayload): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>("/api/v1/wedding-bookings", { method: "POST", body: JSON.stringify(payload) });

// GET /api/v1/wedding-bookings/availability?churchId=&date=&time=
// `time` is declared as a date-time in the swagger, so it is sent as an ISO date-time (date + time).
export const checkWeddingAvailability = async (churchId: string, date: string, time: string): Promise<BaseResponse> => {
  const hhmm = time.length === 5 ? `${time}:00` : time;
  return authenticatedFetch<BaseResponse>(
    `/api/v1/wedding-bookings/availability${qs({ churchId, date, time: `${date}T${hhmm}` })}`
  );
};

// POST /api/v1/wedding-bookings/{bookingId}/pay
export const payAndConfirmBooking = async (
  bookingId: string,
  opts: { customAmount?: number; promoCode?: string; customReason?: string } = {}
): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/wedding-bookings/${bookingId}/pay${qs(opts)}`, { method: "POST" });

// PATCH /api/v1/wedding-bookings/{bookingId}/confirm
export const confirmBooking = async (bookingId: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/wedding-bookings/${bookingId}/confirm`, { method: "PATCH" });

// PATCH /api/v1/wedding-bookings/{bookingId}/confirm-without-payment?reason=
export const confirmBookingWithoutPayment = async (bookingId: string, reason: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(
    `/api/v1/wedding-bookings/${bookingId}/confirm-without-payment${qs({ reason })}`,
    { method: "PATCH" }
  );

// PATCH /api/v1/wedding-bookings/{bookingId}/complete
export const completeBooking = async (bookingId: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/wedding-bookings/${bookingId}/complete`, { method: "PATCH" });

// PATCH /api/v1/wedding-bookings/{bookingId}/cancel?reason=
export const cancelBooking = async (bookingId: string, reason?: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/wedding-bookings/${bookingId}/cancel${qs({ reason })}`, { method: "PATCH" });
