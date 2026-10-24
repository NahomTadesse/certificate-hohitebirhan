import { authenticatedFetch } from "./api";
import { BaseResponse, PaginatedResponse, qs, unwrapPage } from "./serviceHelpers";
import type { LocalTime } from "./weddingBookingService";

// AppointmentRequestDTO
export interface AppointmentPayload {
  fatherId?: string;
  childId?: string;
  reason?: string;
  requestedDate?: string;
  requestedTime?: LocalTime;
  contactPhone?: string;
}

export interface Appointment extends Omit<AppointmentPayload, "requestedTime"> {
  id?: string;
  requestedTime?: LocalTime | string;
  status?: string;
  fatherName?: string;
  childName?: string;
  proposedDate?: string;
  proposedTime?: string;
  note?: string;
  declineReason?: string;
  createdAt?: string;
}

// POST /api/v1/appointments?requestedByUserId=
export const requestAppointment = async (requestedByUserId: string, payload: AppointmentPayload): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/appointments${qs({ requestedByUserId })}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// GET /api/v1/appointments/mine?requestedByUserId=
export const fetchMyAppointments = async (requestedByUserId: string, page = 0, size = 20): Promise<PaginatedResponse<Appointment>> =>
  unwrapPage<Appointment>(await authenticatedFetch<any>(`/api/v1/appointments/mine${qs({ requestedByUserId, page, size })}`));

// GET /api/v1/appointments/for-father?fatherUserId=
export const fetchAppointmentsForFather = async (fatherUserId: string, page = 0, size = 20): Promise<PaginatedResponse<Appointment>> =>
  unwrapPage<Appointment>(await authenticatedFetch<any>(`/api/v1/appointments/for-father${qs({ fatherUserId, page, size })}`));

// GET /api/v1/appointments/for-father/pending?fatherUserId=
export const fetchPendingAppointmentsForFather = async (fatherUserId: string, page = 0, size = 20): Promise<PaginatedResponse<Appointment>> =>
  unwrapPage<Appointment>(await authenticatedFetch<any>(`/api/v1/appointments/for-father/pending${qs({ fatherUserId, page, size })}`));

// PATCH /api/v1/appointments/{id}/confirm?fatherUserId=
export const confirmAppointment = async (id: string, fatherUserId: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/appointments/${id}/confirm${qs({ fatherUserId })}`, { method: "PATCH" });

// PATCH /api/v1/appointments/{id}/decline?fatherUserId=&reason=
export const declineAppointment = async (id: string, fatherUserId: string, reason: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/appointments/${id}/decline${qs({ fatherUserId, reason })}`, { method: "PATCH" });

// PATCH /api/v1/appointments/{id}/complete?fatherUserId=
export const completeAppointment = async (id: string, fatherUserId: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/appointments/${id}/complete${qs({ fatherUserId })}`, { method: "PATCH" });

// PATCH /api/v1/appointments/{id}/propose-new-time?fatherUserId=&newDate=&newTime=&note=
export const proposeNewAppointmentTime = async (
  id: string,
  fatherUserId: string,
  newDate: string,
  newTime: string, // date-time
  note?: string
): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(
    `/api/v1/appointments/${id}/propose-new-time${qs({ fatherUserId, newDate, newTime, note })}`,
    { method: "PATCH" }
  );

// PATCH /api/v1/appointments/{id}/accept-proposed-time?requestedByUserId=
export const acceptProposedAppointmentTime = async (id: string, requestedByUserId: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/appointments/${id}/accept-proposed-time${qs({ requestedByUserId })}`, { method: "PATCH" });

// PATCH /api/v1/appointments/{id}/cancel?requestedByUserId=
export const cancelAppointment = async (id: string, requestedByUserId: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/appointments/${id}/cancel${qs({ requestedByUserId })}`, { method: "PATCH" });
