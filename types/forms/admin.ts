import * as z from "zod"
import { adminUserSchema, adminLookupSchema } from '@/lib/schemas'

export type AdminUserFormValues = z.infer<typeof adminUserSchema>
export type AdminLookupFormValues = z.infer<typeof adminLookupSchema>

export interface AdminModalProps {
  editItem: AdminUserFormValues | AdminLookupFormValues | null
  activeTab: string
  fields: { key: string; label: string }
  handleSave: (data: AdminUserFormValues | AdminLookupFormValues) => Promise<ApiResponse>
  onClose: () => void
  data: (AdminUserFormValues | AdminLookupFormValues)[]
  availableTeams?: Team[]
  defaultCurrency?: string
}

// Import from domain and api
import type { Team } from '../domain/user'
import type { ApiResponse } from '../api/responses'
