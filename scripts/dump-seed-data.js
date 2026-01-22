
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function dumpData() {
    try {
        console.log('Fetching data from database...');

        const teams = await prisma.team.findMany({ orderBy: { id: 'asc' } });
        const verticals = await prisma.vertical.findMany({ orderBy: { id: 'asc' } });
        const horizontals = await prisma.horizontal.findMany({ orderBy: { id: 'asc' } });
        const statuses = await prisma.status.findMany({ orderBy: { id: 'asc' } });
        const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
        const versions = await prisma.version.findMany({ orderBy: { id: 'asc' } });
        const documentTypes = await prisma.documentType.findMany({ orderBy: { id: 'asc' } });
        const locations = await prisma.location.findMany({ orderBy: { id: 'asc' } });
        const outcomes = await prisma.outcome.findMany({ orderBy: { id: 'asc' } });

        const fileContent = `
export const teams = ${JSON.stringify(teams, null, 4)};

export const verticals = ${JSON.stringify(verticals, null, 4)};

export const horizontals = ${JSON.stringify(horizontals, null, 4)};

export const statuses = ${JSON.stringify(statuses, null, 4)};

export const categories = ${JSON.stringify(categories, null, 4)};

export const versions = ${JSON.stringify(versions, null, 4)};

export const documentTypes = ${JSON.stringify(documentTypes, null, 4)};

export const locations = ${JSON.stringify(locations, null, 4)};

export const outcomes = ${JSON.stringify(outcomes, null, 4)};
`;

        const outputPath = path.join(__dirname, '../prisma/seed-data.ts');
        fs.writeFileSync(outputPath, fileContent);

        console.log(`Successfully updated ${outputPath}`);

    } catch (error) {
        console.error('Error dumping data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

dumpData();
