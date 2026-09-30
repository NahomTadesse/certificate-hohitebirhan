// Central place for turning API image paths into displayable URLs.
// The backend returns relative paths such as
//   /api/files/children/<childId>/<file>.png
// which must be served from the certificate API host.
export const IMAGE_BASE_URL = "https://certificate-api.hohitebirhan.com";

export const resolveImageUrl = (path?: string | null): string | null => {
  if (!path) return null;
  const p = String(path).trim();
  if (!p) return null;
  // Already absolute, or an in-memory / inline image (preview, base64)
  if (/^(https?:)?\/\//i.test(p) || p.startsWith("data:") || p.startsWith("blob:")) return p;
  return `${IMAGE_BASE_URL}${p.startsWith("/") ? "" : "/"}${p}`;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;

// A father has no `profileImageUrl` in the current Swagger, only `documents[]`.
// Use an explicit profileImageUrl if the backend ever adds it, otherwise fall back
// to the newest uploaded document that is an image (profile photos are uploaded
// with documentType "PROFILE_PHOTO").
export const getFatherPhotoUrl = (father?: any): string | null => {
  if (!father) return null;
  if (father.profileImageUrl) return resolveImageUrl(father.profileImageUrl);
  const docs: any[] = Array.isArray(father.documents) ? father.documents : [];
  const isImage = (d: any) =>
    (typeof d?.fileType === "string" && d.fileType.toLowerCase().startsWith("image")) ||
    IMAGE_EXT.test(d?.fileUrl || "") ||
    IMAGE_EXT.test(d?.fileName || "");
  const images = docs.filter(isImage);
  if (images.length === 0) return null;
  const profile = images.filter((d) => /profile|photo/i.test(`${d.fileType || ""} ${d.fileName || ""}`));
  const pool = profile.length ? profile : images;
  const sorted = [...pool].sort(
    (a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
  );
  return resolveImageUrl(sorted[0]?.fileUrl);
};

export const initialsOf = (name?: string): string =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?";
