import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.BACKEND_API_URL

export async function GET() {
  const accessToken = cookies().get("access_token")?.value

  if (!accessToken) {
    return NextResponse.json({ detail: "Access token required" }, { status: 401 })
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/stats/overview`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Get stats overview API error:", error)
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 })
  }
}
