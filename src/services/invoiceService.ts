

// import { authenticatedFetch } from "./api";

// export interface Invoice {
//   id: number;
//   shipmentId: number;
//   pricingId: number;
//   amountMinor: number;
//   subtotalMinor: number;
//   fuelSurchargeMinor: number;
//   vatMinor: number;
//   withholdingMinor: number;
//   distanceKm: number;
//   hours: number;
//   currency: string;
//   status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "CANCELLED";
//   dueDate: string;
//   issuedAt: string;
//   paidAt: string | null;
//   createdAt: string;
//   containerType:string
// }

// export interface InvoicePageResponse {
//   content: Invoice[];
//   pageNumber: number;
//   pageSize: number;
//   totalElements: number;
//   totalPages: number;
//   first: boolean;
//   last: boolean;
// }

// export interface CreateInvoicePayload {
//   shipmentId: number;
//   pricingId: number;
//   ton: number;
//   fuelSurchargeMinor: number; // in minor units (e.g., cents/birr minor)
//   currency: string;
//   dueDate: string; // YYYY-MM-DD
//   containerCount: number;
//   containerType: "FT20" | "FT40";
// }

// export interface UpdateInvoicePayload {
//   status?: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "CANCELLED";
//   dueDate?: string;
// }

// export const fetchInvoices = async (
//   page = 0,
//   size = 20
// ): Promise<InvoicePageResponse> => {
//   const data = await authenticatedFetch<InvoicePageResponse>(
//     `/invoices?page=${page}&size=${size}`
//   );
//   return data;
// };

// export const createInvoice = async (
//   payload: CreateInvoicePayload
// ): Promise<Invoice> => {
//   return await authenticatedFetch<Invoice>("/invoices", {
//     method: "POST",
//     body: JSON.stringify(payload),
//   });
// };

// export const updateInvoice = async (
//   id: number,
//   payload: UpdateInvoicePayload
// ): Promise<Invoice> => {
//   return await authenticatedFetch<Invoice>(`/invoices/${id}`, {
//     method: "PATCH",
//     body: JSON.stringify(payload),
//   });
// };

import { authenticatedFetch } from "./api";

export interface Invoice {
  id: number;
  shipmentId: number;
  pricingId: number;
  amountMinor: number;
  subtotalMinor: number;
  fuelSurchargeMinor: number;
  vatMinor: number;
  withholdingMinor: number;
  distanceKm: number;
  hours: number;
  currency: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "CANCELLED";
  dueDate: string;
  issuedAt: string;
  paidAt: string | null;
  createdAt: string;
  containerType: string;
  ton: number;
  containerCount: number;
}

export interface InvoicePageResponse {
  content: Invoice[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface CreateInvoicePayload {
  shipmentId: number;
  pricingId: number;
  ton: number;
  fuelSurchargeMinor: number;
  currency: string;
  dueDate: string;
  containerCount: number;
  containerType: "FT20" | "FT40";
}

export interface UpdateInvoicePayload {
  status?: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "CANCELLED";
  dueDate?: string;
}

export const fetchInvoices = async (
  page = 0,
  size = 20
): Promise<InvoicePageResponse> => {
  const data = await authenticatedFetch<InvoicePageResponse>(
    `/invoices?page=${page}&size=${size}`
  );
  return data;
};

export const createInvoice = async (
  payload: CreateInvoicePayload
): Promise<Invoice> => {
  return await authenticatedFetch<Invoice>("/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateInvoice = async (
  id: number,
  payload: UpdateInvoicePayload
): Promise<Invoice> => {
  return await authenticatedFetch<Invoice>(`/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const getInvoiceById = async (id: number): Promise<Invoice> => {
  return await authenticatedFetch<Invoice>(`/invoices/${id}`);
};