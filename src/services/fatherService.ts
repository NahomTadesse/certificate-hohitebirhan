

import { authenticatedFetch } from "./api";

export interface SpiritualInfo {
  kinetPlace: string;
  kinetDate: string;
  currentChurchStartDate: string;
  role: string;
  startDate: string;
  endDate: string;
  numberOfChildren: number;
}

export interface ServiceHistory {
  churchName: string;
  startDate: string;
  endDate: string;
}

export interface Education {
  institutionName: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export interface TransferHistory {
  id: string;
  fromChurchName: string;
  toChurchName: string;
  transferDate: string;
}

export interface Father {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phoneNumber: string;
  userId?: string;
  churchId?: string;
  churchName?: string;
  active: boolean;
  fullName: string;
  spiritualInfo: SpiritualInfo[];
  serviceHistory: ServiceHistory[];
  educationList: Education[];
  transferHistory: TransferHistory[];
}

export interface CreateFatherPayload {
  firstName: string;
  middleName: string;
  lastName: string;
  phoneNumber: string;
  userId?: string;
  churchId: string;
  spiritualInfo: SpiritualInfo[];
  serviceHistory: ServiceHistory[];
  educationList: Education[];
}

// Paginated response interface
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// GET: List all fathers (returns paginated response)
export const fetchFathers = async (
  search?: string,
  page = 0,
  size = 10,
  sortBy = "firstName"
): Promise<PaginatedResponse<Father>> => {
  // The API does not support a `search` query param on this endpoint -
  // searching is a separate POST endpoint (see searchFathers below).
  if (search && search.trim()) {
    return searchFathers({ name: search.trim() }, page, size);
  }
  const response = await authenticatedFetch<PaginatedResponse<Father>>(
    `/api/fathers?page=${page}&size=${size}&sortBy=${encodeURIComponent(sortBy)}`
  );
  return response || { content: [], totalElements: 0, totalPages: 0, empty: true } as PaginatedResponse<Father>;
};

// Search filters accepted by POST /api/fathers/search
export interface FatherSearchFilters {
  name?: string;
  clericalRank?: string;
  monasticismType?: string;
  churchId?: string;
  dioceseId?: string;
  isActive?: boolean;
}

// POST: Search fathers (correct endpoint per swagger - /api/fathers/search is a POST)
export const searchFathers = async (
  filters: FatherSearchFilters,
  page = 0,
  size = 10
): Promise<PaginatedResponse<Father>> => {
  const response = await authenticatedFetch<PaginatedResponse<Father>>(
    `/api/fathers/search?page=${page}&size=${size}`,
    {
      method: "POST",
      body: JSON.stringify(filters),
    }
  );
  return response || { content: [], totalElements: 0, totalPages: 0, empty: true } as PaginatedResponse<Father>;
};

// GET: Get single father by ID
export const fetchFatherById = async (id: string): Promise<Father> => {
  return await authenticatedFetch<Father>(`/api/fathers/${id}`);
};

// GET: Get fathers by church ID (returns paginated response)
export const fetchFathersByChurch = async (churchId: string): Promise<PaginatedResponse<Father>> => {
  const response = await authenticatedFetch<PaginatedResponse<Father>>(`/api/fathers/church/${churchId}`);
  return response || { content: [], totalElements: 0, totalPages: 0, empty: true } as PaginatedResponse<Father>;
};

// GET: Get fathers for dropdown (simplified - extracts from paginated response)
export const fetchFathersForDropdown = async (): Promise<{ id: string; fullName: string; churchName?: string }[]> => {
  const response = await authenticatedFetch<PaginatedResponse<Father>>("/api/fathers");
  
  // Check if response exists and has content
  if (response && response.content && Array.isArray(response.content)) {
    return response.content.map(father => ({
      id: father.id,
      fullName: father.fullName || `${father.firstName} ${father.middleName || ''} ${father.lastName}`.trim(),
      churchName: father.churchName,
    }));
  }
  
  // If response is an array (fallback for non-paginated endpoints)
  if (Array.isArray(response)) {
    return response.map(father => ({
      id: father.id,
      fullName: father.fullName || `${father.firstName} ${father.middleName || ''} ${father.lastName}`.trim(),
      churchName: father.churchName,
    }));
  }
  
  // Return empty array if no data
  return [];
};

// POST: Create new father
export const createFather = async (payload: CreateFatherPayload): Promise<Father> => {
  return await authenticatedFetch<Father>("/api/fathers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// DELETE: Delete father
export const deleteFather = async (id: string): Promise<void> => {
  return await authenticatedFetch(`/api/fathers/${id}`, {
    method: "DELETE",
  });
};

// PUT: Update father
export const updateFather = async (id: string, payload: CreateFatherPayload): Promise<any> => {
  return await authenticatedFetch(`/api/fathers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

// PATCH: Transfer father to a new church
export const transferFather = async (id: string, newChurchId: string): Promise<any> => {
  return await authenticatedFetch(`/api/fathers/${id}/transfer?newChurchId=${newChurchId}`, {
    method: "PATCH",
  });
};

// PATCH: Deactivate father
export const deactivateFather = async (id: string): Promise<any> => {
  return await authenticatedFetch(`/api/fathers/${id}/deactivate`, {
    method: "PATCH",
  });
};

// GET: Fathers by clerical rank (paginated)
export const fetchFathersByRank = async (rank: string): Promise<PaginatedResponse<Father>> => {
  const response = await authenticatedFetch<PaginatedResponse<Father>>(`/api/fathers/rank/${rank}`);
  return response || ({ content: [], totalElements: 0, totalPages: 0, empty: true } as PaginatedResponse<Father>);
};

// GET: Fathers by monasticism type (paginated)
export const fetchFathersByMonasticism = async (type: string): Promise<PaginatedResponse<Father>> => {
  const response = await authenticatedFetch<PaginatedResponse<Father>>(`/api/fathers/monasticism/${type}`);
  return response || ({ content: [], totalElements: 0, totalPages: 0, empty: true } as PaginatedResponse<Father>);
};

// GET: Fathers by diocese (paginated)
export const fetchFathersByDiocese = async (dioceseId: string): Promise<PaginatedResponse<Father>> => {
  const response = await authenticatedFetch<PaginatedResponse<Father>>(`/api/fathers/diocese/${dioceseId}`);
  return response || ({ content: [], totalElements: 0, totalPages: 0, empty: true } as PaginatedResponse<Father>);
};

// DELETE: Delete an uploaded father document
export const deleteFatherDocument = async (documentId: string): Promise<any> => {
  return await authenticatedFetch(`/api/fathers/documents/${documentId}`, {
    method: "DELETE",
  });
};