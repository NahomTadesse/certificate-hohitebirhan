import { authenticatedFetch } from "./api";
import { BaseResponse, PaginatedResponse, qs, unwrapData, unwrapList, unwrapPage } from "./serviceHelpers";

export type ResourceType = "PHYSICAL_ITEM" | "PROPERTY" | "HISTORICAL";
export type AcquisitionType = "PURCHASED" | "DONATED" | "INHERITED" | "CONSTRUCTED" | "OTHER";
export type ResourceCondition = "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED" | "NEEDS_REPAIR" | "LOST";
export type AssignmentType = "PERMANENT" | "BORROWED";

export const RESOURCE_TYPES: ResourceType[] = ["PHYSICAL_ITEM", "PROPERTY", "HISTORICAL"];
export const ACQUISITION_TYPES: AcquisitionType[] = ["PURCHASED", "DONATED", "INHERITED", "CONSTRUCTED", "OTHER"];
export const RESOURCE_CONDITIONS: ResourceCondition[] = ["EXCELLENT", "GOOD", "FAIR", "DAMAGED", "NEEDS_REPAIR", "LOST"];

// ResourceRequestDTO
export interface ResourcePayload {
  name: string;
  type: ResourceType;
  inventoryCode?: string;
  category?: string;
  description?: string;
  yearOfOrigin?: number;
  originLocation?: string;
  historicalNotes?: string;
  acquisitionType?: AcquisitionType;
  acquisitionDate?: string;
  donorName?: string;
  estimatedValue?: number;
  condition?: ResourceCondition;
  conditionNotes?: string;
  storageLocation?: string;
  churchId?: string;
}

// AssignmentSummaryDTO
export interface AssignmentSummary {
  id?: string;
  assignedToFatherName?: string;
  assignedToDepartment?: string;
  assignmentType?: AssignmentType;
  assignedDate?: string;
  expectedReturnDate?: string;
  returnedDate?: string;
  notes?: string;
  active?: boolean;
  createdAt?: string;
}

// ResourceResponseDTO
export interface Resource extends Omit<ResourcePayload, "churchId"> {
  id: string;
  churchName?: string;
  currentAssignment?: AssignmentSummary | null;
  assignmentHistory?: AssignmentSummary[];
  active?: boolean;
}

// ResourceAssignmentRequestDTO
export interface ResourceAssignmentPayload {
  fatherId?: string;
  assignedToDepartment?: string;
  assignmentType: AssignmentType;
  assignedDate: string;
  expectedReturnDate?: string;
  notes?: string;
}

export interface ResourceCategory {
  value: string;
  amharicLabel?: string;
}

// GET /api/v1/resources
export const fetchResources = async (page = 0, size = 10, sortBy = "name"): Promise<PaginatedResponse<Resource>> =>
  unwrapPage<Resource>(await authenticatedFetch<any>(`/api/v1/resources${qs({ page, size, sortBy })}`));

// GET /api/v1/resources/search
export interface ResourceSearchFilters {
  name?: string;
  type?: ResourceType | "";
  condition?: ResourceCondition | "";
  category?: string;
  churchId?: string;
  isActive?: boolean;
}
export const searchResources = async (
  filters: ResourceSearchFilters,
  page = 0,
  size = 10
): Promise<PaginatedResponse<Resource>> =>
  unwrapPage<Resource>(await authenticatedFetch<any>(`/api/v1/resources/search${qs({ ...filters, page, size })}`));

// GET /api/v1/resources/church/{churchId}
export const fetchResourcesByChurch = async (churchId: string, page = 0, size = 10): Promise<PaginatedResponse<Resource>> =>
  unwrapPage<Resource>(await authenticatedFetch<any>(`/api/v1/resources/church/${churchId}${qs({ page, size })}`));

// GET /api/v1/resources/{id}
export const fetchResourceById = async (id: string): Promise<Resource> =>
  unwrapData<Resource>(await authenticatedFetch<any>(`/api/v1/resources/${id}`), {} as Resource);

// POST /api/v1/resources
export const createResource = async (payload: ResourcePayload): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>("/api/v1/resources", { method: "POST", body: JSON.stringify(payload) });

// PUT /api/v1/resources/{id}
export const updateResource = async (id: string, payload: ResourcePayload): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/resources/${id}`, { method: "PUT", body: JSON.stringify(payload) });

// PATCH /api/v1/resources/{id}/deactivate
export const deactivateResource = async (id: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/resources/${id}/deactivate`, { method: "PATCH" });

// POST /api/v1/resources/{id}/assign
export const assignResource = async (id: string, payload: ResourceAssignmentPayload): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/resources/${id}/assign`, { method: "POST", body: JSON.stringify(payload) });

// PATCH /api/v1/resources/{id}/return
export const returnResource = async (id: string, notes?: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/resources/${id}/return${qs({ notes })}`, { method: "PATCH" });

// GET /api/v1/resources/overdue
export const fetchOverdueResources = async (): Promise<Resource[]> =>
  unwrapList<Resource>(await authenticatedFetch<any>("/api/v1/resources/overdue"));

// GET /api/v1/resources/categories
export const fetchResourceCategories = async (): Promise<ResourceCategory[]> =>
  unwrapList<ResourceCategory>(await authenticatedFetch<any>("/api/v1/resources/categories"));

// GET /api/v1/resources/assigned-to-father/{fatherId}
export const fetchResourcesAssignedToFather = async (fatherId: string): Promise<Resource[]> =>
  unwrapList<Resource>(await authenticatedFetch<any>(`/api/v1/resources/assigned-to-father/${fatherId}`));
