// app/api/v1/officers/route.ts
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/api/server/proxy";

export async function GET(req: NextRequest) {
  return proxyRequest(req, "/api/v1/officers");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyRequest(req, "/api/v1/officers", {
    method: "POST",
    body,
  });
}
