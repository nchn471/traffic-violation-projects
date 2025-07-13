import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/api/server/proxy";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyRequest(req, `/api/v1/officers/${params.id}`);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  return proxyRequest(req, `/api/v1/officers/${params.id}`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyRequest(req, `/api/v1/officers/${params.id}`, {
    method: "DELETE",
  });
}
