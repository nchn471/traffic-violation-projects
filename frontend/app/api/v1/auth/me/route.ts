// app/api/v1/auth/me/route.ts
import { proxyRequest } from "@/lib/api/server/proxy";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return proxyRequest(req, "/api/v1/auth/me");
}