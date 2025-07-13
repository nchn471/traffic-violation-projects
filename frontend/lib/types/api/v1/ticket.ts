import { Officer } from "./officer"

export interface Ticket {
  id: string
  violation_id: string
  officer_id: string
  amount: number
  name: string | null
  email: string | null
  notes: string | null
  status: string | null
  issued_at: string
  officer?: Officer
}

export interface TicketCreate {
    amount: number
    name?: string
    email: string | null
    notes?: string | null
    violation_id: string 
    status?: string | null
}
  
export interface TicketUpdate {
    amount?: number | null
    name?: string | null
    email?: string | null
    notes?: string | null
}
  
export interface TicketHistory extends Ticket {
    ticket_id: string
    updated_at: string
    change_type: string
    source_id?: string
}
export type TicketsHistory = TicketHistory[]