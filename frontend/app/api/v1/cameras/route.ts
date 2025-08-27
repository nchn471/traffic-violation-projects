import { NextRequest } from "next/server"
import { proxyRequest } from "@/lib/api/server/proxy"

export async function GET(req: NextRequest) {
  return proxyRequest(req, `/api/v1/cameras/`)
}
