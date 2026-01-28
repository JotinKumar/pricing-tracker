export interface FieldConfig {
  id?: number
  targetField?: string
  fieldName: string
  fieldType?: string
  hasPrefix?: boolean
  prefix?: string | null
  isActive?: boolean
  displayOnDashboard?: boolean
  updatedAt?: Date
}
