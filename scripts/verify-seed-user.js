
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../prisma/seed-user.ts');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const arrayStart = content.indexOf('[');
    const arrayEnd = content.lastIndexOf(']');

    if (arrayStart === -1 || arrayEnd === -1) {
        throw new Error('Could not find array in file');
    }

    const jsonString = content.substring(arrayStart, arrayEnd + 1);
    const users = JSON.parse(jsonString);

    console.log(`Total users: ${users.length}`);

    let brokenLinks = 0;
    let totalLinks = 0;
    let ids = new Set();
    let duplicates = 0;

    // 1. Check ID Uniqueness
    users.forEach(u => {
        if (ids.has(u.id)) {
            console.error(`Duplicate ID found: ${u.id}`);
            duplicates++;
        }
        ids.add(u.id);
    });

    if (duplicates > 0) {
        console.log(`FAILED: ${duplicates} duplicate IDs found.`);
    } else {
        console.log('ID Uniqueness: PASSED');
    }

    // 2. Check Admin ID
    const admin = users.find(u => u.role === 'ADMIN' || u.email === 'admin@example.com');
    if (admin && admin.id === 1) {
        console.log('Admin ID is 1: PASSED');
    } else {
        console.log(`Admin ID Check: FAILED (Admin ID is ${admin ? admin.id : 'Not Found'})`);
    }

    // 3. Check Manager Links
    users.forEach(u => {
        if (u.managerId) {
            totalLinks++;
            const manager = users.find(m => m.id === u.managerId);
            if (!manager) {
                console.error(`Broken Link: User ${u.id} (${u.name}) points to missing Manager ${u.managerId}`);
                brokenLinks++;
            }
        }
    });

    console.log(`Total Manager Links: ${totalLinks}`);
    console.log(`Broken Manager Links: ${brokenLinks}`);

    const nullManagers = users.filter(u => u.managerId === null);
    console.log(`\nUsers with NULL Manager ID (${nullManagers.length}):`);
    nullManagers.forEach(u => console.log(`- ${u.name} (Role: ${u.role})`));

    if (brokenLinks === 0 && duplicates === 0) {
        console.log('\nVERIFICATION PASSED');
    } else {
        console.log('\nVERIFICATION FAILED');
    }

} catch (error) {
    console.error('Error verifying users:', error);
    process.exit(1);
}
