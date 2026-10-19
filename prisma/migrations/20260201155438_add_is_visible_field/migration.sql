-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActivityTeamMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activityId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ActivityTeamMember_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "PricingActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActivityTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ActivityTeamMember" ("activityId", "id", "teamId", "userId") SELECT "activityId", "id", "teamId", "userId" FROM "ActivityTeamMember";
DROP TABLE "ActivityTeamMember";
ALTER TABLE "new_ActivityTeamMember" RENAME TO "ActivityTeamMember";
CREATE INDEX "ActivityTeamMember_activityId_idx" ON "ActivityTeamMember"("activityId");
CREATE INDEX "ActivityTeamMember_userId_idx" ON "ActivityTeamMember"("userId");
CREATE INDEX "ActivityTeamMember_teamId_idx" ON "ActivityTeamMember"("teamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
