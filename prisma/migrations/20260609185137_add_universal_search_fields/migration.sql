-- Add symbol, sector, marketCapSar to Fund for universal-search assets

ALTER TABLE "Fund" ADD COLUMN "symbol" TEXT;
ALTER TABLE "Fund" ADD COLUMN "sector" TEXT;
ALTER TABLE "Fund" ADD COLUMN "marketCapSar" REAL;

CREATE UNIQUE INDEX "Fund_symbol_key" ON "Fund"("symbol");
