import { authenticatedFetch } from "./api";

export type CertificateType = "BAPTISM" | "BIRTH" | "DEATH" | "WEDDING";

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

export interface CertificateScanLog {
  id?: string;
  certificateType?: string;
  registrationNo?: string;
  scannedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

// POST: Generate a certificate for a child
export const generateCertificate = async (
  childId: string,
  type: CertificateType
): Promise<BaseResponse> => {
  const params = new URLSearchParams({ childId, type });
  return await authenticatedFetch<BaseResponse>(`/api/certificates/generate?${params.toString()}`, {
    method: "POST",
  });
};

// POST: Record that a certificate was printed for a child
export const recordCertificatePrint = async (
  childId: string,
  reason?: string,
  printedBy?: string
): Promise<BaseResponse> => {
  const params = new URLSearchParams();
  if (reason) params.set("reason", reason);
  if (printedBy) params.set("printedBy", printedBy);
  const qs = params.toString();
  return await authenticatedFetch<BaseResponse>(
    `/api/certificates/child/${childId}/print${qs ? `?${qs}` : ""}`,
    { method: "POST" }
  );
};

// GET: Certificate scan history (verification scans) by registration number
export const fetchCertificateScanHistory = async (
  registrationNo: string
): Promise<CertificateScanLog[]> => {
  const response = await authenticatedFetch<any>(`/api/certificates/${registrationNo}/scan-history`);
  return Array.isArray(response) ? response : [];
};

// GET: Certificate by child id
export const fetchCertificateByChildId = async (childId: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/certificates/child/${childId}`);
};

// GET: Print history for a child's certificate
export const fetchCertificatePrintHistory = async (childId: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/certificates/child/${childId}/print-history`);
};

// GET: Check whether a child is eligible for certificate issuance
export const checkCertificateEligibility = async (childId: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/v1/children/${childId}/certificate-eligibility`);
};
