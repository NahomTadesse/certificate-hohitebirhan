// // lib/googleMapsConfig.ts
// export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// // Standardize libraries across the entire app
// export const GOOGLE_MAPS_LIBRARIES = ["places", "geometry"] as const;

// export const GOOGLE_MAPS_CONFIG = {
//   googleMapsApiKey: GOOGLE_MAPS_API_KEY,
//   libraries: GOOGLE_MAPS_LIBRARIES,
//   language: 'en',
//   region: 'ET', // Ethiopia
// } as const;

// lib/googleMapsConfig.ts
import { getPublicEnv } from "@/lib/runtimeEnv";
import {NEXT_PUBLIC_GOOGLE_PLACES_API_KEY} from "../constant"
// Remove "as const" or use a type that works with both
export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

// export const getGoogleMapsApiKey = () => getPublicEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
export const getGoogleMapsApiKey = NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
export const getGoogleMapsConfig = () => ({
  googleMapsApiKey: getGoogleMapsApiKey,
  libraries: GOOGLE_MAPS_LIBRARIES,
  language: "en",
  region: "ET",
});
