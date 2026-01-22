
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadTsFile(filename) {
    const filePath = path.join(__dirname, `../prisma/${filename}`);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace 'export const name =' with 'this.name =' to expose on context
    content = content.replace(/export\s+(?:const|let|var)\s+(\w+)\s*=/g, 'this.$1 =');

    const context = {};
    vm.createContext(context);
    vm.runInContext(content, context);
    return context;
}

// Load Data
console.log('Loading users...');
const { users } = loadTsFile('seed-user.ts');
console.log(`Loaded ${users ? users.length : 'UNDEFINED'} users.`);

console.log('Loading lookups...');
const { teams, verticals, horizontals, statuses, categories, versions, locations, outcomes } = loadTsFile('seed-data.ts');
console.log('Lookups loaded.');

const TOTAL_ACTIVITIES = 160;

const pickRandom = (arr) => {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
};
const pickRandomMulti = (arr, min = 1, max = 3) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    return shuffled.slice(0, count);
};

// ID Generation Logic Updates
const generateId1 = () => `SF-${Math.floor(10000 + Math.random() * 90000)}`;
const generateId2 = () => `DSR-${Math.floor(10000000 + Math.random() * 90000000)}`;

function findUsersByRole(roleType) {
    if (!users) return [];
    return users.filter(u => {
        if (!u) return false;
        const initials = String(u.initials || '');
        const designation = String(u.designation || '');
        const hasTeam = u.teams && Array.isArray(u.teams) && u.teams.length > 0;

        let match = false;
        if (roleType === 'PRICING') match = initials.startsWith('PM') || initials.startsWith('PA') || designation.includes('Pricing');
        else if (roleType === 'SALES') match = initials.startsWith('SM') || initials.startsWith('SZ') || designation.includes('Sales');
        else if (roleType === 'SOLUTION') match = initials.startsWith('SA') || designation.includes('Solution');
        else if (roleType === 'FINANCE') match = initials.startsWith('FM') || initials.startsWith('FU') || designation.includes('Finance');

        return match && hasTeam;
    });
}

const pricingUsers = findUsersByRole('PRICING');
const salesUsers = findUsersByRole('SALES');
const solUsers = findUsersByRole('SOLUTION');
const financeUsers = findUsersByRole('FINANCE');

console.log(`Pool Sizes: Pricing=${pricingUsers.length}, Sales=${salesUsers.length}, Sol=${solUsers.length}, Fin=${financeUsers.length}`);

if (!pricingUsers.length || !salesUsers.length || !solUsers.length || !financeUsers.length) {
    console.error("Missing required users. Exiting.");
    process.exit(1);
}

const activities = [];

for (let i = 1; i <= TOTAL_ACTIVITIES; i++) {
    try {
        const id = i;
        const id1 = generateId1();
        const id2 = Math.random() > 0.2 ? generateId2() : null;

        const clientName = pickRandom(['Cyberdyne', 'Acme Corp', 'Stark Ind', 'Wayne Ent', 'Globex', 'Umbrella Corp', 'Soylent Corp', 'Initech']);
        const projectName = `${clientName} Project ${Math.floor(Math.random() * 99) + 1}`;

        const verticalId = pickRandom(verticals).id;
        const horizontalId = pickRandom(horizontals).id;
        const statusId = pickRandom(statuses).id;
        const categoryId = pickRandom(categories).id;
        const versionId = pickRandom(versions).id;
        const outcomeId = Math.random() > 0.5 ? pickRandom(outcomes).id : null;

        const annualContractValue = Math.floor(Math.random() * 1000000) + 50000;
        const now = new Date();

        const assignTime = now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000;
        const assignDate = new Date(assignTime);
        const dueTime = assignTime + (5 + Math.random() * 40) * 24 * 60 * 60 * 1000;
        const dueDate = new Date(dueTime);

        const creator = pickRandom(pricingUsers);

        const selectedTeamMembers = [
            pickRandom(pricingUsers),
            pickRandom(salesUsers),
            pickRandom(solUsers),
            pickRandom(financeUsers)
        ];

        const teamMembers = selectedTeamMembers.map(u => {
            if (!u) throw new Error("Selected user is undefined");
            if (!u.teams || !u.teams.length) throw new Error(`User ${u.id} (${u.name}) has no teams`);
            return {
                userId: u.id,
                teamId: u.teams[0].id
            };
        });

        const uniqueTeamMembers = Array.from(new Map(teamMembers.map(item => [item.userId, item])).values());

        const clientLocs = [{ id: pickRandom(locations).id }];
        const deliveryLocIds = pickRandomMulti(locations, 1, 3);
        const deliveryLocs = deliveryLocIds.map(l => ({ id: l.id }));

        // Generate Comments
        const comments = [];
        const numComments = Math.floor(Math.random() * 3); // 0 to 2 comments
        for (let c = 0; c < numComments; c++) {
            // Pick a random user from team or creator
            const possibleAuthors = [...uniqueTeamMembers.map(tm => tm.userId), creator.id];
            const authorId = pickRandom(possibleAuthors);

            // Random date between assign and now (or due date)
            const commentTime = assignTime + Math.random() * (dueTime - assignTime);
            const commentDate = new Date(commentTime > now.getTime() ? now.getTime() : commentTime);

            comments.push({
                text: `Auto-generated comment ${c + 1} for ${id1}`,
                userId: authorId,
                createdAt: commentDate.toISOString()
            });
        }

        activities.push({
            id: id,
            id1: id1,
            id2: id2,
            clientName: clientName,
            projectName: projectName,
            verticalId: verticalId,
            horizontalId: horizontalId,
            annualContractValue: annualContractValue,
            dueDate: dueDate.toISOString(),
            assignDate: assignDate.toISOString(),
            statusId: statusId,
            categoryId: categoryId,
            versionId: versionId,
            comments: comments, // Array of objects
            outcomeId: outcomeId,
            userId: creator.id,
            teamMembers: uniqueTeamMembers,
            clientLocations: clientLocs,
            deliveryLocations: deliveryLocs
        });
    } catch (err) {
        console.error(`Error generating activity ${i}:`, err);
        process.exit(1);
    }
}

const fileContent = `
export const activities = ${JSON.stringify(activities, null, 4)};
`;

const outputPath = path.join(__dirname, '../prisma/seed-activity.ts');
try {
    fs.writeFileSync(outputPath, fileContent);
    console.log(`Successfully generated ${activities.length} activities in seed-activity.ts`);
} catch (err) {
    console.error('Error writing file:', err);
}
