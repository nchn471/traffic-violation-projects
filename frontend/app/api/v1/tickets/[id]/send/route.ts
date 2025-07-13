import { type NextRequest } from "next/server";
import { proxyRequest } from "@/lib/api/server/proxy";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const path = `/api/v1/tickets/${params.id}/send`;
  return proxyRequest(req, path, { method: "POST" });
}
