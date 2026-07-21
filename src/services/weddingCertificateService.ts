import { authenticatedFetch } from "./api";

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

export interface WeddingCertificatePayload {
  groomChildId?: string;
  groomFullName?: string;
  groomNationality?: string;
  brideChildId?: string;
  brideFullName?: string;
  brideNationality?: string;
  country?: string;
  church?: string;
  officiatingPriestId?: string;
  officiatingPriestName?: string;
  witness1Name?: string;
  witness2Name?: string;
  witness3Name?: string;
  dateOfMarriage?: string;
  churchAdministratorName?: string;
}

export interface RevokePayload {
  reason: string;
  revokedBy?: string;
}

// POST: Issue a wedding certificate
export const issueWeddingCertificate = async (
  payload: WeddingCertificatePayload
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>("/api/v1/wedding-certificates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// GET: Fetch a wedding certificate by registration number
export const fetchWeddingCertificateByRegistrationNo = async (
  registrationNo: string
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/v1/wedding-certificates/${registrationNo}`);
};

// GET: Verify a wedding certificate by registration number
export const verifyWeddingCertificate = async (registrationNo: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/v1/wedding-certificates/verify/${registrationNo}`);
};

// GET: Full marriage certificate history for a person (by child id)
export const fetchWeddingCertificateHistoryForPerson = async (childId: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/v1/wedding-certificates/person/${childId}/history`);
};

// PATCH: Revoke a wedding certificate
export const revokeWeddingCertificate = async (
  registrationNo: string,
  payload: RevokePayload
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/v1/wedding-certificates/${registrationNo}/revoke`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};
