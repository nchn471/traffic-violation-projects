"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/ui/card"
import { Label } from "@/components/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select"
import { AlertTriangle } from "lucide-react"

interface ViolationTypeSelectorProps {
  selectedType: string
  onTypeChange: (type: string) => void
  disabled?: boolean
}

const VIOLATION_TYPES = [
  { value: "red_light", label: "Red Light" },
  { value: "no_helmet", label: "No Helmet" },
  { value: "wrong_lane", label: "Wrong Lane" },
  { value: "all", label: "All Violation Available"},
]

export function ViolationTypeSelector({ selectedType, onTypeChange, disabled }: ViolationTypeSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5" />
          Violation Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="violation-select">Detection Type</Label>
          <Select value={selectedType} onValueChange={onTypeChange} disabled={disabled}>
            <SelectTrigger id="violation-select">
              <SelectValue placeholder="Choose violation type" />
            </SelectTrigger>
            <SelectContent>
              {VIOLATION_TYPES.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
