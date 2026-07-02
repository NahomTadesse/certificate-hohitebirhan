import { authenticatedFetch } from "./api";

export type CertificateType = "BIRTH" | "DEATH" | "WEDDING";

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

// POST: Generate a certificate for a child
export const generateCertificate = async (
  childId: string,
  type: CertificateType
): Promise<BaseResponse> => {
  const params = new URLSearchParams({ childId, type });
  return await authenticatedFetch<BaseResponse>(`/api/certificates?${params.toString()}`, {
    method: "POST",
  });
};
