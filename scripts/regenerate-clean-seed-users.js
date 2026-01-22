
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function regenerateSeedUsers() {
    try {
        console.log('Fetching users from database...');
        const users = await prisma.user.findMany({
            orderBy: { id: 'asc' }, // Stable ordering
            include: { teams: true }
        });

        // 1. Identify Admin and separate users
        let adminUser = null;
        let otherUsers = [];

        users.forEach(u => {
            if (u.role === 'ADMIN' || u.email === 'admin@example.com') {
                adminUser = u;
            } else {
                otherUsers.push(u);
            }
        });

        // 2. Create New ID Mappings
        const idMap = new Map(); // Old ID -> New ID
        let currentId = 1;

        if (adminUser) {
            idMap.set(adminUser.id, currentId);
            currentId++;
        }

        // Sort other users to ensure deterministic new IDs
        // (Assuming original ID order is fine, or sort by name if preferred)
        otherUsers.forEach(u => {
            idMap.set(u.id, currentId);
            currentId++;
        });

        // 3. Process Users with New IDs and Clean Data
        const allUsers = [adminUser, ...otherUsers].filter(Boolean);

        // --- Helper Logic for Fields ---

        function getDesignation(name, role) {
            if (role === 'ADMIN') return 'Administrator';
            if (name.includes('AVP')) return 'AVP';
            if (name.includes('Director')) return 'Director';
            if (name.includes('Pricing Manager')) return 'Pricing Manager';
            if (name.includes('Pricing Analyst')) return 'Pricing Analyst';
            if (name.includes('Sales Manager')) return 'Sales Manager';
            if (name.includes('Sales User')) return 'Sales User';
            if (name.includes('Sol Manager')) return 'Solutions Manager';
            if (name.includes('Solution Arch')) return 'Solution Architect';
            if (name.includes('Finance Manager') || name.includes('finm')) return 'Finance Manager';
            if (name.includes('Finance User')) return 'Finance User';
            if (name.includes('TA User')) return 'TA User';
            if (name.includes('WMF User')) return 'WMF User';
            return role.charAt(0) + role.slice(1).toLowerCase(); // Fallback
        }

        function getInitials(name, indexMap) {
            let prefix = '';
            if (name === 'Admin User') return 'ADM';
            if (name.includes('AVP')) return 'AVP';
            if (name.includes('Director')) prefix = 'PD';
            else if (name.includes('Pricing Manager')) prefix = 'PM';
            else if (name.includes('Pricing Analyst')) prefix = 'PA';
            else if (name.includes('Sales Manager')) prefix = 'SM';
            else if (name.includes('Sales User')) prefix = 'SZX';
            else if (name.includes('Sol Manager')) prefix = 'SLM'; // Distinct from Sales Manager
            else if (name.includes('Solution Arch')) prefix = 'SA';
            else if (name.includes('Finance Manager')) return 'FM';
            else if (name.includes('TA User')) prefix = 'TA';
            else if (name.includes('WMF User')) prefix = 'WMF';
            else {
                // Fallback: First letters of name
                return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 3);
            }

            // Increment counter for prefix
            if (!indexMap[prefix]) indexMap[prefix] = 0;
            indexMap[prefix]++;
            return `${prefix}${indexMap[prefix]}`;
        }

        const initialsCounters = {};

        const cleanedUsers = allUsers.map(user => {
            const newId = idMap.get(user.id);
            const newManagerId = user.managerId ? idMap.get(user.managerId) : null;
            const cleanTeams = user.teams.map(t => ({ id: t.id }));

            const initials = getInitials(user.name, initialsCounters);
            const designation = getDesignation(user.name, user.role);
            const avatar = `https://ui-avatars.com/api/?name=${initials}&background=random`;

            return {
                id: newId,
                email: user.email,
                name: user.name,
                initials: initials, // Renamed from shortName
                avatar: avatar,
                designation: designation,
                managerId: newManagerId,
                role: user.role,
                isActive: user.isActive,
                teams: cleanTeams
            };
        });

        // 4. Write to file
        const fileContent = `
export const users = ${JSON.stringify(cleanedUsers, null, 4)};
`;
        const outputPath = path.join(__dirname, '../prisma/seed-user.ts');
        fs.writeFileSync(outputPath, fileContent);

        console.log(`Successfully regenerated seed-user.ts with ${cleanedUsers.length} users.`);
        console.log(`Admin ID mapped from ${adminUser ? adminUser.id : 'N/A'} to 1.`);

    } catch (error) {
        console.error('Error regenerating users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

regenerateSeedUsers();
