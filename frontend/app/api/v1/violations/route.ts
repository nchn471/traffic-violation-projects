import { proxyRequest } from "@/lib/api/server/proxy";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.toString();
  return proxyRequest(req, `/api/v1/violations${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}
