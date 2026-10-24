import { authenticatedFetch, authenticatedFileUpload } from "./api";

export type RelationType = "HEAD" | "WIFE" | "HUSBAND" | "SON" | "DAUGHTER" | "OTHER";

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

export interface FamilyMemberPayload {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  relationType: RelationType;
  existingChildId?: string;
}

export interface MarriageCertificatePayload {
  brideFamilyMemberId?: string;
  groomNationality?: string;
  brideName?: string;
  brideNationality?: string;
  performingPriestId?: string;
  performingPriestName?: string;
  church?: string;
  country?: string;
  marriageDate?: string;
  witnessNames?: string[];
}

// POST: Add a member (spouse/child/relative) under a family head
export const addFamilyMember = async (
  familyHeadId: string,
  payload: FamilyMemberPayload
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/families/${familyHeadId}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// POST: Record a marriage for a family head
export const recordMarriage = async (
  familyHeadId: string,
  payload: MarriageCertificatePayload
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/families/${familyHeadId}/marriage`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// POST: Promote an existing family member (e.g. a grown child) to be their own family head
export const promoteFamilyMemberToFamilyHead = async (
  familyMemberId: string,
  relatives: FamilyMemberPayload[] = []
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/families/members/${familyMemberId}/promote`, {
    method: "POST",
    body: JSON.stringify({ relatives }),
  });
};

// POST: Promote a registered child directly to family head status
export const promoteChildToFamilyHead = async (
  childId: string,
  relatives: FamilyMemberPayload[] = []
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/families/children/${childId}/promote`, {
    method: "POST",
    body: JSON.stringify({ relatives }),
  });
};


export interface FamilySearchFilters {
  firstName?: string;
  lastName?: string;
  sebekaMemberId?: string;
  gender?: "MALE" | "FEMALE";
}

// GET: All families of a church (paginated) - /api/families/families
export const fetchFamilies = async (churchId: string, page = 0, size = 20): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(
    `/api/families/families?churchId=${encodeURIComponent(churchId)}&page=${page}&size=${size}`
  );

// GET: Search families of a church - /api/families/families/search
export const searchFamilies = async (
  churchId: string,
  filters: FamilySearchFilters,
  page = 0,
  size = 20
): Promise<BaseResponse> => {
  const params = new URLSearchParams({ churchId, page: String(page), size: String(size) });
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, String(v));
  });
  return authenticatedFetch<BaseResponse>(`/api/families/families/search?${params.toString()}`);
};

// POST: Bulk promote children to family heads from a spreadsheet - /api/families/bulk-promote
export const bulkPromoteFamilies = async (file: File): Promise<BaseResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  return authenticatedFileUpload<BaseResponse>("/api/families/bulk-promote", formData, "POST");
};
