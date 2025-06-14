"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import apiClient from "@/lib/api"

export function ApiStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [error, setError] = useState<string>("")
  const [apiUrl, setApiUrl] = useState<string>("")

  const checkConnection = async () => {
    setStatus("checking")
    setError("")

    // Get the API URL being used
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")

    try {
      const response = await apiClient.ping()

      if (response.error) {
        setStatus("error")
        setError(response.error)
      } else {
        setStatus("connected")
      }
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="mb-4">
      <Alert variant={status === "error" ? "destructive" : "default"}>
        <div className="flex items-center gap-2">
          {status === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "connected" && <CheckCircle className="h-4 w-4 text-green-500" />}
          {status === "error" && <XCircle className="h-4 w-4 text-red-500" />}

          <div className="flex-1">
            <AlertDescription>
              <div className="font-medium">
                API Status:{" "}
                {status === "checking"
                  ? "Đang kiểm tra..."
                  : status === "connected"
                    ? "Kết nối thành công"
                    : "Lỗi kết nối"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">API URL: {apiUrl}</div>
              {error && <div className="text-sm text-red-600 mt-1">Lỗi: {error}</div>}
            </AlertDescription>
          </div>

          <Button variant="outline" size="sm" onClick={checkConnection} disabled={status === "checking"}>
            Thử lại
          </Button>
        </div>
      </Alert>
    </div>
  )
}
