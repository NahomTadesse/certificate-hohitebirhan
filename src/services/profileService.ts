import { authenticatedFetch } from "./api";

export interface UserProfile {
  userId?: string;
  customerId?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerImage?: string;
  userLanguage?: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface ChangePasswordPayload {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

// GET /api/v1/user/user-details?accessToken=...
export const fetchUserProfile = async (accessToken: string): Promise<UserProfile> => {
  return await authenticatedFetch<UserProfile>(
    `/api/v1/user/user-details?accessToken=${encodeURIComponent(accessToken)}`
  );
};

// PUT /api/v1/auth/{userId}
export const updateUserProfile = async (userId: string, payload: UpdateProfilePayload): Promise<any> => {
  return await authenticatedFetch<any>(`/api/v1/auth/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

// POST /api/v1/auth/change-password
export const changePassword = async (payload: ChangePasswordPayload): Promise<any> => {
  return await authenticatedFetch<any>("/api/v1/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
