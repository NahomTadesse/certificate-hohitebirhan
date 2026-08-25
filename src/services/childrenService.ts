import { authenticatedFetch, authenticatedFileUpload } from "./api";

export interface Child {
  id: string;
  prefix?: string; // e.g. "Ato", "W/ro", "Kes" - honorific shown before the name
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
  fatherName?: string;
  fullName?: string;
  profileImageUrl?: string;
  isPrinted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChildPayload {
  prefix?: string;
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

// POST: Search children (correct endpoint per swagger - /api/children/search is a POST)
export const searchChildren = async (
  filters: ChildSearchFilters,
  page = 0,
  size = 10
): Promise<Child[]> => {
  const response = await authenticatedFetch<any>(`/api/children/search?page=${page}&size=${size}`, {
    method: "POST",
    body: JSON.stringify(filters),
  });
  return extractChildList(response);
};

// GET: Fetch children for dropdown (simplified)
export const fetchChildrenForDropdown = async (): Promise<{ id: string; fullName: string }[]> => {
  const children = await fetchChildren();
  return children.map((c) => ({
    id: c.id,
    fullName: c.fullName || `${c.firstName} ${c.middleName || ""} ${c.lastName}`.trim(),
  }));
};

// GET: Get single child by ID
export const fetchChildById = async (id: string): Promise<Child> => {
  return await authenticatedFetch<Child>(`/api/children/${id}`);
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