import { authenticatedFetch } from "./api";

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  region: string;
  zone: string;
  woreda: string;
  kebele: string;
  additionalInfo: string;
  district: string;
  houseNumber: string;
  subcity: string;
  addressType: string;
}

export interface Church {
  id: string;
  name: string;
  diocese: string;
  address: Address;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChurchPageResponse {
  success: boolean;
  data: Church[];
  meta?: {
    page: number;
    perPage: number;
    total: number;
    pages: number;
  };
}

export interface ChurchDetailResponse {
  success: boolean;
  data: Church;
  message?: string;
  error?: string;
}

export interface CreateChurchPayload {
  name: string;
  diocese: string;
  address: Address;
}

export interface UpdateChurchPayload {
  name?: string;
  diocese?: string;
  address?: Address;
}

// GET: List all churches
export const fetchChurches = async (page = 0, perPage = 100): Promise<ChurchPageResponse> => {
  let url = `/api/church?page=${page}&per_page=${perPage}`;
  return await authenticatedFetch<ChurchPageResponse>(url);
};

// GET: Get single church by ID
export const fetchChurchById = async (id: string): Promise<ChurchDetailResponse> => {
  return await authenticatedFetch<ChurchDetailResponse>(`/api/church/${id}`);
};

// POST: Create new church
export const createChurch = async (payload: CreateChurchPayload): Promise<Church> => {
  return await authenticatedFetch<Church>("/api/church", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// PUT: Update church
export const updateChurch = async (id: string, payload: UpdateChurchPayload): Promise<Church> => {
  return await authenticatedFetch<Church>(`/api/church/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

// PUT: Deactivate church
export const deactivateChurch = async (id: string): Promise<void> => {
  return await authenticatedFetch(`/api/church/deactivate/${id}`, {
    method: "PUT",
  });
};

// GET: Fetch all churches for dropdown (simplified)
export const fetchChurchesForDropdown = async (): Promise<{ id: string; name: string }[]> => {
  const response = await authenticatedFetch<ChurchPageResponse>("/api/church?page=0&per_page=1000");
  return (response.data || []).map(church => ({
    id: church.id,
    name: church.name
  }));
};