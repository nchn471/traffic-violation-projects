import {
  Officer,
  OfficerCreate,
  OfficerUpdate,
} from "@/lib/types/api/v1/officer";
import { apiFetch } from "@/lib/api/v1/fetch";

export function getOfficer(officerId: string): Promise<Officer> {
  return apiFetch<Officer>(`/api/v1/officers/${officerId}`, {
    credentials: "include",
  });
}

export function createOfficer(data: OfficerCreate): Promise<Officer> {
  return apiFetch<Officer>(`/api/v1/officers`, {
    method: "POST",
    credentials: "include",
    body: data,
  });
}

export function updateOfficer(
  officerId: string,
  data: OfficerUpdate
): Promise<Officer> {
  return apiFetch<Officer>(`/api/v1/officers/${officerId}`, {
    method: "PATCH",
    credentials: "include",
    body: data,
  });
}

export function deleteOfficer(officerId: string): Promise<void> {
  return apiFetch(`/api/v1/officers/${officerId}`, {
    method: "DELETE",
    credentials: "include",
  });
}

export function listOfficers(): Promise<Officer[]> {
  return apiFetch<Officer[]>(`/api/v1/officers`, {
    credentials: "include",
  });
}
