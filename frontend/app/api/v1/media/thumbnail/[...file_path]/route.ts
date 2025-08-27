// /app/api/proxy/media/[...file_path]/route.ts
import { proxyRequest } from "@/lib/api/server/proxy"
import { type NextRequest } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { file_path: string[] } }) {
  const path = `/api/v1/media/thumbnail/${encodeURIComponent(params.file_path.join("/"))}`
  return proxyRequest(req, path)
}
