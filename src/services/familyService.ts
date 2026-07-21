import { authenticatedFetch } from "./api";

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
