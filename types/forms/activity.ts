import * as z from "zod"
import { activitySchema } from '@/lib/schemas'

export type ActivityFormValues = z.infer<typeof activitySchema>

export interface ActivityTeamMemberInput {
  teamId: number
  userId: number
}

export interface ActivityFormState {
  loading: boolean
  error: string
  clientNames: string[]
  initialVersionId: string
  showVersionConfirm: boolean
  pendingData: ActivityFormValues | null
  localComments: Comment[]
  deleteCommentId: number | null
}

// Import from domain for Comment type
import type { Comment } from '../domain/activity'
