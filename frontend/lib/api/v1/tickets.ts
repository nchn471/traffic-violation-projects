import {
  Ticket,
  TicketCreate,
  TicketUpdate,
  TicketHistory,
} from "@/lib/types/api/v1/ticket";

import { apiFetch } from "./fetch";

const BASE_API_URL = "/api/v1/tickets";

export async function createTicket(data: TicketCreate): Promise<Ticket> {
  return apiFetch(`${BASE_API_URL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getTicket(ticketId: string): Promise<Ticket> {
  return apiFetch(`${BASE_API_URL}/${ticketId}`);
}

export async function updateTicket(
  ticketId: string,
  data: TicketUpdate
): Promise<Ticket> {
  return apiFetch(`${BASE_API_URL}/${ticketId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function archiveTicket(ticketId: string): Promise<Ticket> {
  return apiFetch(`${BASE_API_URL}/${ticketId}`, {
    method: "DELETE",
  });
}

export async function rollbackTicket(
  ticketId: string,
  versionId: string
): Promise<Ticket> {
  return apiFetch(`${BASE_API_URL}/${ticketId}/rollback/${versionId}`, {
    method: "POST",
  });
}

export async function markTicketPaid(ticketId: string): Promise<Ticket> {
  return apiFetch(`${BASE_API_URL}/${ticketId}/mark-paid`, {
    method: "POST",
  });
}

export async function getTicketPdf(ticketId: string): Promise<Blob> {
  const res = await fetch(`${BASE_API_URL}/${ticketId}/pdf`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({
      detail: "Failed to fetch ticket PDF",
    }));
    throw new Error(error.detail || "Failed to fetch ticket PDF");
  }
  return res.blob();
}

export async function sendTicketEmail(ticketId: string): Promise<Ticket> {
  return apiFetch(`${BASE_API_URL}/${ticketId}/send`, {
    method: "POST",
  });
}

export async function getTicketHistory(
  ticketId: string
): Promise<TicketHistory[]> {
  return apiFetch(`${BASE_API_URL}/${ticketId}/history`);
}

export async function getTicketByViolationId(
  violationId: string
): Promise<Ticket> {
  return apiFetch(`${BASE_API_URL}?violation_id=${violationId}`);
}
