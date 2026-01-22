-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TeamToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TeamToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TeamToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "stage" TEXT NOT NULL DEFAULT 'PIPELINE',
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PricingActivity_lineOfBusinessId_fkey" FOREIGN KEY ("lineOfBusinessId") REFERENCES "LineOfBusiness" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_clientLocationId_fkey" FOREIGN KEY ("clientLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_deliveryLocationId_fkey" FOREIGN KEY ("deliveryLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_currentStatusId_fkey" FOREIGN KEY ("currentStatusId") REFERENCES "ActivityStatus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_dealCategoryId_fkey" FOREIGN KEY ("dealCategoryId") REFERENCES "DealCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ActivityVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PricingActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PricingActivity" ("annualContractValue", "assignDate", "businessFinanceSpoc", "clientLocationId", "clientName", "comments", "createdAt", "currentStatusId", "dealCategoryId", "deliveryLocationId", "dueDate", "id", "lineOfBusinessId", "pricingAnalystName", "projectName", "requesterSales", "salesForceId", "solutionArchitect", "updatedAt", "userId", "versionId") SELECT "annualContractValue", "assignDate", "businessFinanceSpoc", "clientLocationId", "clientName", "comments", "createdAt", "currentStatusId", "dealCategoryId", "deliveryLocationId", "dueDate", "id", "lineOfBusinessId", "pricingAnalystName", "projectName", "requesterSales", "salesForceId", "solutionArchitect", "updatedAt", "userId", "versionId" FROM "PricingActivity";
DROP TABLE "PricingActivity";
ALTER TABLE "new_PricingActivity" RENAME TO "PricingActivity";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_TeamToUser_AB_unique" ON "_TeamToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_TeamToUser_B_index" ON "_TeamToUser"("B");
