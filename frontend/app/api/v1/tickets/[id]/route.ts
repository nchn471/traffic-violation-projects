import { type NextRequest } from "next/server";
import { proxyRequest } from "@/lib/api/server/proxy";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const path = `/api/v1/tickets/${params.id}`;
  return proxyRequest(req, path, { method: "GET" });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const path = `/api/v1/tickets/${params.id}`;
  return proxyRequest(req, path, { method: "PATCH" });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const path = `/api/v1/tickets/${params.id}`;
  return proxyRequest(req, path, { method: "DELETE" });
}
