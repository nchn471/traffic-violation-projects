// app/api/v1/violations/[id]/route.ts
import { proxyRequest } from "@/lib/api/server/proxy"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyRequest(req, `/api/v1/violations/${params.id}`, { method: "GET" })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyRequest(req, `/api/v1/violations/${params.id}`, { method: "PATCH" })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyRequest(req, `/api/v1/violations/${params.id}`, { method: "DELETE" })
}
