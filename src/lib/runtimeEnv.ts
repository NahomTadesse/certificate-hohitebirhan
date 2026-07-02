export const getPublicEnv = (key: keyof PublicRuntimeEnv): string => {
  // Build-time only: for Next.js to inline `NEXT_PUBLIC_*` values into the client bundle,
  // the access must be statically analyzable (not `process.env[key]`).
  switch (key) {
    case "NEXT_PUBLIC_GOOGLE_PLACES_API_KEY":
      return process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";
    case "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY":
      return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    default:
      return "";
  }
};

type PublicRuntimeEnv = {
  NEXT_PUBLIC_GOOGLE_PLACES_API_KEY?: string;
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
};
