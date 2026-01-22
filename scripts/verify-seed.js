
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Verification Report ---');

    // Count Users
    const totalUsers = await prisma.user.count();
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    const managers = await prisma.user.count({ where: { role: 'MANAGER' } });
    const users = await prisma.user.count({ where: { role: 'USER' } });
    const readOnly = await prisma.user.count({ where: { role: 'READ_ONLY' } });

    console.log(`Total Users: ${totalUsers}`);
    console.log(`- Admins: ${admins}`);
    console.log(`- Managers: ${managers}`);
    console.log(`- Base Users: ${users}`);
    console.log(`- Read Only: ${readOnly}`);

    // Check specific teams
    const pricingTeam = await prisma.user.count({ where: { teams: { some: { teamname: 'Pricing' } } } });
    const salesTeam = await prisma.user.count({ where: { teams: { some: { teamname: 'Sales' } } } });
    const solutionsTeam = await prisma.user.count({ where: { teams: { some: { teamname: 'Solutions' } } } });

    console.log(`\n--- Team Breakdown ---`);
    console.log(`Pricing Team Members: ${pricingTeam}`);
    console.log(`Sales Team Members: ${salesTeam}`);
    console.log(`Solutions Team Members: ${solutionsTeam}`);

    // Check hierarchy
    const managersWithReports = await prisma.user.findMany({
        where: { role: 'MANAGER' },
        include: { _count: { select: { reports: true } } }
    });
    console.log(`\n--- Manager Reports ---`);
    managersWithReports.forEach(m => {
        if (m._count.reports > 0) {
            console.log(`${m.name} has ${m._count.reports} direct reports.`);
        }
    });

    // Count Activities
    const activityCount = await prisma.pricingActivity.count();
    console.log(`\n--- Activities ---`);
    console.log(`Total Activities: ${activityCount}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
