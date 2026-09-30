import { authenticatedFetch, authenticatedFileUpload } from "./api";

export interface Child {
  id: string;
  namePrefixId?: string;
  namePrefixLabel?: string; // honorific returned by the API, e.g. "Ato", "W/ro", "Kes"
  firstName: string;
  middleName: string;
  lastName: string;
  sebekaMemberId?: string;
  active?: boolean;
  qrCode?: string | null;
  qrLink?: string | null;
  familyStatus?: string;
  family?: any;
  churchName?: string;
  placeOfBirth?: string;
  nationality?: string;
  christianName?: string;
  motherName?: string;
  email?: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  fatherId: string;
  fatherName?: string;
  fullName?: string;
  profileImageUrl?: string;
  isPrinted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChildPayload {
  namePrefixId?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  christianName?: string;
  motherName?: string;
  email?: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  fatherId: string;
  placeOfBirth?: string;
  nationality?: string;
}

export interface UpdateFatherPayload {
  newFatherId: string;
  reason: string;
}

// GET: List all children
// GET: List all children
// export const fetchChildren = async (): Promise<Child[]> => {
//   const response = await authenticatedFetch<any>("/api/children");
  
//   // Handle the API response structure
//   // Response format: { message: string, success: boolean, data: Child[] }
//   if (response && response.success === true && Array.isArray(response.data)) {
//     return response.data;
//   }
  
//   // Fallback: if response is directly an array
//   if (Array.isArray(response)) {
//     return response;
//   }
  
//   // If response is empty or invalid, return empty array
//   console.warn('Unexpected response structure from fetchChildren:', response);
//   return [];
// };
const extractChildList = (response: any): Child[] => {
  // Handle the paginated API response structure
  // Response format: { message: string, success: boolean, data: { content: Child[], pageable: {...}, ... } }
  if (response && response.success === true && response.data) {
    if (Array.isArray(response.data.content)) {
      return response.data.content;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
  }

  // Fallback: if response is directly an array
  if (Array.isArray(response)) {
    return response;
  }

  console.warn('Unexpected response structure from children endpoint:', response);
  return [];
};

// GET: List all children
export const fetchChildren = async (
  search?: string,
  page = 0,
  size = 10,
  sortBy = "firstName"
): Promise<Child[]> => {
  // The API does not support a `search` query param on this endpoint -
  // searching is a separate POST endpoint (see searchChildren below).
  if (search && search.trim()) {
    return searchChildren({ name: search.trim() }, page, size);
  }
  const response = await authenticatedFetch<any>(
    `/api/children?page=${page}&size=${size}&sortBy=${encodeURIComponent(sortBy)}`
  );
  return extractChildList(response);
};

// Search filters accepted by POST /api/children/search
export interface ChildSearchFilters {
  name?: string;
  fatherId?: string;
  gender?: string;
  dobFrom?: string;
  dobTo?: string;
  isActive?: boolean;
}

// Search children. The current Swagger declares /api/children/search as a GET (filters as query
// params); older backend builds accepted a POST with a JSON body. Try GET first and fall back
// to POST when the server says the method/route isn't there.
export const searchChildren = async (
  filters: ChildSearchFilters,
  page = 0,
  size = 10
): Promise<Child[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  params.set("page", String(page));
  params.set("size", String(size));
  try {
    const response = await authenticatedFetch<any>(`/api/children/search?${params.toString()}`);
    return extractChildList(response);
  } catch (err: any) {
    if (![404, 405, 415].includes(err?.status)) throw err;
    const response = await authenticatedFetch<any>(`/api/children/search?page=${page}&size=${size}`, {
      method: "POST",
      body: JSON.stringify(filters),
    });
    return extractChildList(response);
  }
};

export interface ChildDropdownOption {
  id: string;
  fullName: string;
  gender?: string;
  profileImageUrl?: string; // relative path from the API - run through resolveImageUrl() to display
  namePrefixLabel?: string;
}

// GET: Fetch children for dropdown (simplified).
// Asks for a large page: the API defaults to 10 per page, which made every child after the
// 10th impossible to pick in the certificate / payment / family dropdowns.
export const fetchChildrenForDropdown = async (): Promise<ChildDropdownOption[]> => {
  const children = await fetchChildren(undefined, 0, 1000);
  return children.map((c) => ({
    id: c.id,
    fullName: c.fullName || `${c.firstName} ${c.middleName || ""} ${c.lastName}`.trim(),
    gender: c.gender,
    profileImageUrl: c.profileImageUrl,
    namePrefixLabel: c.namePrefixLabel,
  }));
};

// GET: Get single child by ID
// (the API wraps the child in { message, success, data } - unwrap it)
export const fetchChildById = async (id: string): Promise<Child> => {
  const response = await authenticatedFetch<any>(`/api/children/${id}`);
  return (response && response.data ? response.data : response) as Child;
};

// POST: Create new child (multipart: dto + optional profileImage, per swagger)
export const createChild = async (payload: CreateChildPayload, profileImage?: File | null): Promise<Child> => {
  const formData = new FormData();
  formData.append("dto", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (profileImage) formData.append("profileImage", profileImage);
  return await authenticatedFileUpload<Child>("/api/children", formData, "POST");
};

// PUT: Change father
export const changeFather = async (childId: string, newFatherId: string, reason: string): Promise<void> => {
  return await authenticatedFetch(`/api/children/${childId}/change-father?newFatherId=${newFatherId}&reason=${encodeURIComponent(reason)}`, {
    method: "PUT",
  });
};

// DELETE: Delete child
export const deleteChild = async (id: string): Promise<void> => {
  return await authenticatedFetch(`/api/children/${id}`, {
    method: "DELETE",
  });
};

// PUT: Update child (multipart: dto + optional profileImage, per swagger)
export const updateChild = async (
  id: string,
  payload: Partial<CreateChildPayload>,
  profileImage?: File | null
): Promise<any> => {
  const formData = new FormData();
  formData.append("dto", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (profileImage) formData.append("profileImage", profileImage);
  return await authenticatedFileUpload(`/api/children/${id}`, formData, "PUT");
};

// PATCH: Deactivate child
export const deactivateChild = async (id: string): Promise<any> => {
  return await authenticatedFetch(`/api/children/${id}/deactivate`, {
    method: "PATCH",
  });
};

// GET: Children by father (paginated)
export const fetchChildrenByFather = async (
  fatherId: string,
  page = 0,
  size = 10
): Promise<Child[]> => {
  const response = await authenticatedFetch<any>(
    `/api/children/father/${fatherId}?page=${page}&size=${size}`
  );
  return extractChildList(response);
};