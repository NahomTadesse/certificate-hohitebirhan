import { authenticatedFetch } from "./api";

export type MemberType = "CHILD" | "FAMILY_HEAD" | "CLERGY";

export interface DeathRecord {
  id?: string;
  registrationNo?: string;
  memberType: MemberType;
  memberId: string;
  memberName?: string;
  occupation?: string;
  rankOrTitle?: string;
  dateOfDeath: string;
  burialPlace?: string;
  officiant?: string;
  remarks?: string;
  revoked?: boolean;
  createdAt?: string;
}

export interface CreateDeathRecordPayload {
  memberType: MemberType;
  memberId: string;
  occupation?: string;
  rankOrTitle?: string;
  dateOfDeath: string;
  burialPlace?: string;
  officiant?: string;
  remarks?: string;
}

export interface RevokePayload {
  reason: string;
  revokedBy?: string;
}

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

const unwrap = <T,>(response: any, fallback: T): T => {
  if (response && response.success === true && response.data !== undefined) {
    return response.data as T;
  }
  if (Array.isArray(response)) return response as unknown as T;
  return fallback;
};

// GET: List all death records (paginated)
export const fetchDeathRecords = async (
  page = 0,
  size = 20
): Promise<DeathRecord[]> => {
  const response = await authenticatedFetch<any>(
    `/api/death-records?page=${page}&size=${size}`
  );
  const data = unwrap<any>(response, []);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
};

// POST: Record a death
export const recordDeath = async (
  payload: CreateDeathRecordPayload
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>("/api/death-records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// GET: Death records filtered by member type
export const fetchDeathRecordsByMemberType = async (
  memberType: MemberType,
  page = 0,
  size = 20
): Promise<DeathRecord[]> => {
  const response = await authenticatedFetch<any>(
    `/api/death-records/type/${memberType}?page=${page}&size=${size}`
  );
  const data = unwrap<any>(response, []);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
};

// GET: Verify a death record by registration number
export const verifyDeathRecord = async (
  registrationNo: string
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(
    `/api/death-records/verify/${registrationNo}`
  );
};

// PATCH: Revoke a death record
export const revokeDeathRecord = async (
  registrationNo: string,
  payload: RevokePayload
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(
    `/api/death-records/${registrationNo}/revoke`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
};
