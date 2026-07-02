

import { authenticatedFetch, authenticatedFileUpload } from "./api";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "DRIVER" | "DISPATCHER" | "FLEET_MANAGER" | "CARRIER_ADMIN" | "SHIPPER" | "PASSENGER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING" | "UNDER_REVIEW";

export interface StopLocation {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
}

export interface CurrentRoute {
  routeId: string;
  tripId: string;
  routeName: string;
  shiftType: string;
  scheduledDate: string;
  scheduledStart: string;
  tripStatus: string;
  roundTrip: boolean;
  vehicleId: string;
  vehiclePlateNumber: string;
  destinationStopName: string;
}



export interface User {
  id: string;
  organizationId: string;
  pickupStopId?: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenceNumber?: string;
  role: UserRole;
  isActive: boolean;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
  pickupStop?: StopLocation;
  currentRoute?: CurrentRoute;
}

export interface NFCCard {
  cardUid: string;
  assigned_at: string;
  expires_at: string;
}

export interface UserPageResponse {
  success: boolean;
  data: User[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    pages: number;
  };
}

export interface UserDetailResponse {
  success: boolean;
  data: User;
  message?: string;
  error?: string;
}

export interface CreateUserPayload {
  organization_id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  stop?: StopLocation;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
  stop?: StopLocation;
}

export interface AssignNFCPayload {
  cardUid: string;
  expires_at: string;
}

export interface BulkUploadPayload {
  file: File;
  organization_id: string;
  role: UserRole;
  default_password: string;
}

// GET: List users with pagination and org filter
export const fetchUsers = async (
  page = 0,
  perPage = 10,
  orgId?: string
): Promise<UserPageResponse> => {
  let url = `/api/users?page=${page}&per_page=${perPage}`;
  if (orgId) {
    url += `&org_id=${orgId}`;
  }
  return await authenticatedFetch<UserPageResponse>(url);
};

// GET: Get single user by ID
export const fetchUserById = async (id: string): Promise<UserDetailResponse> => {
  return await authenticatedFetch<UserDetailResponse>(`/api/users/${id}`);
};

// POST: Create new user
export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  return await authenticatedFetch<User>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// PATCH: Update user
export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<User> => {
  return await authenticatedFetch<User>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

// POST: Assign NFC card to user
export const assignNFCCard = async (userId: string, payload: AssignNFCPayload): Promise<{ message: string; nfc_card: NFCCard }> => {
  return await authenticatedFetch(`/api/users/${userId}/nfc-card`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// DELETE: Revoke NFC card from user
export const revokeNFCCard = async (userId: string): Promise<{ message: string }> => {
  return await authenticatedFetch(`/api/users/${userId}/nfc-card`, {
    method: "DELETE",
  });
};

// DELETE: Delete user
export const deleteUser = async (id: string): Promise<void> => {
  return await authenticatedFetch(`/api/users/${id}`, {
    method: "DELETE",
  });
};

// GET: Fetch organizations for dropdown
export const fetchOrganizationsForDropdown = async (): Promise<Organization[]> => {
  const response = await authenticatedFetch<{ data: Organization[]; success: boolean }>("/api/organizations?page=1&per_page=100");
  return response.data || [];
};

// POST: Bulk upload users from Excel
// export const bulkUploadUsers = async (payload: BulkUploadPayload): Promise<{ success: boolean; message: string; data?: any }> => {
//   const formData = new FormData();
//   formData.append('file', payload.file);
  
//   const queryParams = new URLSearchParams({
//     organization_id: payload.organization_id,
//     role: payload.role,
//     default_password: payload.default_password
//   });
  
//   return await authenticatedFetch(`/api/users/bulk-upload?${queryParams.toString()}`, {
//     method: "POST",
//     body: formData,
//     headers: {} // Let browser set Content-Type for FormData
//   });
// };

export const bulkUploadUsers = async (payload: BulkUploadPayload): Promise<{ success: boolean; message: string; data?: any }> => {
  const formData = new FormData();
  formData.append('file', payload.file);
  
  const queryParams = new URLSearchParams({
    organization_id: payload.organization_id,
    role: payload.role,
    default_password: payload.default_password
  });
  
  return await authenticatedFileUpload(`/api/users/bulk-upload?${queryParams.toString()}`, formData);
};

interface Organization {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}