
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function dumpData() {
    try {
        console.log('Fetching users and activities from database...');

        // Fetch Users with Teams
        const users = await prisma.user.findMany({
            orderBy: { id: 'asc' },
            include: {
                teams: true // Include implicit relation to capture current team assignments
            }
        });

        // Fetch Activities with all necessary relations for reseeding
        const activities = await prisma.pricingActivity.findMany({
            orderBy: { id: 'asc' },
            include: {
                teamMembers: true,
                clientLocations: true,
                deliveryLocations: true
            }
        });

        // Write users to specific file
        const userFileContent = `
export const users = ${JSON.stringify(users, null, 4)};
`;
        const userOutputPath = path.join(__dirname, '../prisma/seed-user.ts');
        fs.writeFileSync(userOutputPath, userFileContent);
        console.log(`Successfully created ${userOutputPath}`);


        // Write activities to specific file
        const activityFileContent = `
export const activities = ${JSON.stringify(activities, null, 4)};
`;
        const activityOutputPath = path.join(__dirname, '../prisma/seed-activity.ts');
        fs.writeFileSync(activityOutputPath, activityFileContent);
        console.log(`Successfully created ${activityOutputPath}`);

    } catch (error) {
        console.error('Error dumping data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

dumpData();
