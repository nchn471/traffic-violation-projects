import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.BACKEND_API_URL

export async function GET(_: NextRequest, { params }: { params: { camera_id: string } }) {
  const token = cookies().get("access_token")?.value
  if (!token) return NextResponse.json({ detail: "Access token required" }, { status: 401 })

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/cameras/${params.camera_id}/videos`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("Get camera videos error:", err)
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 })
  }
}
