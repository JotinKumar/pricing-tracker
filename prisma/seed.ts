
import { PrismaClient } from '@prisma/client'
import {
    teams, verticals, horizontals, statuses, categories, versions,
    documentTypes, locations, outcomes
} from './seed-data'
import { users } from './seed-user'
import { activities } from './seed-activity'

const prisma = new PrismaClient()

async function cleanDatabase() {
    console.log('Cleaning database...');
    // Delete relational/dependent tables first
    await prisma.comment.deleteMany({});
    await prisma.activityTeamMember.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.pricingActivity.deleteMany({});
    await prisma.defaultAssignment.deleteMany({});

    // Clear User hierarchy to allow deletion
    await prisma.user.updateMany({ data: { managerId: null } });
    await prisma.user.deleteMany({});

    // Clear Lookups
    await prisma.team.deleteMany({});
    await prisma.vertical.deleteMany({});
    await prisma.horizontal.deleteMany({});
    await prisma.status.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.version.deleteMany({});
    await prisma.documentType.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.outcome.deleteMany({});

    console.log('Database cleaned.');
}

async function main() {
    console.log('Start seeding ...')

    await cleanDatabase();

    // 1. Seed Lookup Tables
    console.log('Seeding lookup tables...')

    for (const t of teams) {
        await prisma.team.create({ data: t })
    }
    for (const v of verticals) {
        await prisma.vertical.create({ data: v })
    }
    for (const h of horizontals) {
        await prisma.horizontal.create({ data: h })
    }
    for (const s of statuses) {
        await prisma.status.create({ data: s })
    }
    for (const c of categories) {
        await prisma.category.create({ data: c })
    }
    for (const v of versions) {
        await prisma.version.create({ data: v })
    }
    for (const d of documentTypes) {
        await prisma.documentType.create({ data: d })
    }
    for (const l of locations) {
        await prisma.location.create({ data: l })
    }
    for (const o of outcomes) {
        await prisma.outcome.create({ data: o })
    }

    // 2. Seed Users
    console.log(`Seeding ${users.length} Users...`)

    for (const user of users) {
        const { teams: userTeams, ...userData } = user;
        await prisma.user.create({
            data: {
                ...userData,
                teams: {
                    connect: userTeams.map((t: any) => ({ id: t.id }))
                }
            }
        })
    }

    // 3. Seed Activities
    console.log(`Seeding ${activities.length} Activities...`)

    for (const activity of activities) {
        // Destructure comments to handle them as nested write
        // Note: activities coming from seed-activity.ts now have 'comments' as array of objects
        const { teamMembers, clientLocations, deliveryLocations, comments, ...activityData } = activity;

        // Sanitize id2 which might be null in seed data but is required in schema
        // Also ensure outcomeId is handled if needed, though it is optional in schema
        const safeActivityData = {
            ...activityData,
            id2: activityData.id2 || ""
        };

        await prisma.pricingActivity.create({
            data: {
                ...safeActivityData,
                teamMembers: {
                    create: teamMembers
                },
                clientLocations: {
                    connect: clientLocations
                },
                deliveryLocations: {
                    connect: deliveryLocations
                },
                comments: {
                    create: comments // Nested create for comments
                }
            }
        })
    }

    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        // process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
