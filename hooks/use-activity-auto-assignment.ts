import { useState, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { getApplicableDefaults } from '@/lib/actions/defaults'
import { ActivityFormValues } from '@/lib/schemas'

interface UseActivityAutoAssignmentProps {
    form: UseFormReturn<ActivityFormValues>
    verticalId: string | undefined
    horizontalId: string | undefined
    clientLocationIds: number[] | undefined
    deliveryLocationIds: number[] | undefined
}

export function useActivityAutoAssignment({
    form,
    verticalId,
    horizontalId,
    clientLocationIds,
    deliveryLocationIds
}: UseActivityAutoAssignmentProps) {
    const [lockedUserIds, setLockedUserIds] = useState<number[]>([])

    useEffect(() => {
        const fetchAndAssignDefaults = async () => {
            const clientIds = Array.isArray(clientLocationIds) ? clientLocationIds.map(String) : []
            const deliveryIds = Array.isArray(deliveryLocationIds) ? deliveryLocationIds.map(String) : []

            const res = await getApplicableDefaults({
                verticalId,
                horizontalId,
                clientLocationIds: clientIds,
                deliveryLocationIds: deliveryIds
            })

            if (res.success && res.data) {
                // Update locked IDs based on current selection
                const newLockedIds = res.data.map((u: any) => u.id)
                setLockedUserIds(newLockedIds)

                if (res.data.length > 0) {
                    const currentMembers = form.getValues('teamMembers') || []
                    const newMembers = [...currentMembers]
                    let changed = false

                    res.data.forEach((user: any) => {
                        // Check if user is already present (prevent duplicates)
                        const exists = newMembers.some(m => Number(m.userId) === Number(user.id))

                        if (!exists) {
                            // Find a valid team for this user to be assigned to
                            // Prioritize the user's first assigned team
                            const defaultTeamId = user.teams?.[0]?.id
                            if (defaultTeamId) {
                                newMembers.push({
                                    teamId: defaultTeamId,
                                    userId: user.id
                                })
                                changed = true
                            }
                        }
                    })

                    if (changed) {
                        form.setValue('teamMembers', newMembers)
                    }
                }
            } else {
                setLockedUserIds([])
            }
        }

        const timer = setTimeout(fetchAndAssignDefaults, 500)
        return () => clearTimeout(timer)
    }, [verticalId, horizontalId, JSON.stringify(clientLocationIds), JSON.stringify(deliveryLocationIds), form])

    return { lockedUserIds }
}
