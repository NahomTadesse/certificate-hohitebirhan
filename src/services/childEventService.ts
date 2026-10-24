import { authenticatedFetch } from "./api";
import { BaseResponse, PaginatedResponse, qs, unwrapPage } from "./serviceHelpers";
import type { LocalTime } from "./weddingBookingService";

export type ChildEventType =
  | "APPOINTMENT"
  | "BAPTISM"
  | "WEDDING"
  | "DEATH"
  | "MEMBERSHIP_PAYMENT"
  | "CERTIFICATE_FEE_PAYMENT"
  | "CHURCH_EVENT"
  | "FATHER_NOTE"
  | "OTHER"
  | "SERVICE_PAYMENT";
export type ChildEventSource = "SYSTEM" | "FATHER" | "ADMIN";

export const CHILD_EVENT_TYPES: ChildEventType[] = [
  "APPOINTMENT",
  "BAPTISM",
  "WEDDING",
  "DEATH",
  "MEMBERSHIP_PAYMENT",
  "CERTIFICATE_FEE_PAYMENT",
  "SERVICE_PAYMENT",
  "CHURCH_EVENT",
  "FATHER_NOTE",
  "OTHER",
];

// ChildEventRequestDTO
export interface ChildEventPayload {
  childId?: string;
  churchId?: string;
  eventType?: ChildEventType;
  source?: ChildEventSource;
  title?: string;
  description?: string;
  eventDate?: string;
  eventTime?: LocalTime;
  createdByUserId?: string;
  visibleToGuardian?: boolean;
  relatedEntityId?: string;
}

export interface ChildEvent extends Omit<ChildEventPayload, "eventTime"> {
  id?: string;
  eventTime?: LocalTime | string;
  createdAt?: string;
}

// POST /api/v1/child-events/child/{childId}?createdByUserId=&source=
export const addChildEvent = async (
  childId: string,
  createdByUserId: string,
  payload: ChildEventPayload,
  source: ChildEventSource = "FATHER"
): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/child-events/child/${childId}${qs({ createdByUserId, source })}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// GET /api/v1/child-events/child/{childId}/timeline  (what the guardian sees)
export const fetchChildTimeline = async (childId: string, page = 0, size = 20): Promise<PaginatedResponse<ChildEvent>> =>
  unwrapPage<ChildEvent>(await authenticatedFetch<any>(`/api/v1/child-events/child/${childId}/timeline${qs({ page, size })}`));

// GET /api/v1/child-events/child/{childId}/timeline/full  (everything, incl. events hidden from guardians)
export const fetchChildFullTimeline = async (childId: string, page = 0, size = 20): Promise<PaginatedResponse<ChildEvent>> =>
  unwrapPage<ChildEvent>(await authenticatedFetch<any>(`/api/v1/child-events/child/${childId}/timeline/full${qs({ page, size })}`));

// DELETE /api/v1/child-events/{eventId}
export const deleteChildEvent = async (eventId: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/child-events/${eventId}`, { method: "DELETE" });
