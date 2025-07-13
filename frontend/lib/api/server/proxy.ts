import { type NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_API_URL!;

export async function proxyRequest(
  req: NextRequest,
  path: string,
  options?: RequestInit
): Promise<NextResponse> {
  const accessToken = req.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { detail: "Access token required" },
      { status: 401 }
    );
  }

  const url = `${API_BASE_URL}${path}`;
  const method = options?.method || req.method;
  const headers: HeadersInit = {
    ...options?.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  let body = options?.body;

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
        body = req.body; // Let fetch handle FormData
      }
    } catch (err) {
      console.warn("Failed to parse request body:", err);
    }
  } else if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
  });

  // ✅ Nếu response là lỗi thì trả lỗi luôn về FE (bao gồm cả 500, 400,...)
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    let errorBody = {};

    try {
      if (contentType.includes("application/json")) {
        errorBody = await res.json();
      } else {
        const text = await res.text();
        errorBody = { detail: text };
      }
    } catch (_) {
      errorBody = { detail: `Request failed with status ${res.status}` };
    }

    return NextResponse.json(errorBody, { status: res.status });
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  return new NextResponse(res.body, {
    status: res.status,
    headers: {
      "Content-Type": contentType,
      ...Object.fromEntries(res.headers.entries()),
      ...options?.headers,
    },
  });
}
