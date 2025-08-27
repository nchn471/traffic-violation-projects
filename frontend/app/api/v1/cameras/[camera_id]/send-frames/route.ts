import { NextRequest } from "next/server"
import { proxyRequest } from "@/lib/api/server/proxy"

export async function POST(req: NextRequest, { params }: { params: { camera_id: string } }) {
    const query = req.nextUrl.searchParams.toString();
    return proxyRequest(
      req,
      `/api/v1/cameras/${params.camera_id}/send-frames${query ? `?${query}` : ""}`,
      { method: "POST" }
    );
  }