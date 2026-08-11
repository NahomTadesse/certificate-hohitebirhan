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

export interface PaginatedResponse<T = any> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

const emptyPage = <T,>(): PaginatedResponse<T> => ({ content: [], totalElements: 0, totalPages: 0, empty: true });

const unwrapPage = <T,>(response: any): PaginatedResponse<T> => {
  if (response && response.success === true && response.data) {
    if (Array.isArray(response.data.content)) return response.data as PaginatedResponse<T>;
    if (Array.isArray(response.data)) return { content: response.data } as PaginatedResponse<T>;
  }
  if (Array.isArray(response?.content)) return response as PaginatedResponse<T>;
  if (Array.isArray(response)) return { content: response } as PaginatedResponse<T>;
  return emptyPage<T>();
};

// GET: List all wedding certificates for a church (paginated)
export const fetchWeddingCertificates = async (
  churchId: string,
  page = 0,
  size = 20
): Promise<PaginatedResponse> => {
  const response = await authenticatedFetch<any>(
    `/api/v1/wedding-certificates?churchId=${encodeURIComponent(churchId)}&page=${page}&size=${size}`
  );
  return unwrapPage(response);
};

// GET: Search wedding certificates by keyword within a church
export const searchWeddingCertificates = async (
  churchId: string,
  keyword: string,
  page = 0,
  size = 20
): Promise<PaginatedResponse> => {
  const response = await authenticatedFetch<any>(
    `/api/v1/wedding-certificates/search?churchId=${encodeURIComponent(churchId)}&keyword=${encodeURIComponent(
      keyword
    )}&page=${page}&size=${size}`
  );
  return unwrapPage(response);
};

// GET: List all wedding certificates across all churches (super admin)
export const fetchAllWeddingCertificatesForAdmin = async (
  page = 0,
  size = 20
): Promise<PaginatedResponse> => {
  const response = await authenticatedFetch<any>(
    `/api/v1/wedding-certificates/admin/all?page=${page}&size=${size}`
  );
  return unwrapPage(response);
};

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
