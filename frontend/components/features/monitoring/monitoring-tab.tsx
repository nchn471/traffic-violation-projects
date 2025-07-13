"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Badge } from "@/components/shared/ui/badge"
import { Button } from "@/components/shared/ui/button"
import { LucideCamera, MapPin, RefreshCw, Video } from "lucide-react"
import { useToast } from "@/components/shared/hooks/use-toast"

interface Camera {
  id: string
  name: string
  location: string
  folder_path: string
  created_at: string
  updated_at: string
}

export function MonitoringTab() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchCameras = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("/api/v1/cameras/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCameras(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch cameras",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching cameras",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCameras()
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    fetchCameras()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Camera Monitoring</h2>
          <p className="text-muted-foreground">Real-time monitoring of traffic cameras</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <Card key={camera.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <LucideCamera className="h-5 w-5" />
                  <span>{camera.name}</span>
                </CardTitle>
                <Badge variant="secondary">Active</Badge>
              </div>
              <CardDescription className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{camera.location}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Path: {camera.folder_path}</p>
                  <p>Last updated: {new Date(camera.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cameras.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LucideCamera className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cameras found</h3>
            <p className="text-muted-foreground text-center">No cameras are currently configured for monitoring.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
