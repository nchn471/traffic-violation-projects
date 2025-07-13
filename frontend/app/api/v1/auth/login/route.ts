import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.BACKEND_API_URL

export async function POST(request: NextRequest) {
  try {

    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    const res = NextResponse.json({
      message: "Login successful",
      token_type: data.token_type,
      access_token_expires_in: data.access_token_expires_in,
      refresh_token_expires_in: data.refresh_token_expires_in,
    })

    res.cookies.set("access_token", data.access_token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      // secure: true, // bật khi deploy HTTPS
      maxAge: data.access_token_expires_in,
    })

    res.cookies.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      // secure: true,
      maxAge: data.refresh_token_expires_in,
    })

    return res
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 })
  }
}
