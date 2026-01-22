-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "managerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LineOfBusiness" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Location" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ActivityStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "DealCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ActivityVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "PricingActivity" (
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LineOfBusiness_name_key" ON "LineOfBusiness"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityStatus_name_key" ON "ActivityStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DealCategory_name_key" ON "DealCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityVersion_name_key" ON "ActivityVersion"("name");
