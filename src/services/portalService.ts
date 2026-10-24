import { authenticatedFetch } from "./api";
import { BaseResponse, PaginatedResponse, qs, unwrapList, unwrapPage } from "./serviceHelpers";

export type GuardianRelation = "PARENT" | "GUARDIAN" | "OTHER";

// POST /api/v1/portal/guardians/{userId}/children/{childId}?relation=
export const linkGuardianToChild = async (
  userId: string,
  childId: string,
  relation?: GuardianRelation
): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/portal/guardians/${userId}/children/${childId}${qs({ relation })}`, {
    method: "POST",
  });

// DELETE /api/v1/portal/guardians/{userId}/children/{childId}
export const unlinkGuardianFromChild = async (userId: string, childId: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/portal/guardians/${userId}/children/${childId}`, { method: "DELETE" });

// POST /api/v1/portal/fathers/{fatherId}/link-user/{userId}
export const linkFatherToUser = async (fatherId: string, userId: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/portal/fathers/${fatherId}/link-user/${userId}`, { method: "POST" });

// GET /api/v1/portal/guardians/{userId}/children
export const fetchGuardianChildren = async (userId: string): Promise<any[]> =>
  unwrapList<any>(await authenticatedFetch<any>(`/api/v1/portal/guardians/${userId}/children`));

// GET /api/v1/portal/fathers/{userId}/children
export const fetchFatherUserChildren = async (userId: string, page = 0, size = 20): Promise<PaginatedResponse<any>> =>
  unwrapPage<any>(await authenticatedFetch<any>(`/api/v1/portal/fathers/${userId}/children${qs({ page, size })}`));

// GET /api/v1/portal/children/{childId}/guardians
export const fetchChildGuardians = async (childId: string): Promise<any[]> =>
  unwrapList<any>(await authenticatedFetch<any>(`/api/v1/portal/children/${childId}/guardians`));
