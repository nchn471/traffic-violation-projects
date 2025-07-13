import { type NextRequest } from "next/server";
import { proxyRequest } from "@/lib/api/server/proxy";

export async function POST(req: NextRequest, { params }: { params: { id: string; version_id: string } }) {
  const path = `/api/v1/tickets/${params.id}/rollback/${params.version_id}`;
  return proxyRequest(req, path, { method: "POST" });
}
