import { authenticatedFetch } from "./api";

export type UserRole =
  | "USER"
  | "Super_Administrator"
  | "Service_Center_Agent"
  | "Financial_Institution"
  | "MNO"
  | "Agent"
  | "Customer"
  | "AUTHOR"
  | "STORE"
  | "FATHER"
  | "CHILD"
  | "ADMIN";

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING_APPROVAL"
  | "BLOCKED"
  | "LOGGED_OUT"
  | "PENDING";

export interface AdminUser {
  userName?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phoneNumber?: string;
  role?: UserRole;
  createdDate?: string;
  uuid?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

export interface PagedUsers {
  content: AdminUser[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

// GET: Paginated list of all users
export const fetchAllUsersPaginated = async (
  page = 0,
  size = 10,
  sort?: string[]
): Promise<PagedUsers> => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  if (sort) sort.forEach((s) => params.append("sort", s));
  const response = await authenticatedFetch<any>(`/api/v1/user/all/paginated?${params.toString()}`);
  if (response && Array.isArray(response.content)) return response;
  return { content: [], totalPages: 0, totalElements: 0, number: 0, size };
};

// GET: All users (unpaginated, from the auth controller)
export const fetchAllUsers = async (): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>("/api/v1/auth");
};

// GET: User details by access token
export const fetchUserDetailsByToken = async (accessToken: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(
    `/api/v1/user/user-details?accessToken=${encodeURIComponent(accessToken)}`
  );
};

// PUT: Update a user (name, phone, role, status)
export const updateUser = async (userId: string, payload: UpdateUserPayload): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/v1/auth/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};
