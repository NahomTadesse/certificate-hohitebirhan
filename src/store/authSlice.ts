import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { deleteCookie, getCookie, setCookie } from "cookies-next";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  roles: string[] | null;
  uuid: string | null;
  userType: string | null;
  isAuthenticated: boolean;
}

const getCookieValue = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  const cookie = getCookie(key);
  return cookie ? cookie.toString() : null;
};

const initialState: AuthState = {
  accessToken: getCookieValue("accessTokendash"),
  refreshToken: getCookieValue("refreshToken"),
  fullName: getCookieValue("fullName"),
  phoneNumber: getCookieValue("phoneNumber"),
  roles: getCookieValue("roles")
    ? JSON.parse(getCookieValue("roles")!)
    : null,
  uuid: getCookieValue("uuid"),
  userType: getCookieValue("userType"),
  isAuthenticated: !!getCookieValue("accessTokendash"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string;
        fullName?: string;
        phoneNumber?: string;
        roles?: string[];
        uuid?: string;
        userType: string;
      }>
    ) => {
      const {
        token,
        refreshToken = "",
        fullName = "",
        phoneNumber = "",
        roles = [],
        uuid = "",
        userType,
      } = action.payload;

      // Clear existing cookies
      [
        "accessTokendash",
        "refreshToken",
        "fullName",
        "phoneNumber",
        "roles",
        "uuid",
        "userType",
      ].forEach((key) => deleteCookie(key));

      setCookie("accessTokendash", token, {
        path: "/",
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });
      setCookie("refreshToken", refreshToken, {
        path: "/",
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });
      setCookie("fullName", fullName, {
        path: "/",
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });
      setCookie("phoneNumber", phoneNumber, {
        path: "/",
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });
      setCookie("roles", JSON.stringify(roles), {
        path: "/",
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });
      setCookie("uuid", uuid, {
        path: "/",
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });
      setCookie("userType", userType, {
        path: "/",
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });

      // Set state
      state.accessToken = token;
      state.refreshToken = refreshToken;
      state.fullName = fullName;
      state.phoneNumber = phoneNumber;
      state.roles = roles;
      state.uuid = uuid;
      state.userType = userType;
      state.isAuthenticated = true;
    },

    logout: (state) => {
      [
        "accessTokendash",
        "refreshToken",
        "fullName",
        "phoneNumber",
        "roles",
        "uuid",
        "userType",
      ].forEach((key) => deleteCookie(key));

      state.accessToken = null;
      state.refreshToken = null;
      state.fullName = null;
      state.phoneNumber = null;
      state.roles = null;
      state.uuid = null;
      state.userType = null;
      state.isAuthenticated = false;
    },

    setAuthToken: (state, action: PayloadAction<string>) => {
      const token = action.payload;

      setCookie("accessTokendash", token, {
        path: "/",
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });

      state.accessToken = token;
      state.isAuthenticated = true;
    },

    setRole: (state, action: PayloadAction<string>) => {
      const role = action.payload;

      setCookie("userType", role, {
        path: "/",
        secure: true,
        sameSite: "strict",
        maxAge: 86400,
      });

      state.userType = role;
    },
  },
});

export const { login, logout, setAuthToken, setRole } = authSlice.actions;
export default authSlice.reducer;
