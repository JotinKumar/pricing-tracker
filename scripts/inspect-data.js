
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const data = {
        teams: await prisma.team.findMany(),
        verticals: await prisma.vertical.findMany(),
        horizontals: await prisma.horizontal.findMany(),
        statuses: await prisma.status.findMany(),
        categories: await prisma.category.findMany(),
        versions: await prisma.version.findMany(),
        documentTypes: await prisma.documentType.findMany(),
        locations: await prisma.location.findMany(),
    };

    fs.writeFileSync('temp_seed_data.json', JSON.stringify(data, null, 2));
    console.log('Data written to temp_seed_data.json');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
