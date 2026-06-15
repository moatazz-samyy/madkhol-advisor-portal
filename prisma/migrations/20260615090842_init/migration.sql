-- CreateTable
CREATE TABLE "Advisor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#0A2E1F',
    "licenseNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "madkholAiConnectedAt" TIMESTAMP(3),
    "madkholAiEngagementLevel" TEXT,
    "preferences" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "Advisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetNote" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAlert" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "op" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorProfile" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "bioAr" TEXT NOT NULL,
    "philosophy" TEXT NOT NULL,
    "philosophyAr" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "specializations" TEXT NOT NULL DEFAULT '[]',
    "languages" TEXT NOT NULL DEFAULT '[]',
    "feeStructure" TEXT NOT NULL,
    "feeBps" INTEGER NOT NULL DEFAULT 100,
    "averageClientAumSar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentClientCount" INTEGER NOT NULL DEFAULT 0,
    "totalAumSar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "certificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "certifiedAt" TIMESTAMP(3),
    "internalRating" DOUBLE PRECISION DEFAULT 0,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceInquiry" (
    "id" TEXT NOT NULL,
    "advisorProfileId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "selectedTier" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "messages" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suitabilityScore" INTEGER NOT NULL DEFAULT 50,
    "hijriYearEndDate" TIMESTAMP(3) NOT NULL,
    "familyStructure" TEXT NOT NULL DEFAULT '{}',
    "expectedRetireAge" INTEGER NOT NULL DEFAULT 60,
    "monthlyExpenseSar" INTEGER NOT NULL DEFAULT 15000,
    "kycToken" TEXT,
    "kycCompletedAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "totalAumSar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastRebalancedAt" TIMESTAMP(3),
    "targetModelId" TEXT,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fund" (
    "id" TEXT NOT NULL,
    "symbol" TEXT,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "assetClass" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "sector" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "fundManager" TEXT NOT NULL,
    "marketCapSar" DOUBLE PRECISION,
    "shariahCompliant" BOOLEAN NOT NULL DEFAULT true,
    "shariahStatusReason" TEXT,
    "lastKnownNav" DOUBLE PRECISION NOT NULL,
    "ytdReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fundFeeBps" INTEGER NOT NULL DEFAULT 75,

    CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "units" DOUBLE PRECISION NOT NULL,
    "averageCost" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "units" DOUBLE PRECISION NOT NULL,
    "amountSar" DOUBLE PRECISION NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelPortfolio" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetHoldings" TEXT NOT NULL,

    CONSTRAINT "ModelPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationOrder" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "totalAmountSar" DOUBLE PRECISION NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "perClientBreakdown" TEXT NOT NULL,

    CONSTRAINT "AllocationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RebalanceJob" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "modelId" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "affectedClients" INTEGER NOT NULL,
    "tradesExecuted" TEXT NOT NULL,

    CONSTRAINT "RebalanceJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShariahAlert" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "affectedClientCount" INTEGER NOT NULL DEFAULT 0,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShariahAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZakatReport" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "hijriYear" INTEGER NOT NULL,
    "zakatableAssetsSar" DOUBLE PRECISION NOT NULL,
    "nisabThresholdSar" DOUBLE PRECISION NOT NULL,
    "zakatDueSar" DOUBLE PRECISION NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZakatReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectionRun" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "horizonMonths" INTEGER NOT NULL,
    "monthlyContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyWithdrawal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceInterval" INTEGER NOT NULL DEFAULT 80,
    "nRuns" INTEGER NOT NULL DEFAULT 10000,
    "seed" INTEGER NOT NULL,
    "startingAumSar" DOUBLE PRECISION NOT NULL,
    "percentileResults" TEXT NOT NULL,
    "aggregates" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Advisor_email_key" ON "Advisor"("email");

-- CreateIndex
CREATE INDEX "Watchlist_advisorId_idx" ON "Watchlist"("advisorId");

-- CreateIndex
CREATE INDEX "WatchlistItem_watchlistId_idx" ON "WatchlistItem"("watchlistId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_watchlistId_symbol_key" ON "WatchlistItem"("watchlistId", "symbol");

-- CreateIndex
CREATE INDEX "AssetNote_advisorId_idx" ON "AssetNote"("advisorId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetNote_advisorId_symbol_key" ON "AssetNote"("advisorId", "symbol");

-- CreateIndex
CREATE INDEX "AssetAlert_advisorId_idx" ON "AssetAlert"("advisorId");

-- CreateIndex
CREATE INDEX "AssetAlert_advisorId_active_idx" ON "AssetAlert"("advisorId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorProfile_advisorId_key" ON "AdvisorProfile"("advisorId");

-- CreateIndex
CREATE INDEX "AdvisorProfile_certificationStatus_visible_idx" ON "AdvisorProfile"("certificationStatus", "visible");

-- CreateIndex
CREATE INDEX "MarketplaceInquiry_advisorId_status_idx" ON "MarketplaceInquiry"("advisorId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceInquiry_advisorProfileId_idx" ON "MarketplaceInquiry"("advisorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_kycToken_key" ON "Client"("kycToken");

-- CreateIndex
CREATE INDEX "Client_advisorId_idx" ON "Client"("advisorId");

-- CreateIndex
CREATE INDEX "ClientNote_clientId_idx" ON "ClientNote"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_clientId_key" ON "Portfolio"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Fund_symbol_key" ON "Fund"("symbol");

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
CREATE INDEX "ProjectionRun_advisorId_createdAt_idx" ON "ProjectionRun"("advisorId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectionRun_subjectType_subjectId_createdAt_idx" ON "ProjectionRun"("subjectType", "subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_advisorId_createdAt_idx" ON "AuditLog"("advisorId", "createdAt");

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetNote" ADD CONSTRAINT "AssetNote_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAlert" ADD CONSTRAINT "AssetAlert_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorProfile" ADD CONSTRAINT "AdvisorProfile_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceInquiry" ADD CONSTRAINT "MarketplaceInquiry_advisorProfileId_fkey" FOREIGN KEY ("advisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_targetModelId_fkey" FOREIGN KEY ("targetModelId") REFERENCES "ModelPortfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelPortfolio" ADD CONSTRAINT "ModelPortfolio_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationOrder" ADD CONSTRAINT "AllocationOrder_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalanceJob" ADD CONSTRAINT "RebalanceJob_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShariahAlert" ADD CONSTRAINT "ShariahAlert_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZakatReport" ADD CONSTRAINT "ZakatReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
