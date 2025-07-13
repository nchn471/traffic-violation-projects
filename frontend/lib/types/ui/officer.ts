import type { Officer } from "@/lib/types/api/v1/officer"

export interface OfficerUI extends Officer {
  avatar?: string
}
