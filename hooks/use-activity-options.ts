import { useState, useEffect } from 'react'

import { getUniqueClients } from '@/lib/actions/activity'

export function useActivityOptions() {
    const [clientNames, setClientNames] = useState<string[]>([])

    useEffect(() => {
        getUniqueClients().then(res => {
            if (res.success && res.data) {
                setClientNames(res.data)
            }
        })
    }, [])

    return { clientNames }
}
