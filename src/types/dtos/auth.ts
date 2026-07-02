export interface LoginData {
  uuid: string;
  fullName: string;
  phoneNumber: string;
  accessToken: string;
  refreshToken: string;
  roles: string[];
  userType: string;
}

export type LoginResponse = LoginData;
