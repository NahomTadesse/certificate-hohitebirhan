

import { authenticatedFetch, authenticatedFileUpload } from "./api";

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

export interface FatherDocument {
  id: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  uploadedAt?: string;
}

export interface Father {
  id: string;
  namePrefixLabel?: string; // honorific returned by the API
  profileImageUrl?: string; // not in the Swagger yet - see getFatherPhotoUrl() fallback to documents[]
  documents?: FatherDocument[];
  clericalRank?: string;
  clericalRankLabel?: string;
  monasticismType?: string;
  monasticName?: string;
  dioceseName?: string;
  christianName?: string;
  motherName?: string;
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
  namePrefixId?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  christianName?: string;
  motherName?: string;
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

// Search fathers. The current Swagger declares /api/fathers/search as a GET (filters as query
// params); older backend builds accepted a POST with a JSON body. Try GET first and fall back
// to POST when the server says the method/route isn't there.
export const searchFathers = async (
  filters: FatherSearchFilters,
  page = 0,
  size = 10
): Promise<PaginatedResponse<Father>> => {
  const empty = { content: [], totalElements: 0, totalPages: 0, empty: true } as PaginatedResponse<Father>;
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  params.set("page", String(page));
  params.set("size", String(size));
  try {
    const response = await authenticatedFetch<PaginatedResponse<Father>>(
      `/api/fathers/search?${params.toString()}`
    );
    return response || empty;
  } catch (err: any) {
    if (![404, 405, 415].includes(err?.status)) throw err;
    const response = await authenticatedFetch<PaginatedResponse<Father>>(
      `/api/fathers/search?page=${page}&size=${size}`,
      { method: "POST", body: JSON.stringify(filters) }
    );
    return response || empty;
  }
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

export interface FatherDropdownOption {
  id: string;
  fullName: string;
  churchName?: string;
}

// GET: Get fathers for dropdown (simplified - extracts from paginated response)
export const fetchFathersForDropdown = async (): Promise<FatherDropdownOption[]> => {
  // large page: the API defaults to 10 per page, so fathers after the 10th were missing from dropdowns
  const response = await authenticatedFetch<PaginatedResponse<Father>>("/api/fathers?page=0&size=1000");
  
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

// POST: Create new father (multipart: dto + optional documents/documentTypes, per swagger)
export const createFather = async (
  payload: CreateFatherPayload,
  documents?: File[],
  documentTypes?: string[]
): Promise<Father> => {
  if (documents && documents.length > 0) {
    const formData = new FormData();
    formData.append("dto", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    documents.forEach((file) => formData.append("documents", file));
    (documentTypes || []).forEach((dt) => formData.append("documentTypes", dt));
    return await authenticatedFileUpload<Father>("/api/fathers", formData, "POST");
  }
  return await authenticatedFetch<Father>("/api/fathers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// POST: Upload additional documents for an existing father (e.g. service-history attachments)
export const uploadFatherDocuments = async (
  fatherId: string,
  documents: File[],
  documentTypes?: string[]
): Promise<any> => {
  const formData = new FormData();
  documents.forEach((file) => formData.append("documents", file));
  (documentTypes || []).forEach((dt) => formData.append("documentTypes", dt));
  return await authenticatedFileUpload(`/api/fathers/${fatherId}/documents`, formData, "POST");
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