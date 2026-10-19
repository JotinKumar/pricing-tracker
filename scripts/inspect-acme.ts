import prisma from '../lib/db'

async function main() {
    const activities = await prisma.pricingActivity.findMany({
        where: { projectName: { contains: 'Project 46' } },
        include: {
            user: { include: { manager: true, teams: true } },
            teamMembers: { include: { team: true, user: { include: { manager: true } } } },
            vertical: true,
            horizontal: true,
            clientLocations: true,
            deliveryLocations: true,
        }
    })

    for (const a of activities) {
        console.log('='.repeat(70))
        console.log(`Activity #${a.id}: ${a.clientName} / ${a.projectName}`)
        console.log(`Owner: ${a.user?.name} (id=${a.userId}), manager: ${a.user?.manager?.name ?? 'none'}`)
        console.log(`Vertical=${a.vertical?.vertical} Horizontal=${a.horizontal?.horizontal}`)
        console.log(`Team members (${a.teamMembers.length}):`)
        for (const tm of a.teamMembers) {
            console.log(`  - ${tm.user?.name} | team=${tm.team?.teamname} | isAutoAdded=${tm.isAutoAdded} | userManager=${tm.user?.manager?.name ?? 'none'}`)
        }
    }

    console.log('\n\n=== ALL TEAMS ===')
    const teams = await prisma.team.findMany()
    teams.forEach(t => console.log(`  id=${t.id} ${t.teamname} (${t.display})`))

    console.log('\n=== DEFAULT ASSIGNMENTS (count) ===')
    const da = await prisma.defaultAssignment.count()
    console.log(`  total default assignments: ${da}`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
