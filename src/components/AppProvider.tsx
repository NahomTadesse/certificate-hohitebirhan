"use client";

import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { hydrateAuth } from "@/store/hydrateAuth";

export default function AppProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    hydrateAuth();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
