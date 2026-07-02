"use client";

import { useEffect } from "react";
import { hydrateAuth } from "@/store/hydrateAuth";

const HydrationClient = () => {
  useEffect(() => {
    hydrateAuth();
  }, []);

  return null;
};

export default HydrationClient;
