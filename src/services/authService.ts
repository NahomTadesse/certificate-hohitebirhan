import { setCookie } from "cookies-next";

// Use the new certificate API endpoint
const API_BASE = "https://certificate-api.hohitebirhan.com"

const joinApiUrl = (endpoint: string) => {
  // Remove leading slash from endpoint if it exists
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  // If we have API_BASE configured, prepend it
  if (API_BASE) {
    // Remove trailing slash from API_BASE if it exists
    const base = API_BASE.replace(/\/$/, "");
    return `${base}${path}`;
  }
  
  // Fallback to relative /api path
  return `/api${path}`;
};

export interface LoginCredentials {
  principal: string;  // Can be email or phone number
  password: string;
}

export interface UserData {
  token: string;
  refreshToken?: string;
  fullName: string;
  email: string;
  phone?: string;
  userId: string;
  role: string;
  accountType?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: UserData;
  error?: string;
  role?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  accountType?: string;
}

export interface RegisterOperatorPayload {
  organizationName: string;
  registrationNumber: string;
  tinNumber: string;
  organizationType: "COMPANY" | "INDIVIDUAL";
  organizationAddress: {
    latitude: number;
    longitude: number;
    nameEng: string;
    nameAmh?: string;
    placeId: string;
    region: string;
    locationNotes?: string;
  };
  adminEmail: string;
  adminPhone: string;
  password: string;
  adminFullName: string;
}

export interface RegisterResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const url = joinApiUrl("api/v1/auth/login");
    console.log("Login URL:", url); // Debug log
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
      body: JSON.stringify({
        principal: credentials.principal,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || "Invalid credentials");
    }

    const responseData = await response.json();
    console.log("Login response:", responseData); // Debug log
    
    // Handle the actual API response structure
    // Response structure: { message, code, username, phoneNumber, userId, userStatus, role, access_token, refresh_token }
    
    if (responseData.access_token) {
      const userData: UserData = {
        token: responseData.access_token,
        refreshToken: responseData.refresh_token,
        fullName: responseData.username || responseData.fullName || responseData.name || "User",
        email: responseData.username || "", // username contains email in your response
        phone: responseData.phoneNumber || "",
        userId: responseData.userId,
        role: responseData.role || "user",
        accountType: responseData.accountType,
      };
      
      // Store the token
      setCookie("accessTokendash", userData.token, {
        maxAge: 60 * 60, // 1 hour
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      
      // Store refresh token if needed
      if (userData.refreshToken) {
        setCookie("refreshTokendash", userData.refreshToken, {
          maxAge: 60 * 60 * 24 * 7, // 7 days for refresh token
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
      
      // Store user data
      setCookie("user", JSON.stringify(userData), {
        maxAge: 60 * 60, // 1 hour
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      
      return { success: true, user: userData };
    }
    
    // If response doesn't have access_token, check for other possible structures
    if (responseData.token || responseData.accessToken) {
      const userData: UserData = {
        token: responseData.token || responseData.accessToken,
        refreshToken: responseData.refreshToken || responseData.refresh_token,
        fullName: responseData.fullName || responseData.name || responseData.username || "User",
        email: responseData.email || responseData.username || "",
        phone: responseData.phone || responseData.phoneNumber || "",
        userId: responseData.userId || responseData.id,
        role: responseData.role || "user",
        accountType: responseData.accountType,
      };
      
      setCookie("accessTokendash", userData.token, {
        maxAge: 60 * 60,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      
      if (userData.refreshToken) {
        setCookie("refreshTokendash", userData.refreshToken, {
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
      
      setCookie("user", JSON.stringify(userData), {
        maxAge: 60 * 60,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      
      return { success: true, user: userData };
    }
    
    return { success: false, error: responseData.message || "Login failed. Please try again." };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "Login failed. Please try again." };
  }
};

// Optional: Get current logged-in user from cookie
export const getCurrentUser = (): UserData | null => {
  if (typeof window === "undefined") return null;
  
  const userCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("user="));
  
  if (!userCookie) return null;
  
  try {
    const userData = JSON.parse(decodeURIComponent(userCookie.split("=")[1]));
    return userData as UserData;
  } catch {
    return null;
  }
};

// Logout
export const logoutUser = () => {
  document.cookie = "accessTokendash=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "refreshTokendash=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  window.location.href = "/login";
};

export const registerOperator = async (payload: RegisterOperatorPayload): Promise<RegisterResponse> => {
  try {
    const url = joinApiUrl("/auth/operator/signup");
    console.log("Register URL:", url); // Debug log
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("Error response:", errorData);
      
      // Extract the error message from the response
      let errorMessage = "Registration failed. Please try again.";
      
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.log("Error caught:", error);
    return { 
      success: false, 
      error: error.message || "Registration failed. Please try again." 
    };
  }
};