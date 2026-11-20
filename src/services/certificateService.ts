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

// ---- Manual certificate (Swagger: POST /api/certificates/manual -> ManualCertificateRequestDTO) ----
export interface ManualCertificatePayload {
  type: CertificateType; // required
  firstName: string; // required
  middleName?: string;
  lastName: string; // required
  firstNameEn?: string;
  middleNameEn?: string;
  lastNameEn?: string;
  gender: "MALE" | "FEMALE"; // required
  dateOfBirth: string; // required (yyyy-MM-dd)
  phoneNumber?: string;
  christianName?: string;
  namePrefixLabel?: string;
  motherName?: string;
  placeOfBirth?: string;
  nationality?: string;
  fatherFullName: string; // required
  godParentName?: string;
  country?: string;
  citizenship?: string;
  originChurchName: string; // required
  originChurchAddress?: string;
  officiatingPriestName?: string;
  officiatingPriestRank?: string;
  eventDate: string; // required (yyyy-MM-dd)
  receiptNumber?: string;
  feeNote?: string;
  notes?: string;
  confirmDuplicate?: boolean;
}

// POST: Manually generate a certificate (for records not stored as a child in the system)
export const generateManualCertificate = async (
  payload: ManualCertificatePayload
): Promise<BaseResponse> => {
  // Drop empty optional strings so the backend does not store "" values
  const body: Record<string, any> = {};
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== "" && v !== undefined && v !== null) body[k] = v;
  });
  return await authenticatedFetch<BaseResponse>(`/api/certificates/manual`, {
    method: "POST",
    body: JSON.stringify(body),
  });
};
