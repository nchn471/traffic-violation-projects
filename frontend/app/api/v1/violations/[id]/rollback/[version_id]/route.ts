// app/api/v1/violations/[id]/rollback/[version_id]/route.ts
import { proxyRequest } from "@/lib/api/server/proxy"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest, { params }: { params: { id: string; version_id: string } }) {
  return proxyRequest(req, `/api/v1/violations/${params.id}/rollback/${params.version_id}`, {
    method: "POST",
  })
}
