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

// GET: List all baptism certificates for a church (paginated)
export const fetchBaptismCertificates = async (
  churchId: string,
  page = 0,
  size = 20
): Promise<PaginatedResponse> => {
  const response = await authenticatedFetch<any>(
    `/api/baptism-certificates?churchId=${encodeURIComponent(churchId)}&page=${page}&size=${size}`
  );
  return unwrapPage(response);
};

// GET: Search baptism certificates by keyword within a church
export const searchBaptismCertificates = async (
  churchId: string,
  keyword: string,
  page = 0,
  size = 20
): Promise<PaginatedResponse> => {
  const response = await authenticatedFetch<any>(
    `/api/baptism-certificates/search?churchId=${encodeURIComponent(churchId)}&keyword=${encodeURIComponent(
      keyword
    )}&page=${page}&size=${size}`
  );
  return unwrapPage(response);
};

// GET: List all baptism certificates across all churches (super admin)
export const fetchAllBaptismCertificatesForAdmin = async (
  page = 0,
  size = 20
): Promise<PaginatedResponse> => {
  const response = await authenticatedFetch<any>(`/api/baptism-certificates/admin/all?page=${page}&size=${size}`);
  return unwrapPage(response);
};

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
