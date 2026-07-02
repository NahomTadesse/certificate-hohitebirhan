import { authenticatedFetch } from "./api";

export interface UserProfile {
  resources: any;
  id: number;
  email: string;
  phone: string;
  fullName: string;
  
  role: "SUPER_ADMIN" | "ADMIN" | "DRIVER" | "DISPATCHER" | "FLEET_MANAGER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  lastLogin: string;
  organizationId?: number;
  customerProfileId?: number;
}

export interface UpdateProfilePayload {
  email?: string;
  phone?: string;
  fullName?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const fetchUserProfile = async (): Promise<UserProfile> => {
  console.log("helooooo")
  return await authenticatedFetch<UserProfile>("api/auth/me");
};

export const updateUserProfile = async (payload: UpdateProfilePayload): Promise<UserProfile> => {
  return await authenticatedFetch<UserProfile>("api/auth/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
  return await authenticatedFetch<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};