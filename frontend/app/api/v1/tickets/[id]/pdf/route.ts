import { type NextRequest } from "next/server";
import { proxyRequest } from "@/lib/api/server/proxy";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyRequest(req, `/api/v1/tickets/${params.id}/pdf`, {
    method: "GET",
    headers: {
      "Content-Disposition": `inline; filename="ticket_${params.id}.pdf"`,
    },
  });
}
