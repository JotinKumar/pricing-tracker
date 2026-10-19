import prisma from '../lib/db'
import { getBulkUpstreamManagers } from '../lib/actions/user'

async function main() {
    const activities = await prisma.pricingActivity.findMany({
        include: {
            teamMembers: true,
            user: { select: { id: true, name: true } }
        }
    })

    console.log(`Processing ${activities.length} activities...`)
    let totalUpdated = 0

    for (const activity of activities) {
        // Get upstream managers of the owner AND all team members
        const allUserIds = [activity.userId, ...activity.teamMembers.map(tm => tm.userId)]
        const bulkManagers = await getBulkUpstreamManagers(allUserIds)
        const managerIdSet = new Set<number>()
        Object.values(bulkManagers).forEach(ids => ids.forEach(id => managerIdSet.add(id)))

        if (managerIdSet.size === 0) continue

        for (const tm of activity.teamMembers) {
            const shouldBeAuto = managerIdSet.has(tm.userId) && tm.userId !== activity.userId
            if (tm.isAutoAdded !== shouldBeAuto) {
                await prisma.activityTeamMember.update({
                    where: { id: tm.id },
                    data: { isAutoAdded: shouldBeAuto }
                })
                totalUpdated++
                console.log(`  Activity #${activity.id}: userId=${tm.userId} ${shouldBeAuto ? '→ AUTO' : '→ MANUAL'}`)
            }
        }
    }

    console.log(`\nDone. Updated ${totalUpdated} team member records.`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
