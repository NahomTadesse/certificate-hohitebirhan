import { authenticatedFetch } from "./api";

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

export interface BaptismCertificatePayload {
  familyName?: string;
  properName?: string;
  christianName?: string;
  fatherName?: string;
  motherName?: string;
  godParentName?: string;
  country?: string;
  placeOfBirth?: string;
  nationality?: string;
  dateOfBirth?: string;
  dateOfBaptism?: string;
  church?: string;
  citizenship?: string;
  baptizingPriestId?: string;
  baptizingPriestName?: string;
  churchAdministratorName?: string;
}

export interface RevokePayload {
  reason: string;
  revokedBy?: string;
}

// POST: Issue a baptism certificate for a child
export const issueBaptismCertificate = async (
  childId: string,
  payload: BaptismCertificatePayload
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/baptism-certificates/child/${childId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// GET: Fetch the active baptism certificate for a child
export const fetchBaptismCertificateByChild = async (childId: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/baptism-certificates/child/${childId}`);
};

// GET: Full baptism certificate issuance history for a child
export const fetchBaptismCertificateHistory = async (childId: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/baptism-certificates/child/${childId}/history`);
};

// GET: Verify a baptism certificate by registration number
export const verifyBaptismCertificate = async (registrationNo: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/baptism-certificates/verify/${registrationNo}`);
};

// PATCH: Revoke a baptism certificate
export const revokeBaptismCertificate = async (
  registrationNo: string,
  payload: RevokePayload
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/baptism-certificates/${registrationNo}/revoke`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};
