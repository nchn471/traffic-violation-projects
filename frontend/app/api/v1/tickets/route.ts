import { type NextRequest } from "next/server";
import { proxyRequest } from "@/lib/api/server/proxy";

const API_PATH = "/api/v1/tickets";

export async function POST(req: NextRequest) {
  return proxyRequest(req, API_PATH, {
    method: "POST",
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const violationId = searchParams.get("violation_id");

  if (!violationId) {
    return Response.json({ detail: "Missing violation_id" }, { status: 400 });
  }

  const path = `${API_PATH}?violation_id=${encodeURIComponent(violationId)}`;
  return proxyRequest(req, path, {
    method: "GET",
  });
}
