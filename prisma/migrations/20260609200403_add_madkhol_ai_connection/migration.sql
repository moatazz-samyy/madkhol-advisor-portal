-- Add Madkhol AI Trading connection state to Advisor

ALTER TABLE "Advisor" ADD COLUMN "madkholAiConnectedAt" DATETIME;
ALTER TABLE "Advisor" ADD COLUMN "madkholAiEngagementLevel" TEXT;
