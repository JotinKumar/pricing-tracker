/*
  Warnings:

  - You are about to drop the column `stage` on the `PricingActivity` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Outcome" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PricingActivity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salesForceId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "lineOfBusinessId" INTEGER NOT NULL,
    "annualContractValue" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "clientLocationId" INTEGER NOT NULL,
    "deliveryLocationId" INTEGER NOT NULL,
    "solutionArchitect" TEXT NOT NULL,
    "requesterSales" TEXT NOT NULL,
    "businessFinanceSpoc" TEXT NOT NULL,
    "pricingAnalystName" TEXT NOT NULL,
    "assignDate" DATETIME NOT NULL,
    "currentStatusId" INTEGER NOT NULL,
    "dealCategoryId" INTEGER NOT NULL,
    "versionId" INTEGER NOT NULL,
    "comments" TEXT NOT NULL,
    "outcomeId" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PricingActivity_lineOfBusinessId_fkey" FOREIGN KEY ("lineOfBusinessId") REFERENCES "LineOfBusiness" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_clientLocationId_fkey" FOREIGN KEY ("clientLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_deliveryLocationId_fkey" FOREIGN KEY ("deliveryLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_currentStatusId_fkey" FOREIGN KEY ("currentStatusId") REFERENCES "ActivityStatus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_dealCategoryId_fkey" FOREIGN KEY ("dealCategoryId") REFERENCES "DealCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ActivityVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PricingActivity" ("annualContractValue", "assignDate", "businessFinanceSpoc", "clientLocationId", "clientName", "comments", "createdAt", "currentStatusId", "dealCategoryId", "deliveryLocationId", "dueDate", "id", "lineOfBusinessId", "pricingAnalystName", "projectName", "requesterSales", "salesForceId", "solutionArchitect", "updatedAt", "userId", "versionId") SELECT "annualContractValue", "assignDate", "businessFinanceSpoc", "clientLocationId", "clientName", "comments", "createdAt", "currentStatusId", "dealCategoryId", "deliveryLocationId", "dueDate", "id", "lineOfBusinessId", "pricingAnalystName", "projectName", "requesterSales", "salesForceId", "solutionArchitect", "updatedAt", "userId", "versionId" FROM "PricingActivity";
DROP TABLE "PricingActivity";
ALTER TABLE "new_PricingActivity" RENAME TO "PricingActivity";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Outcome_name_key" ON "Outcome"("name");
