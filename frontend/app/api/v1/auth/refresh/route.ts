// app/api/v1/auth/refresh/route.ts
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const API_BASE_URL = process.env.BACKEND_API_URL

export async function POST() {
  const refreshToken = cookies().get("refresh_token")?.value

  if (!refreshToken) {
    return NextResponse.json({ detail: "No refresh token" }, { status: 401 })
  }

  try {
    const backendRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    const data = await backendRes.json()

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status })
    }

    const res = NextResponse.json({
      message: "Token refreshed successfully",
      token_type: data.token_type,
      access_token_expires_in: data.access_token_expires_in,
      refresh_token_expires_in: data.refresh_token_expires_in,
    })

    res.cookies.set("access_token", data.access_token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: data.access_token_expires_in,
    })

    res.cookies.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: data.refresh_token_expires_in,
    })

    return res
  } catch (error) {
    console.error("Refresh token error:", error)
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 })
  }
}
