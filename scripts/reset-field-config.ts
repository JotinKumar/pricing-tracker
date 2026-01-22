
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Clearing FieldConfig prefixes...');
    await prisma.fieldConfig.updateMany({
        where: { targetField: 'id1' },
        data: { prefix: '', isActive: false, fieldName: '' }
    });
    await prisma.fieldConfig.updateMany({
        where: { targetField: 'id2' },
        data: { prefix: '', isActive: false, fieldName: '' }
    });
    console.log('FieldConfig cleared.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
