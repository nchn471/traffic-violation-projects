import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.BACKEND_API_URL

export async function GET() {
  const token = cookies().get("access_token")?.value
  if (!token) return NextResponse.json({ detail: "Access token required" }, { status: 401 })

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/cameras/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("Get cameras error:", err)
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = cookies().get("access_token")?.value
  if (!token) return NextResponse.json({ detail: "Access token required" }, { status: 401 })

  try {
    const body = await request.json()

    const res = await fetch(`${API_BASE_URL}/api/v1/cameras/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("Create camera error:", err)
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 })
  }
}
