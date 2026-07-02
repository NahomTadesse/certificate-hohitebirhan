import { authenticatedFetch } from "./api";

export interface Diocese {
  id: string;
  name: string;
  nameEnglish?: string;
  bishopName?: string;
  location?: string;
  active?: boolean;
}

export interface CreateDiocesePayload {
  name: string;
  nameEnglish?: string;
  bishopName?: string;
  location?: string;
}

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

// GET: List all dioceses
export const fetchDioceses = async (): Promise<Diocese[]> => {
  const response = await authenticatedFetch<any>("/api/v1/dioceses");
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  return [];
};

// GET: Diocese by id
export const fetchDioceseById = async (id: string): Promise<Diocese> => {
  return await authenticatedFetch<Diocese>(`/api/v1/dioceses/${id}`);
};

// POST: Create diocese
export const createDiocese = async (payload: CreateDiocesePayload): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>("/api/v1/dioceses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// PUT: Update diocese
export const updateDiocese = async (id: string, payload: CreateDiocesePayload): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/v1/dioceses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

// PATCH: Deactivate diocese
export const deactivateDiocese = async (id: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/v1/dioceses/${id}/deactivate`, {
    method: "PATCH",
  });
};

// GET: Fetch dioceses for dropdowns
export const fetchDiocesesForDropdown = async (): Promise<{ id: string; name: string }[]> => {
  const dioceses = await fetchDioceses();
  return dioceses.map((d) => ({ id: d.id, name: d.name }));
};
