import { authenticatedFetch } from "./api";
import { BaseResponse, qs, unwrapList } from "./serviceHelpers";

export type SmsRecipientType = "CHILD" | "FAMILY_HEAD" | "CLERGY";

export interface SmsTemplate {
  id?: string;
  code: string;
  content: string;
  description?: string;
}

export interface SmsBulkListPayload {
  recipients: { recipientId: string; recipientType: SmsRecipientType }[];
  templateCode?: string;
  rawMessage?: string;
  placeholders?: Record<string, string>;
}

// GET /api/v1/sms/templates
export const fetchSmsTemplates = async (): Promise<SmsTemplate[]> =>
  unwrapList<SmsTemplate>(await authenticatedFetch<any>("/api/v1/sms/templates"));

// POST /api/v1/sms/templates
export const saveSmsTemplate = async (payload: SmsTemplate): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>("/api/v1/sms/templates", { method: "POST", body: JSON.stringify(payload) });

// POST /api/v1/sms/raw?phone=&message=
export const sendRawSms = async (phone: string, message: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/sms/raw${qs({ phone, message })}`, { method: "POST" });

// POST /api/v1/sms/father/{fatherId}?templateCode=   body = placeholders
export const sendSmsToFather = async (
  fatherId: string,
  templateCode: string,
  placeholders: Record<string, string> = {}
): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/sms/father/${fatherId}${qs({ templateCode })}`, {
    method: "POST",
    body: JSON.stringify(placeholders),
  });

// POST /api/v1/sms/child/{childId}?templateCode=   body = placeholders
export const sendSmsToChild = async (
  childId: string,
  templateCode: string,
  placeholders: Record<string, string> = {}
): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/sms/child/${childId}${qs({ templateCode })}`, {
    method: "POST",
    body: JSON.stringify(placeholders),
  });

// POST /api/v1/sms/bulk/welcome?churchId=
export const sendBulkWelcomeSms = async (churchId: string): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>(`/api/v1/sms/bulk/welcome${qs({ churchId })}`, { method: "POST" });

// POST /api/v1/sms/bulk/list
export const sendBulkSmsToList = async (payload: SmsBulkListPayload): Promise<BaseResponse> =>
  authenticatedFetch<BaseResponse>("/api/v1/sms/bulk/list", { method: "POST", body: JSON.stringify(payload) });
