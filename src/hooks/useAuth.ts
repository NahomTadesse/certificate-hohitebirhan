import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export function useAuth() {
  const {
    accessToken,
    fullName,
    phoneNumber,
    roles,
    uuid,
    userType,
    isAuthenticated,
  } = useSelector((state: RootState) => state.auth);

  const isAdmin = roles?.includes("ADMIN") || roles?.includes("SUPER");

  return {
    isAuthenticated,
    isAdmin,
    accessToken,
    fullName,
    phoneNumber,
    roles,
    uuid,
    userType,
  };
}
