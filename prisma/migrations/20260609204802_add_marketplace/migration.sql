-- Certified Advisor Marketplace: AdvisorProfile (public) + MarketplaceInquiry

CREATE TABLE "AdvisorProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
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
  "averageClientAumSar" REAL NOT NULL DEFAULT 0,
  "currentClientCount" INTEGER NOT NULL DEFAULT 0,
  "totalAumSar" REAL NOT NULL DEFAULT 0,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "certificationStatus" TEXT NOT NULL DEFAULT 'pending',
  "certifiedAt" DATETIME,
  "internalRating" REAL DEFAULT 0,
  "internalNotes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AdvisorProfile_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AdvisorProfile_advisorId_key" ON "AdvisorProfile"("advisorId");
CREATE INDEX "AdvisorProfile_certificationStatus_visible_idx" ON "AdvisorProfile"("certificationStatus", "visible");

CREATE TABLE "MarketplaceInquiry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "advisorProfileId" TEXT NOT NULL,
  "advisorId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "userEmail" TEXT NOT NULL,
  "selectedTier" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "messages" TEXT NOT NULL DEFAULT '[]',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "MarketplaceInquiry_advisorProfileId_fkey" FOREIGN KEY ("advisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MarketplaceInquiry_advisorId_status_idx" ON "MarketplaceInquiry"("advisorId", "status");
CREATE INDEX "MarketplaceInquiry_advisorProfileId_idx" ON "MarketplaceInquiry"("advisorProfileId");
