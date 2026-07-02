import { LoginResponse } from "@/types/dtos/auth";

export function isLoginResponse(response: unknown): response is LoginResponse {
  if (
    typeof response === "object" &&
    response?.hasOwnProperty("accessToken") === true
  ) {
    const data = response as LoginResponse;
    return (
      typeof data.accessToken === "string" && typeof data.fullName === "string"
    );
  }
  return false;
}
