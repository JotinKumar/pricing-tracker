
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../prisma/seed-activity.ts');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Extract the array part
    const arrayStart = content.indexOf('[');
    const arrayEnd = content.lastIndexOf(']');

    if (arrayStart === -1 || arrayEnd === -1) {
        throw new Error('Could not find array in file');
    }

    const jsonString = content.substring(arrayStart, arrayEnd + 1);
    let activities = JSON.parse(jsonString);

    activities.forEach(activity => {
        delete activity.id;
        delete activity.createdAt;
        delete activity.updatedAt;

        // Clean teamMembers
        if (activity.teamMembers && Array.isArray(activity.teamMembers)) {
            activity.teamMembers.forEach(tm => {
                delete tm.id;
                delete tm.activityId;
                // Keep userId and teamId
            });
        }

        // Clean clientLocations
        if (activity.clientLocations && Array.isArray(activity.clientLocations)) {
            activity.clientLocations.forEach(loc => {
                delete loc.id;
                delete loc.createdAt;
                delete loc.updatedAt;
                delete loc.isActive;
                delete loc.display;
                // Keep unique fields like country if needed for connection logic
            });
        }

        // Clean deliveryLocations
        if (activity.deliveryLocations && Array.isArray(activity.deliveryLocations)) {
            activity.deliveryLocations.forEach(loc => {
                delete loc.id;
                delete loc.createdAt;
                delete loc.updatedAt;
                delete loc.isActive;
                delete loc.display;
            });
        }
    });

    const newContent = `
export const activities = ${JSON.stringify(activities, null, 4)};
`;

    fs.writeFileSync(filePath, newContent);
    console.log('Successfully cleaned seed-activity.ts');

} catch (error) {
    console.error('Error processing file:', error);
    process.exit(1);
}
