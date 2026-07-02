import { authenticatedFetch } from "./api";

export interface CreateFatherTransferPayload {
  childId: string;
  newFatherId: string;
  reason: string;
}

export interface BaseResponse<T = any> {
  message?: string;
  success?: boolean;
  data?: T;
}

// POST: Create a father-transfer record
export const createFatherTransfer = async (
  payload: CreateFatherTransferPayload
): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>("/api/father-transfers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// GET: Get a transfer record by id
export const fetchFatherTransferById = async (id: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/father-transfers/${id}`);
};

// GET: Get transfer history for a child
export const fetchFatherTransfersByChild = async (childId: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/father-transfers/child/${childId}`);
};

// DELETE: Delete a transfer record
export const deleteFatherTransfer = async (id: string): Promise<BaseResponse> => {
  return await authenticatedFetch<BaseResponse>(`/api/father-transfers/${id}`, {
    method: "DELETE",
  });
};
