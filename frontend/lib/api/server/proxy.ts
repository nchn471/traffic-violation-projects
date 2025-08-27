import { type NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_API_URL!;

export async function proxyRequest(
  req: NextRequest,
  path: string,
  options?: RequestInit
): Promise<NextResponse> {
  const accessToken = req.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ detail: "Access token required" }, { status: 401 });
  }

  const url = `${API_BASE_URL}${path}`;
  const method = options?.method || req.method;
  const headers: HeadersInit = {
    ...options?.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  let body = options?.body;

  // Auto handle request body if not provided
  if (!body && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    try {
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const json = await req.json();
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(json);
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        headers["Content-Type"] = contentType;
        body = text;
      } else if (contentType.includes("multipart/form-data")) {
        body = req.body; // streaming form-data
      }
    } catch (err) {
      console.warn("Failed to parse request body:", err);
    }
  } else if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(url, { method, headers, body });

  const responseContentType = res.headers.get("content-type") || "";

  // Handle errors and pass proper response to client
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let errorBody: any = null;

    try {
      if (responseContentType.includes("application/json")) {
        errorBody = await res.json();
        message = errorBody?.detail || errorBody?.message || message;
      } else {
        const text = await res.text();
        message = text || message;
        errorBody = { detail: message };
      }
    } catch {
      errorBody = { detail: message };
    }

    return NextResponse.json(errorBody, { status: res.status });
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  // Handle successful response
  if (responseContentType.includes("application/json")) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  // For binary/stream/text fallback
  return new NextResponse(res.body, {
    status: res.status,
    headers: {
      "Content-Type": responseContentType,
      ...Object.fromEntries(res.headers.entries()),
    },
  });
}
