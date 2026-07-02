

import { getCookie, setCookie, deleteCookie } from "cookies-next";
import i18next from "@/services/i18next";

// Use the environment variable or fallback to the old behavior
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const API_BASE = "https://certificate-api.hohitebirhan.com"
const joinApiUrl = (input: string | URL) => {
  const str = input.toString();
  
  // If it's already an absolute URL, return as is
  if (str.startsWith("http")) return str;
  
  // If we have API_BASE configured, prepend it
  if (API_BASE) {
    // Remove trailing slash from API_BASE if it exists
    const base = API_BASE.replace(/\/$/, "");
    // Remove leading slash from input if it exists
    const path = str.startsWith("/") ? str : `/${str}`;
    return `${base}${path}`;
  }
  
  // Fallback to the old behavior with /api prefix
  const API_PREFIX = "/api";
  if (str.startsWith(API_PREFIX)) return str;
  if (str.startsWith("/")) return `${API_PREFIX}${str}`;
  return `${API_PREFIX}/${str}`;
};

export const getAccessToken = (): string | null => {
  const token = getCookie("accessTokendash");
  return typeof token === "string" ? token : null;
};

const getRefreshToken = (): string | null => {
  const token = getCookie("refreshTokendash");
  return typeof token === "string" ? token : null;
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return !payload.exp || Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  const url = joinApiUrl("/api/auth/refresh");
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const result = await response.json();
  
  if (result.success && result.data && result.data.accessToken) {
    return result.data.accessToken;
  }
  
  throw new Error("Invalid refresh response");
};

export const unauthenticatedFetch = async <T = any>(
  input: string | URL,
  init?: RequestInit
): Promise<T> => {
  const url = joinApiUrl(input);
  console.log("Fetching URL:", url);
  
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
      "Accept-language": i18next.language,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error || response.statusText}`);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
};

export const authenticatedFetch = async <T = any>(
  input: string | URL,
  init?: RequestInit
): Promise<T> => {
  let token = getAccessToken();
  console.log("hello", token);

  if (!token || isTokenExpired(token)) {
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  const makeRequest = async (accessToken: string): Promise<T> => {
    const url = joinApiUrl(input);
    console.log("Fetching authenticated URL:", url);

    const response = await fetch(url, {
      ...init,
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept-language": i18next.language,
        ...init?.headers,
      },
    });

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(errorText || response.statusText);
      (error as any).status = response.status;
      throw error;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  };

  try {
    return await makeRequest(token);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        window.location.href = "/login";
        throw new Error("Session expired. Please log in again.");
      }

      try {
        const newAccessToken = await refreshAccessToken(refreshToken);
        setCookie("accessTokendash", newAccessToken);
        return await makeRequest(newAccessToken);
      } catch (refreshError) {
        window.location.href = "/login";
        throw new Error("Session expired. Please log in again.");
      }
    }
    
    throw error;
  }
};

export const authenticatedFileUpload = async <T = any>(
  input: string | URL,
  formData: FormData,
  method: string = "POST"
): Promise<T> => {
  let token = getAccessToken();

  if (!token || isTokenExpired(token)) {
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  const makeFileRequest = async (accessToken: string): Promise<T> => {
    const url = joinApiUrl(input);

    const response = await fetch(url, {
      method,
      body: formData,
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${accessToken}`,
        "Accept-language": i18next.language,
      },
    });

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(errorText || response.statusText);
      (error as any).status = response.status;
      throw error;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  };

  try {
    return await makeFileRequest(token);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        window.location.href = "/login";
        throw new Error("Session expired. Please log in again.");
      }

      try {
        const newAccessToken = await refreshAccessToken(refreshToken);
        setCookie("accessTokendash", newAccessToken);
        return await makeFileRequest(newAccessToken);
      } catch (refreshError) {
        window.location.href = "/login";
        throw new Error("Session expired. Please log in again.");
      }
    }
    
    throw error;
  }
};