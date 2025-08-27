import { NextRequest } from "next/server"
import { proxyRequest } from "@/lib/api/server/proxy"

export async function GET(req: NextRequest, { params }: { params: { camera_id: string } }) {
  return proxyRequest(req, `/api/v1/cameras/${params.camera_id}/videos`)
}
