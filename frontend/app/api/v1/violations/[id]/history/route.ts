// app/api/v1/violations/[id]/history/route.ts
import { proxyRequest } from "@/lib/api/server/proxy"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyRequest(req, `/api/v1/violations/${params.id}/history`, {
    method: "GET",
  })
}
