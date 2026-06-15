"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ASSETS_BY_SYMBOL } from "@/lib/universal-search/data";
import type { Asset } from "@/lib/universal-search/types";
import {
  setSearchPreferences,
  type SearchPreferences,
} from "@/lib/universal-search/preferences";

// ---- Save the advisor's Customize-panel preferences ----

export async function saveSearchPreferences(prefs: SearchPreferences) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  await setSearchPreferences(session.user.advisorId, prefs);
  revalidatePath(`/[locale]/search`, "page");
  return { ok: true };
}

// ---- Watchlist CRUD ------------------------------------------------------

async function requireAdvisorId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  return session.user.advisorId;
}

export async function createWatchlist(input: {
  name: string;
  nameAr?: string;
}): Promise<{ id: string }> {
  const advisorId = await requireAdvisorId();
  const name = input.name.trim();
  if (name.length < 1) throw new Error("Watchlist name is required.");
  if (name.length > 60) throw new Error("Watchlist name is too long.");
  const created = await prisma.watchlist.create({
    data: {
      advisorId,
      name,
      nameAr: input.nameAr?.trim() || null,
    },
    select: { id: true },
  });
  revalidatePath(`/[locale]/search`, "page");
  return { id: created.id };
}

export async function renameWatchlist(input: {
  id: string;
  name: string;
  nameAr?: string;
}): Promise<void> {
  const advisorId = await requireAdvisorId();
  const wl = await prisma.watchlist.findFirst({
    where: { id: input.id, advisorId },
    select: { id: true },
  });
  if (!wl) throw new Error("Watchlist not found.");
  await prisma.watchlist.update({
    where: { id: input.id },
    data: { name: input.name.trim(), nameAr: input.nameAr?.trim() || null },
  });
  revalidatePath(`/[locale]/search`, "page");
}

export async function deleteWatchlist(id: string): Promise<void> {
  const advisorId = await requireAdvisorId();
  const wl = await prisma.watchlist.findFirst({
    where: { id, advisorId },
    select: { id: true },
  });
  if (!wl) throw new Error("Watchlist not found.");
  // Cascade on WatchlistItem is set in schema → child rows go with it.
  await prisma.watchlist.delete({ where: { id } });
  revalidatePath(`/[locale]/search`, "page");
}

// ---- Asset notes --------------------------------------------------------

export async function upsertAssetNote(input: {
  symbol: string;
  body: string;
}): Promise<{ ok: true }> {
  const advisorId = await requireAdvisorId();
  const body = input.body.trim();
  if (!body) {
    // Empty body = delete (consistent with the "Save" button on an empty field
    // doing nothing destructive but allowing implicit cleanup).
    await prisma.assetNote.deleteMany({
      where: { advisorId, symbol: input.symbol },
    });
  } else {
    if (body.length > 1000) throw new Error("Note is too long (max 1000 chars).");
    await prisma.assetNote.upsert({
      where: { advisorId_symbol: { advisorId, symbol: input.symbol } },
      create: { advisorId, symbol: input.symbol, body },
      update: { body },
    });
  }
  revalidatePath(`/[locale]/search`, "page");
  return { ok: true };
}

export async function deleteAssetNote(symbol: string): Promise<void> {
  const advisorId = await requireAdvisorId();
  await prisma.assetNote.deleteMany({ where: { advisorId, symbol } });
  revalidatePath(`/[locale]/search`, "page");
}

// ---- Asset alerts -------------------------------------------------------

export type AlertMetric =
  | "priceDailyChangePct"
  | "ytdReturn"
  | "dividendYield"
  | "peRatio"
  | "lastPrice";

export type AlertOp = "lte" | "gte";

const ALERT_METRICS: AlertMetric[] = [
  "priceDailyChangePct",
  "ytdReturn",
  "dividendYield",
  "peRatio",
  "lastPrice",
];

export async function createAssetAlert(input: {
  symbol: string;
  metric: AlertMetric;
  op: AlertOp;
  threshold: number;
}): Promise<{ id: string }> {
  const advisorId = await requireAdvisorId();
  if (!ALERT_METRICS.includes(input.metric)) {
    throw new Error("Invalid metric.");
  }
  if (input.op !== "lte" && input.op !== "gte") {
    throw new Error("Invalid operator.");
  }
  if (!Number.isFinite(input.threshold)) {
    throw new Error("Invalid threshold.");
  }
  const created = await prisma.assetAlert.create({
    data: {
      advisorId,
      symbol: input.symbol,
      metric: input.metric,
      op: input.op,
      threshold: input.threshold,
      active: true,
    },
    select: { id: true },
  });
  revalidatePath(`/[locale]/search`, "page");
  revalidatePath(`/[locale]/dashboard`, "page");
  return { id: created.id };
}

export async function deleteAssetAlert(id: string): Promise<void> {
  const advisorId = await requireAdvisorId();
  const alert = await prisma.assetAlert.findFirst({
    where: { id, advisorId },
    select: { id: true },
  });
  if (!alert) throw new Error("Alert not found.");
  await prisma.assetAlert.delete({ where: { id } });
  revalidatePath(`/[locale]/search`, "page");
  revalidatePath(`/[locale]/dashboard`, "page");
}

export async function toggleAssetAlertActive(input: {
  id: string;
  active: boolean;
}): Promise<void> {
  const advisorId = await requireAdvisorId();
  const alert = await prisma.assetAlert.findFirst({
    where: { id: input.id, advisorId },
    select: { id: true },
  });
  if (!alert) throw new Error("Alert not found.");
  await prisma.assetAlert.update({
    where: { id: input.id },
    data: { active: input.active },
  });
  revalidatePath(`/[locale]/search`, "page");
  revalidatePath(`/[locale]/dashboard`, "page");
}

export async function toggleWatchlistItem(input: {
  watchlistId: string;
  symbol: string;
}): Promise<{ added: boolean }> {
  const advisorId = await requireAdvisorId();
  const wl = await prisma.watchlist.findFirst({
    where: { id: input.watchlistId, advisorId },
    select: { id: true },
  });
  if (!wl) throw new Error("Watchlist not found.");

  const existing = await prisma.watchlistItem.findUnique({
    where: {
      watchlistId_symbol: {
        watchlistId: input.watchlistId,
        symbol: input.symbol,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } });
    revalidatePath(`/[locale]/search`, "page");
    return { added: false };
  }
  await prisma.watchlistItem.create({
    data: { watchlistId: input.watchlistId, symbol: input.symbol },
  });
  revalidatePath(`/[locale]/search`, "page");
  return { added: true };
}

const USD_TO_SAR = 3.75;

// Upsert a Fund row for a universal-search asset so it can be referenced by
// Holdings, ModelPortfolios, Allocation Orders, etc.
async function upsertFundForAsset(asset: Asset) {
  const sarNav = asset.lastPrice * USD_TO_SAR;
  const marketCapSar = asset.marketCapUsd * 1_000_000_000 * USD_TO_SAR;

  return prisma.fund.upsert({
    where: { symbol: asset.symbol },
    create: {
      symbol: asset.symbol,
      nameEn: `${asset.symbol} — ${asset.nameEn}`,
      nameAr: `${asset.symbol} — ${asset.nameAr}`,
      assetClass: asset.assetClass === "stock" ? "equity" : asset.assetClass,
      region: asset.region === "us" ? "global" : asset.region,
      sector: asset.sector,
      currency: "USD",
      fundManager:
        asset.assetClass === "etf" ? "ETF Issuer" : "Listed Equity",
      marketCapSar,
      shariahCompliant: asset.shariahCompliant,
      shariahStatusReason: asset.shariahReason ?? null,
      lastKnownNav: sarNav,
      ytdReturn: asset.ytdReturn,
      fundFeeBps: asset.assetClass === "etf" ? 25 : 0,
    },
    update: {
      lastKnownNav: sarNav,
      ytdReturn: asset.ytdReturn,
      shariahCompliant: asset.shariahCompliant,
      shariahStatusReason: asset.shariahReason ?? null,
    },
  });
}

// ---- Add selected assets to a model portfolio ----

export async function addAssetsToModel(modelId: string, symbols: string[]) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const model = await prisma.modelPortfolio.findFirst({
    where: { id: modelId, advisorId },
  });
  if (!model) throw new Error("Model not found");

  const targets = JSON.parse(model.targetHoldings) as Record<string, number>;

  // Append each new asset at 1% from cash reserve. If we can't fit them all
  // (would exceed 99% allocation), scale existing weights proportionally to
  // make room.
  const newAssetCount = symbols.length;
  const newAllocation = newAssetCount;        // % we want to add
  const existingTotal = Object.values(targets).reduce((s, v) => s + v, 0);
  const target = 99;                          // 1% cash reserve
  const headroom = target - existingTotal;
  if (newAllocation > headroom) {
    // Scale existing down so the new ones fit
    const scaleFactor = (target - newAllocation) / Math.max(existingTotal, 0.01);
    for (const k of Object.keys(targets)) {
      targets[k] = +(targets[k] * scaleFactor).toFixed(2);
    }
  }

  let added = 0;
  for (const symbol of symbols) {
    const asset = ASSETS_BY_SYMBOL.get(symbol);
    if (!asset) continue;
    const fund = await upsertFundForAsset(asset);
    if (!targets[fund.id]) {
      targets[fund.id] = 1;
      added++;
    }
  }

  await prisma.modelPortfolio.update({
    where: { id: modelId },
    data: { targetHoldings: JSON.stringify(targets) },
  });

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "model_assets_added",
      entityType: "ModelPortfolio",
      entityId: modelId,
      payload: JSON.stringify({ symbols, added }),
    },
  });

  revalidatePath(`/[locale]/models`, "page");
  revalidatePath(`/[locale]/search`, "page");
  return { added };
}

// ---- Add selected assets to a client portfolio ----

const DEFAULT_HOLDING_SAR = 5000;

export async function addAssetsToClient(clientId: string, symbols: string[]) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const advisorId = session.user.advisorId;

  const client = await prisma.client.findFirst({
    where: { id: clientId, advisorId },
    include: { portfolio: true },
  });
  if (!client?.portfolio) throw new Error("Client or portfolio not found");

  let added = 0;
  for (const symbol of symbols) {
    const asset = ASSETS_BY_SYMBOL.get(symbol);
    if (!asset) continue;
    const fund = await upsertFundForAsset(asset);

    const existing = await prisma.holding.findFirst({
      where: { portfolioId: client.portfolio.id, fundId: fund.id },
    });
    const sarPerUnit = fund.lastKnownNav;
    const units = +(DEFAULT_HOLDING_SAR / sarPerUnit).toFixed(4);

    if (existing) {
      await prisma.holding.update({
        where: { id: existing.id },
        data: {
          units: existing.units + units,
          currentValue: existing.currentValue + DEFAULT_HOLDING_SAR,
        },
      });
    } else {
      await prisma.holding.create({
        data: {
          portfolioId: client.portfolio.id,
          fundId: fund.id,
          units,
          averageCost: sarPerUnit,
          currentValue: DEFAULT_HOLDING_SAR,
        },
      });
    }

    await prisma.transaction.create({
      data: {
        portfolioId: client.portfolio.id,
        fundId: fund.id,
        type: "buy",
        units,
        amountSar: DEFAULT_HOLDING_SAR,
        executedAt: new Date(),
        source: `universal_search`,
      },
    });

    await prisma.portfolio.update({
      where: { id: client.portfolio.id },
      data: { totalAumSar: { increment: DEFAULT_HOLDING_SAR } },
    });
    added++;
  }

  await prisma.auditLog.create({
    data: {
      advisorId,
      actionType: "client_assets_added",
      entityType: "Client",
      entityId: clientId,
      payload: JSON.stringify({ symbols, added }),
    },
  });

  revalidatePath(`/[locale]/clients`, "page");
  revalidatePath(`/[locale]/clients/${clientId}`, "page");
  revalidatePath(`/[locale]/search`, "page");
  return { added };
}
