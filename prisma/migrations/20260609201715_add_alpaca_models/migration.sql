-- Alpaca-specific master models + client links (separate from generic ModelPortfolio)

CREATE TABLE "AlpacaModel" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "advisorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "targetHoldings" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "lastSyncedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "AlpacaModel_advisorId_idx" ON "AlpacaModel"("advisorId");

CREATE TABLE "AlpacaModelLink" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "alpacaModelId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "tweaks" TEXT NOT NULL DEFAULT '{"excluded":[],"overrides":{}}',
  "lastSyncedVersion" INTEGER NOT NULL DEFAULT 0,
  "lastSyncedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AlpacaModelLink_alpacaModelId_fkey" FOREIGN KEY ("alpacaModelId") REFERENCES "AlpacaModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AlpacaModelLink_alpacaModelId_clientId_key" ON "AlpacaModelLink"("alpacaModelId", "clientId");
CREATE INDEX "AlpacaModelLink_alpacaModelId_idx" ON "AlpacaModelLink"("alpacaModelId");
CREATE INDEX "AlpacaModelLink_clientId_idx" ON "AlpacaModelLink"("clientId");
