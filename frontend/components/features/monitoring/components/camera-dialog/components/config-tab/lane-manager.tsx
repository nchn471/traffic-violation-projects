"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import { Label } from "@/components/shared/ui/label"
import { Badge } from "@/components/shared/ui/badge"
import { Plus, Trash2, Route, Tag, Edit3 } from "lucide-react"
import type { Lane } from "@/lib/types/api/v1/camera"

interface LaneManagerProps {
  lanes: Lane[]
  onChange: (lanes: Lane[]) => void
  disabled?: boolean
}

export function LaneManager({ lanes, onChange, disabled }: LaneManagerProps) {
  const [editingLane, setEditingLane] = useState<number | null>(null)
  const [tempLabels, setTempLabels] = useState<string>("")

  const addLane = () => {
    const newId = Math.max(0, ...lanes.map((l) => l.id)) + 1
    const newLane: Lane = { id: newId, polygon: [], allow_labels: [] }
    onChange([...lanes, newLane])
  }

  const removeLane = (laneId: number) => {
    onChange(lanes.filter((lane) => lane.id !== laneId))
  }

  const updateLaneLabels = (laneId: number, labels: string[]) => {
    onChange(
      lanes.map((lane) =>
        lane.id === laneId ? { ...lane, allow_labels: labels } : lane
      )
    )
  }

  const startEditingLabels = (lane: Lane) => {
    setEditingLane(lane.id)
    setTempLabels(lane.allow_labels.join(", "))
  }

  const saveLabels = (laneId: number) => {
    const labels = tempLabels
      .split(",")
      .map((label) => label.trim())
      .filter((label) => label.length > 0)

    updateLaneLabels(laneId, labels)
    setEditingLane(null)
    setTempLabels("")
  }

  const cancelEditing = () => {
    setEditingLane(null)
    setTempLabels("")
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="h-5 w-5" />
            Lane Management
          </CardTitle>
          <Button size="sm" onClick={addLane} disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lane
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lanes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No lanes configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lanes.map((lane) => (
              <Card key={lane.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Lane {lane.id}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {lane.polygon.length} points
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLane(lane.id)}
                      disabled={disabled}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4" />
                        <Label className="text-sm">Allowed Labels</Label>
                        {editingLane !== lane.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingLabels(lane)}
                            disabled={disabled}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {editingLane === lane.id ? (
                        <div className="space-y-2">
                          <Input
                            value={tempLabels}
                            onChange={(e) => setTempLabels(e.target.value)}
                            placeholder="helmet, red_light, vehicle"
                            disabled={disabled}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveLabels(lane.id)} disabled={disabled}>
                              Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={cancelEditing} disabled={disabled}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {lane.allow_labels.length > 0 ? (
                            lane.allow_labels.map((label, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {label}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              No labels configured
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
