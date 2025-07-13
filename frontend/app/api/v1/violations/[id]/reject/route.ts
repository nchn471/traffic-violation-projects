// app/api/v1/violations/[id]/reject/route.ts
import { proxyRequest } from "@/lib/api/server/proxy";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyRequest(req, `/api/v1/violations/${params.id}/reject`, {
    method: "PATCH",
  });
}