-- CreateTable
CREATE TABLE "Advisor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#0A2E1F',
    "licenseNo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suitabilityScore" INTEGER NOT NULL DEFAULT 50,
    "hijriYearEndDate" DATETIME NOT NULL,
    "familyStructure" TEXT NOT NULL DEFAULT '{}',
    "expectedRetireAge" INTEGER NOT NULL DEFAULT 60,
    "monthlyExpenseSar" INTEGER NOT NULL DEFAULT 15000,
    CONSTRAINT "Client_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "totalAumSar" REAL NOT NULL DEFAULT 0,
    "lastRebalancedAt" DATETIME,
    "targetModelId" TEXT,
    CONSTRAINT "Portfolio_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Portfolio_targetModelId_fkey" FOREIGN KEY ("targetModelId") REFERENCES "ModelPortfolio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "assetClass" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "fundManager" TEXT NOT NULL,
    "shariahCompliant" BOOLEAN NOT NULL DEFAULT true,
    "shariahStatusReason" TEXT,
    "lastKnownNav" REAL NOT NULL,
    "ytdReturn" REAL NOT NULL DEFAULT 0,
    "fundFeeBps" INTEGER NOT NULL DEFAULT 75
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "units" REAL NOT NULL,
    "averageCost" REAL NOT NULL,
    "currentValue" REAL NOT NULL,
    CONSTRAINT "Holding_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Holding_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "units" REAL NOT NULL,
    "amountSar" REAL NOT NULL,
    "executedAt" DATETIME NOT NULL,
    "source" TEXT,
    CONSTRAINT "Transaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModelPortfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetHoldings" TEXT NOT NULL,
    CONSTRAINT "ModelPortfolio_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AllocationOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "totalAmountSar" REAL NOT NULL,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "perClientBreakdown" TEXT NOT NULL,
    CONSTRAINT "AllocationOrder_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RebalanceJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "modelId" TEXT,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "affectedClients" INTEGER NOT NULL,
    "tradesExecuted" TEXT NOT NULL,
    CONSTRAINT "RebalanceJob_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShariahAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fundId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "affectedClientCount" INTEGER NOT NULL DEFAULT 0,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ShariahAlert_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ZakatReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "hijriYear" INTEGER NOT NULL,
    "zakatableAssetsSar" REAL NOT NULL,
    "nisabThresholdSar" REAL NOT NULL,
    "zakatDueSar" REAL NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ZakatReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Advisor_email_key" ON "Advisor"("email");

-- CreateIndex
CREATE INDEX "Client_advisorId_idx" ON "Client"("advisorId");

-- CreateIndex
CREATE INDEX "ClientNote_clientId_idx" ON "ClientNote"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_clientId_key" ON "Portfolio"("clientId");

-- CreateIndex
CREATE INDEX "Holding_portfolioId_idx" ON "Holding"("portfolioId");

-- CreateIndex
CREATE INDEX "Holding_fundId_idx" ON "Holding"("fundId");

-- CreateIndex
CREATE INDEX "Transaction_portfolioId_executedAt_idx" ON "Transaction"("portfolioId", "executedAt");

-- CreateIndex
CREATE INDEX "ModelPortfolio_advisorId_idx" ON "ModelPortfolio"("advisorId");

-- CreateIndex
CREATE INDEX "AllocationOrder_advisorId_idx" ON "AllocationOrder"("advisorId");

-- CreateIndex
CREATE INDEX "RebalanceJob_advisorId_idx" ON "RebalanceJob"("advisorId");

-- CreateIndex
CREATE INDEX "ShariahAlert_advisorId_resolved_idx" ON "ShariahAlert"("advisorId", "resolved");

-- CreateIndex
CREATE INDEX "ZakatReport_clientId_hijriYear_idx" ON "ZakatReport"("clientId", "hijriYear");

-- CreateIndex
CREATE INDEX "AuditLog_advisorId_createdAt_idx" ON "AuditLog"("advisorId", "createdAt");
