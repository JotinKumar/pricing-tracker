/*
  Warnings:

  - Added the required column `display` to the `ActivityStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salesForceIdPrefix` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActivityStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "display" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_ActivityStatus" ("id", "isActive", "name") SELECT "id", "isActive", "name" FROM "ActivityStatus";
DROP TABLE "ActivityStatus";
ALTER TABLE "new_ActivityStatus" RENAME TO "ActivityStatus";
CREATE UNIQUE INDEX "ActivityStatus_name_key" ON "ActivityStatus"("name");
CREATE TABLE "new_Location" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "salesForceIdPrefix" TEXT NOT NULL
);
INSERT INTO "new_Location" ("id", "isActive", "name") SELECT "id", "isActive", "name" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Team" ("id", "name") SELECT "id", "name" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
