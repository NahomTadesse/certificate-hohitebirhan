// Shared helpers for unwrapping the API's { message, success, data } envelope and Spring pages.
export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

export interface PaginatedResponse<T = any> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export const unwrapData = <T = any>(response: any, fallback: T): T => {
  if (response && typeof response === "object" && "data" in response && response.data !== undefined) {
    return response.data as T;
  }
  return (response as T) ?? fallback;
};

export const unwrapList = <T = any>(response: any): T[] => {
  if (Array.isArray(response)) return response;
  const d = response?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.content)) return d.content;
  if (Array.isArray(response?.content)) return response.content;
  return [];
};

export const unwrapPage = <T = any>(response: any): PaginatedResponse<T> => {
  if (response?.data && Array.isArray(response.data.content)) return response.data as PaginatedResponse<T>;
  if (Array.isArray(response?.content)) return response as PaginatedResponse<T>;
  const list = unwrapList<T>(response);
  return { content: list, totalElements: list.length, totalPages: list.length ? 1 : 0, empty: list.length === 0 };
};

export const qs = (params: Record<string, any>): string => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};
