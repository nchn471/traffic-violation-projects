import { Officer } from "@/lib/types/api/v1/officer";
import { apiFetch } from "@/lib/api/v1/fetch";
import { LoginResponse } from "@/lib/types/api/v1/auth";


export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    return await apiFetch<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch (err: any) {
    if (err.status === 401) {
      throw new Error("Username or password is incorrect");
    }
    console.error("Login error:", err);
    throw new Error(err.message || "Login failed");
  }
}

export async function getCurrentOfficer(): Promise<Officer | null> {
  try {
    return await apiFetch<Officer>("/api/v1/auth/me", {
      credentials: "include",
    });
  } catch (err: any) {
    if (err.status === 401) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) return null;

      try {
        return await apiFetch<Officer>("/api/v1/auth/me", {
          credentials: "include",
        });
      } catch (e) {
        console.error("Retry after refresh failed:", e);
        return null;
      }
    }

    console.error("Error getting current officer:", err);
    return null;
  }
}


export async function refreshAccessToken(): Promise<LoginResponse | null> {
  try {
    return await apiFetch<LoginResponse>("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    return null;
  }
}


export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/api/v1/auth/logout", {
      method: "POST",
    });
  } catch (err) {
    console.error("Logout error:", err);
  }
}
