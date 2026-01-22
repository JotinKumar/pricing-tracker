
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../prisma/seed-user.ts');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Extract the array part
    const arrayStart = content.indexOf('[');
    const arrayEnd = content.lastIndexOf(']');

    if (arrayStart === -1 || arrayEnd === -1) {
        throw new Error('Could not find array in file');
    }

    const jsonString = content.substring(arrayStart, arrayEnd + 1);
    let users = JSON.parse(jsonString);

    let adminUser = null;
    const cleanedUsers = [];

    users.forEach(user => {
        // Remove User fields
        delete user.id;
        delete user.createdAt;
        delete user.updatedAt;

        // Transform Teams to only ID
        if (user.teams && Array.isArray(user.teams)) {
            user.teams = user.teams.map(team => ({ id: team.id }));
        }

        // Identify Admin
        if (user.role === 'ADMIN' || user.email === 'admin@example.com') {
            adminUser = user;
        } else {
            cleanedUsers.push(user);
        }
    });

    // Prepend admin
    if (adminUser) {
        cleanedUsers.unshift(adminUser);
    }

    // Create new content
    const newContent = `
export const users = ${JSON.stringify(cleanedUsers, null, 4)};
`;

    fs.writeFileSync(filePath, newContent);
    console.log('Successfully cleaned seed-user.ts');

} catch (error) {
    console.error('Error processing file:', error);
    process.exit(1);
}
