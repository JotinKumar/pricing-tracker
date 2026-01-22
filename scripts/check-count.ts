
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.pricingActivity.count()
    console.log('Total Activities in DB:', count)

    const users = await prisma.user.count()
    console.log('Total Users:', users)

    const firstFew = await prisma.pricingActivity.findMany({
        take: 5,
        include: { comments: true }
    })
    console.log('Sample Activity 1 Comments:', firstFew[0]?.comments?.length || 0)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
