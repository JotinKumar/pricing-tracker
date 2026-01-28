export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string>
}

export interface ActivityResponse extends ApiResponse<PricingActivity> {
  activity?: PricingActivity
}

export interface AdminDataResponse extends ApiResponse<unknown[]> {
  data: AdminDataItem[]
}

export type AdminDataType = 'User' | 'Team' | 'Vertical' | 'Horizontal' | 'Location' | 'Status' | 'Category' | 'Version' | 'Outcome' | 'DocumentType'

export interface AdminDataItem {
  id: number
  [key: string]: unknown
}

// Import from domain
import type { PricingActivity } from '../domain/activity'
