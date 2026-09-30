import { authenticatedFetch } from "./api";

// Honorific prefixes (Ato, W/ro, Kes, ...) managed by the name-prefix-controller.
export interface NamePrefix {
  id: string;
  code?: string;
  label: string;
  amharicLabel?: string;
  appliesTo?: "MALE" | "FEMALE" | string;
  active?: boolean;
}

export interface NamePrefixPayload {
  code: string;
  label: string;
  amharicLabel?: string;
  appliesTo: "MALE" | "FEMALE";
}

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

const toList = (response: any): NamePrefix[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.content)) return response.content;
  return [];
};

// GET /api/v1/name-prefixes
export const fetchNamePrefixes = async (): Promise<NamePrefix[]> =>
  toList(await authenticatedFetch<any>("/api/v1/name-prefixes"));

// GET /api/v1/name-prefixes/for-gender/{gender}
export const fetchNamePrefixesForGender = async (gender: string): Promise<NamePrefix[]> => {
  if (!gender) return [];
  return toList(await authenticatedFetch<any>(`/api/v1/name-prefixes/for-gender/${gender}`));
};

// POST /api/v1/name-prefixes
export const createNamePrefix = async (payload: NamePrefixPayload): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>("/api/v1/name-prefixes", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// PUT /api/v1/name-prefixes/{id}
// NOTE: NOT in the current Swagger - the backend must add it (see BACKEND_CHANGES_NEEDED.md).
export const updateNamePrefix = async (id: string, payload: NamePrefixPayload): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/name-prefixes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// PATCH /api/v1/name-prefixes/{id}/deactivate
export const deactivateNamePrefix = async (id: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/name-prefixes/${id}/deactivate`, { method: "PATCH" });

// PATCH /api/v1/name-prefixes/{id}/activate
// NOTE: NOT in the current Swagger - the backend must add it (see BACKEND_CHANGES_NEEDED.md).
export const activateNamePrefix = async (id: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/name-prefixes/${id}/activate`, { method: "PATCH" });

// Label to display for a prefix (Amharic when the UI is Amharic and one exists)
export const prefixDisplay = (p?: Pick<NamePrefix, "label" | "amharicLabel"> | null, lang?: string): string => {
  if (!p) return "";
  return lang === "am" && p.amharicLabel ? p.amharicLabel : p.label;
};
