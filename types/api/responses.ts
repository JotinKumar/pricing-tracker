export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string>
}

export interface ActivityResponse extends ApiResponse<PricingActivityWithHistory> {
  activity?: PricingActivityWithHistory
}

export interface AdminDataResponse extends ApiResponse<unknown[]> {
  data: AdminDataItem[]
}

export type AdminDataType = 'User' | 'Team' | 'Vertical' | 'Horizontal' | 'Location' | 'Status' | 'Category' | 'Version' | 'Outcome' | 'DocumentType' | 'SalesforceStage' | 'Subvertical'

export interface AdminDataItem {
  id: number
  [key: string]: unknown
}

// Import from domain
import type { PricingActivityWithHistory } from '../domain/activity'
