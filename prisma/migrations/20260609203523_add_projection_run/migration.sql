-- Persist Monte Carlo projection runs for the 24h cache + per-portfolio history

CREATE TABLE "ProjectionRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "advisorId" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "horizonMonths" INTEGER NOT NULL,
  "monthlyContribution" REAL NOT NULL DEFAULT 0,
  "monthlyWithdrawal" REAL NOT NULL DEFAULT 0,
  "confidenceInterval" INTEGER NOT NULL DEFAULT 80,
  "nRuns" INTEGER NOT NULL DEFAULT 10000,
  "seed" INTEGER NOT NULL,
  "startingAumSar" REAL NOT NULL,
  "percentileResults" TEXT NOT NULL,
  "aggregates" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ProjectionRun_advisorId_createdAt_idx" ON "ProjectionRun"("advisorId", "createdAt");
CREATE INDEX "ProjectionRun_subjectType_subjectId_createdAt_idx" ON "ProjectionRun"("subjectType", "subjectId", "createdAt");
