export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const isJson = body && typeof body === "object" && !(body instanceof FormData);

  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(headers || {}),
      ...(isJson ? { "Content-Type": "application/json" } : {}),
    },
    body: isJson ? JSON.stringify(body) : body,
  });

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      if (contentType.includes("application/json")) {
        const errorBody = await res.json();
        message = errorBody?.detail || errorBody?.message || message;
      } else {
        const text = await res.text();
        message = text || message;
      }
    } catch (_) {}

    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) {
    return null as unknown as T;
  }

  return contentType.includes("application/json")
    ? res.json()
    : (res.text() as unknown as T);
}
