import { authenticatedFetch } from "./api";

export interface Child {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  fatherId: string;
  fatherName?: string;
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChildPayload {
  firstName: string;
  middleName: string;
  lastName: string;
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
export const fetchChildren = async (): Promise<Child[]> => {
  const response = await authenticatedFetch<any>("/api/children");
  
  // Handle the API response structure
  // Response format: { message: string, success: boolean, data: Child[] }
  if (response && response.success === true && Array.isArray(response.data)) {
    return response.data;
  }
  
  // Fallback: if response is directly an array
  if (Array.isArray(response)) {
    return response;
  }
  
  // If response is empty or invalid, return empty array
  console.warn('Unexpected response structure from fetchChildren:', response);
  return [];
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

// POST: Create new child
export const createChild = async (payload: CreateChildPayload): Promise<Child> => {
  return await authenticatedFetch<Child>("/api/children", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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