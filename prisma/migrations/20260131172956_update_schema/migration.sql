/*
  Warnings:

  - You are about to drop the `ActivityStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DealCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LineOfBusiness` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `name` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `salesForceIdPrefix` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Outcome` table. All the data in the column will be lost.
  - You are about to drop the column `businessFinanceSpoc` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `clientLocationId` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `currentStatusId` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `dealCategoryId` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryLocationId` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `lineOfBusinessId` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `pricingAnalystName` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `requesterSales` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `salesForceId` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `solutionArchitect` on the `PricingActivity` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Team` table. All the data in the column will be lost.
  - Added the required column `country` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outcome` to the `Outcome` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `PricingActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `horizontalId` to the `PricingActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id1` to the `PricingActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id2` to the `PricingActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusId` to the `PricingActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verticalId` to the `PricingActivity` table without a default value. This is not possible if the table is not empty.
  - Made the column `outcomeId` on table `PricingActivity` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `teamname` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ActivityStatus_name_key";

-- DropIndex
DROP INDEX "ActivityVersion_name_key";

-- DropIndex
DROP INDEX "DealCategory_name_key";

-- DropIndex
DROP INDEX "LineOfBusiness_name_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;
ALTER TABLE "User" ADD COLUMN "designation" TEXT;
ALTER TABLE "User" ADD COLUMN "initials" TEXT;
ALTER TABLE "User" ADD COLUMN "preferenceAcvDecimals" TEXT;
ALTER TABLE "User" ADD COLUMN "preferenceAcvUnit" TEXT;
ALTER TABLE "User" ADD COLUMN "preferenceDateFormat" TEXT;
ALTER TABLE "User" ADD COLUMN "preferenceTheme" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ActivityStatus";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ActivityVersion";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DealCategory";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LineOfBusiness";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "display" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Vertical" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vertical" TEXT NOT NULL,
    "display" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Horizontal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "horizontal" TEXT NOT NULL,
    "display" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Status" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL,
    "display" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "display" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Version" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version" TEXT NOT NULL,
    "display" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "PricingActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityTeamMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activityId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    CONSTRAINT "ActivityTeamMember_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "PricingActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActivityTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "location" TEXT,
    "notes" TEXT,
    "id1" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DefaultAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "referenceId" INTEGER,
    "userId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DefaultAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "targetField" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "hasPrefix" BOOLEAN NOT NULL DEFAULT false,
    "prefix" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOnDashboard" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_ClientLocations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ClientLocations_A_fkey" FOREIGN KEY ("A") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ClientLocations_B_fkey" FOREIGN KEY ("B") REFERENCES "PricingActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DeliveryLocations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_DeliveryLocations_A_fkey" FOREIGN KEY ("A") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DeliveryLocations_B_fkey" FOREIGN KEY ("B") REFERENCES "PricingActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Location" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "country" TEXT NOT NULL,
    "display" TEXT,
    "currency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Location" ("id", "isActive") SELECT "id", "isActive" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";
CREATE UNIQUE INDEX "Location_country_key" ON "Location"("country");
CREATE UNIQUE INDEX "Location_display_key" ON "Location"("display");
CREATE UNIQUE INDEX "Location_currency_key" ON "Location"("currency");
CREATE TABLE "new_Outcome" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "outcome" TEXT NOT NULL,
    "display" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Outcome" ("id", "isActive") SELECT "id", "isActive" FROM "Outcome";
DROP TABLE "Outcome";
ALTER TABLE "new_Outcome" RENAME TO "Outcome";
CREATE UNIQUE INDEX "Outcome_outcome_key" ON "Outcome"("outcome");
CREATE UNIQUE INDEX "Outcome_display_key" ON "Outcome"("display");
CREATE TABLE "new_PricingActivity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id1" TEXT NOT NULL,
    "id2" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "verticalId" INTEGER NOT NULL,
    "horizontalId" INTEGER NOT NULL,
    "annualContractValue" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "assignDate" DATETIME NOT NULL,
    "statusId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "versionId" INTEGER NOT NULL,
    "outcomeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PricingActivity_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_horizontalId_fkey" FOREIGN KEY ("horizontalId") REFERENCES "Horizontal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PricingActivity" ("annualContractValue", "assignDate", "clientName", "createdAt", "dueDate", "id", "outcomeId", "projectName", "updatedAt", "userId", "versionId") SELECT "annualContractValue", "assignDate", "clientName", "createdAt", "dueDate", "id", "outcomeId", "projectName", "updatedAt", "userId", "versionId" FROM "PricingActivity";
DROP TABLE "PricingActivity";
ALTER TABLE "new_PricingActivity" RENAME TO "PricingActivity";
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamname" TEXT NOT NULL,
    "display" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Team" ("id", "isActive") SELECT "id", "isActive" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_teamname_key" ON "Team"("teamname");
CREATE UNIQUE INDEX "Team_display_key" ON "Team"("display");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_type_key" ON "DocumentType"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_display_key" ON "DocumentType"("display");

-- CreateIndex
CREATE UNIQUE INDEX "Vertical_vertical_key" ON "Vertical"("vertical");

-- CreateIndex
CREATE UNIQUE INDEX "Vertical_display_key" ON "Vertical"("display");

-- CreateIndex
CREATE UNIQUE INDEX "Horizontal_horizontal_key" ON "Horizontal"("horizontal");

-- CreateIndex
CREATE UNIQUE INDEX "Horizontal_display_key" ON "Horizontal"("display");

-- CreateIndex
CREATE UNIQUE INDEX "Status_status_key" ON "Status"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Status_display_key" ON "Status"("display");

-- CreateIndex
CREATE UNIQUE INDEX "Category_category_key" ON "Category"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Category_display_key" ON "Category"("display");

-- CreateIndex
CREATE UNIQUE INDEX "Version_version_key" ON "Version"("version");

-- CreateIndex
CREATE UNIQUE INDEX "Version_display_key" ON "Version"("display");

-- CreateIndex
CREATE INDEX "ActivityTeamMember_activityId_idx" ON "ActivityTeamMember"("activityId");

-- CreateIndex
CREATE INDEX "ActivityTeamMember_userId_idx" ON "ActivityTeamMember"("userId");

-- CreateIndex
CREATE INDEX "ActivityTeamMember_teamId_idx" ON "ActivityTeamMember"("teamId");

-- CreateIndex
CREATE INDEX "Attachment_id1_idx" ON "Attachment"("id1");

-- CreateIndex
CREATE UNIQUE INDEX "DefaultAssignment_type_referenceId_userId_key" ON "DefaultAssignment"("type", "referenceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldConfig_targetField_key" ON "FieldConfig"("targetField");

-- CreateIndex
CREATE UNIQUE INDEX "_ClientLocations_AB_unique" ON "_ClientLocations"("A", "B");

-- CreateIndex
CREATE INDEX "_ClientLocations_B_index" ON "_ClientLocations"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DeliveryLocations_AB_unique" ON "_DeliveryLocations"("A", "B");

-- CreateIndex
CREATE INDEX "_DeliveryLocations_B_index" ON "_DeliveryLocations"("B");
