import { store } from "./store";
import { setAuthToken } from "./authSlice";
import { getCookie } from "cookies-next";

export const hydrateAuth = () => {
  if (typeof window === "undefined") return;

  const accessToken = getCookie("accessTokendash")?.toString() || "";

  if (accessToken) {
    store.dispatch(setAuthToken(accessToken));
  }
};
