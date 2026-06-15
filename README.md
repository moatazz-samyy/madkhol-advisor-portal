# Madkhol Advisor Portal — Demo MVP

CEO-facing prototype of the Saudi-native B2B platform for independent CMA-licensed investment advisors. This is **not** production. It is a high-fidelity, navigable demo with seeded data so the CEO and prospect advisors can experience the product end-to-end.

> **Build status:** All three product phases shipped.
> - Phase 1 (Spine): Login, Dashboard, Clients, Client Detail
> - Phase 2 (Tools): Allocation Order, Rebalance, Model Portfolios
> - Phase 3 (Differentiators): Shariah Dashboard, Zakat, Mirath, GOSI Gap, WhatsApp mock
> Operational placeholders (Billing, White-label, Reporting, Audit) remain as skeletons.

## Quick start

```bash
npm install
cp .env.example .env             # already created during scaffold
npx prisma migrate dev           # creates SQLite db
npm run db:seed                  # seeds advisors, clients, funds, holdings, alerts
npm run dev
```

Open <http://localhost:3000/ar/login>.

## Demo credentials

| Account | Role | Password |
| --- | --- | --- |
| `advisor1@madkhol.com` | **Saad Al-Otaibi** (سعد) — primary CEO walkthrough | `demo123` |
| `advisor2@madkhol.com` | **Sara Al-Dosari** (سارة) — secondary advisor | `demo123` |

When Saad logs in, the dashboard greets him as "صباح الخير، سعد".

## CEO walkthrough (current spine)

The full 10-step CEO story will be unlocked as later phases ship. The four screens currently delivered:

1. **Login** — bilingual, brand-gradient hero, demo creds visible.
2. **Dashboard** — greeting + four KPI cards (Total AuM, Total Clients, MTD P&L, YTD P&L), urgent alerts panel (Shariah drift / Zakat due / new clients), top 5 clients, last 10 transactions.
3. **Clients list** — sortable table, status + Shariah + Zakat-days badges, filters (status, Shariah, search), row actions.
4. **Client detail** — branded header (AuM, YTD, Hijri year-end, Suitability), 5 tabs:
   - **Portfolio** — allocation donut + holdings table with weight, value, drift, Shariah icon.
   - **Performance** — line chart vs TASI benchmark, 1M / 3M / YTD / 1Y / All periods.
   - **Activity** — full transaction history.
   - **Documents** — sample monthly statement + agreements (preview only).
   - **Notes** — advisor-private notes; add and delete supported.

Beyond the spine, the full 10-step CEO walkthrough is live:

5. **Allocation Order** at `/ar/allocation` — 6-step wizard, pro-rata / equal-SAR algorithms, Shariah warning banner, executes real transactions.
6. **Rebalance** at `/ar/rebalance` — pulls clients to a model, computes per-client trades & cash impact.
7. **Model Portfolios** at `/ar/models` — create / edit with 99% allocation + 1% cash reserve guard.
8. **Shariah Dashboard** at `/ar/shariah` — book-wide compliance %, drill into any flagged fund for replacements + affected clients, mark resolved.
9. **Zakat** at `/ar/zakat` — queue of clients near Hijri year-end → per-client calculator → generated report preview.
10. **Mirath** at `/ar/mirath` — Quranic share calculator across spouse + sons + daughters + parents, donut + per-heir SAR amount.
11. **GOSI Gap** at `/ar/gosi` — retirement projection, monthly gap, required corpus, suggested monthly contribution.
12. **WhatsApp** at `/ar/messages` — mock Business chat with pre-filled statement/Zakat/rebalance attachments; deep-linked from Client Detail "Send statement".

Operational screens (Billing, White-label, Reporting, Audit) are kept as polished placeholders so navigation feels real but is honest about scope.

## Bilingual + RTL

- Routes are locale-prefixed: `/ar/...` (Arabic, RTL, default) and `/en/...` (English, LTR).
- Language toggle in the topbar swaps locale and direction with no flash.
- Rubik font covers both scripts.
- Charts and tables mirror correctly in RTL.

## Reset demo data

```bash
npm run db:reset    # drops the database and re-runs migrations
npm run db:seed     # repopulates the seeded story
```

The seed is deterministic — every reset produces the same story.

## Project layout

```
prisma/
  schema.prisma           # Full 12-model schema (covers tools + differentiators)
  seed.ts                 # Coherent demo story
  seed-data/
    funds.ts              # 50 funds (Saudi + Global)
    clients.ts            # 20 clients across the two advisors
src/
  app/
    [locale]/
      (auth)/login        # Login (no app shell)
      (app)/              # App shell with sidebar + topbar (auth-gated)
        dashboard
        clients
          [id]            # Client detail with tabs
        allocation, rebalance, models, ...  # Coming-soon placeholders
    api/auth/[...nextauth]
  components/
    auth/, brand/, clients/, dashboard/, layout/, providers/
  i18n/                   # next-intl config + middleware
  lib/                    # prisma, auth, data accessors, formatting, cn
  types/                  # NextAuth augmentation
messages/
  ar.json, en.json
```

## Environment variables

See `.env.example`. Three required:

| Var | Local | Production |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` (SQLite) | Vercel Postgres connection string |
| `NEXTAUTH_SECRET` | demo value OK | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` | your Vercel URL |

For Postgres in production, change the Prisma datasource provider in `prisma/schema.prisma` from `sqlite` to `postgresql` and re-run `prisma migrate dev`.

## What's mocked (and stays mocked)

- **Nafath identity verification** — convincing screens, no real API.
- **Broker order execution** — `Transaction` records are simulated, no real trades.
- **WhatsApp Business API** — chat UI mocked.
- **PDF generation** — stub "report generated" → placeholder file.
- **Open Banking (ANB, SAMA)** — none.
- **Zakat regulatory submission** — report generation only.
- **Real-time market data** — uses seeded `last_known_nav` and `ytd_return`.
- **Fund manager names** — real (SNB Capital, Jadwa, Albilad, Wahed, Vanguard, iShares, etc.) but all NAV, YTD return, and AuM numbers are **demo values, not real performance**.

## Brand

Applied from `Brand Guidelines.pdf` and `Brand Identity.pdf`:

- **Palette:** Deep Green `#0A2E1F`, Madkhol gradient `#0C3D2E → #2BBE7E → #6BE07F`, Lime Pastel `#DCEFD0`, Cream `#F5F2E8`, Grey `#D9E0DD`.
- **Typography:** Rubik (Latin + Arabic). Pacifico reserved for the "expert guidance, *simplified*" emotive word on the marketing surfaces — not used inside product UI.
- **Voice:** friendly expert — supportive, never pushy. Reflected in empty states, success messages, and onboarding hints.

## Known limitations

- Prisma 7 was released too recently for a clean SQLite demo experience, so this project pins **Prisma 6**. When deploying to Postgres, the schema is forward-compatible.
- All clients' "drift" is computed against a synthetic equal-weight target until a model portfolio is assigned in the next phase.
- Performance chart synthesizes a daily series from the YTD return — there is no real time-series price store yet.
- Add Client / Nafath flow is sidebarred until the next phase.

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| **Spine** | Login + Dashboard + Clients + Client Detail + auth + DB + seed | ✓ shipped |
| **Tools** | Allocation Order, Rebalance, Model Portfolios | ✓ shipped |
| **Differentiators** | Shariah, Zakat, Mirath, GOSI Gap, WhatsApp mock | ✓ shipped |
| **Universal Asset Search** | US/global stocks + ETFs + funds with Shariah filter | ✓ shipped |
| **Portfolio Optimizer** | Mean-Variance, Risk Parity, Equal-Weight, Black-Litterman | ✓ shipped |
| **Sector Heatmap + Basket Trading** | M1-style 11-sector grid, drill-in stock lists, one-click sector buys | ✓ shipped |
| **Madkhol AI Trading connect surface** | Landing, connect flow, dashboard banner, stub suggestions | ✓ shipped (UI only — AI engine out of scope) |
| **Alpaca Model Portfolios** | US-only master models, client linking, per-client tweaks, sync notifications | ✓ shipped (mock Alpaca API) |
| **Performance Projections** | 10k-run Monte Carlo with correlated draws, fan chart, 24h cache | ✓ shipped (CMA disclaimer TODO) |
| **Certified Advisor Marketplace** | Consumer marketplace + advisor inquiries + profile editor + admin certs | ✓ shipped (vetting out of band; contracts Phase 2) |
| **Operational surfaces** | Audit Log + Reporting + Billing + White-label | ✓ shipped (no more skeleton) |

## Universal Asset Search

Route: `/ar/search` (or `/en/search`). Sidebar entry: **بحث الأصول / Search assets**.

Lets the advisor search US/global stocks, ETFs, and mutual funds, then add the selected ones to a model portfolio or directly to a client.

### Data source

- **Default — static demo dataset** (50 US-listed assets baked into [src/lib/universal-search/data.ts](src/lib/universal-search/data.ts)). Always-on, zero rate-limit risk, search responds in <1ms. Covers all 11 GICS sectors and includes a balanced mix of Shariah-compliant and non-compliant names so the toggle has visible effect.
- **Optional — Finnhub live adapter** ([src/lib/universal-search/finnhub.ts](src/lib/universal-search/finnhub.ts)). Set `FINNHUB_API_KEY` in `.env` to enable. Free tier: 60 req/min. Calls happen server-side with a 60s `fetch` cache to absorb burst traffic during the demo. The header pill in the Search page flips from "Demo data" to "Live (Finnhub)" when this is on.

**Why Finnhub:** evaluated against Alpha Vantage (25/day, too restrictive), IEX Cloud (paid-only since Aug 2024), Polygon (5/min, too restrictive), Twelve Data (8/min), and Yahoo unofficial (ToS risk). Finnhub's free tier is the most generous reliable option for a demo, with first-class symbol-search, quote, candle, and company-profile endpoints.

### Shariah compliance

- Static curated whitelist of 30 US-listed tickers at [src/lib/universal-search/shariah-compliant-assets.json](src/lib/universal-search/shariah-compliant-assets.json) — selected from constituents of major Shariah-screened ETFs (SPUS, HLAL, ISDU) plus standard sector exclusions.
- When the Shariah toggle is **ON** (default), only assets in this whitelist are returned.
- When **OFF**, non-compliant assets show with a red badge and the detail drawer surfaces the exclusion reason (interest-based revenue, debt ratio, primary-business exclusion, etc.).
- The list is a JSON file so you can edit/expand without a code change.

### Selection + add-to flows

- Each result row has a checkbox. Selection persists across filter and pagination changes.
- Sticky bottom bar shows the count and two CTAs:
  - **Add to model portfolio** — appends each selected asset at 1% weight, drawing from the cash reserve. If would exceed 99%, existing weights are scaled down proportionally.
  - **Add to client portfolio** — creates a holding of 5,000 SAR per asset, mirrors a corresponding `Transaction` of type `buy`, and increments the client's AuM. Audit-logged.
- Selected assets are upserted as `Fund` records (keyed by `symbol`) so they immediately become eligible for the existing Allocation Order, Rebalance, and Model Portfolios tools.

## Portfolio Optimizer

Route: `/ar/optimizer` (`/en/optimizer`). Sidebar: **تحسين المحفظة / Portfolio Optimizer**, in the Tools group.

Computes recommended weights across a chosen asset set, respecting locked Shariah + 1% cash policy plus optional sector caps and per-asset bounds. Four methods:

| Method | What it does | When to use |
| --- | --- | --- |
| **Mean-Variance (Markowitz)** | Interpolates between min-variance and max-Sharpe via the risk-tolerance slider | Default — balances return vs risk against the SAIBOR benchmark |
| **Risk Parity** | Iterative equal-risk-contribution; converges in ~10–20 steps | When the advisor wants no single asset dominating the risk budget |
| **Equal-Weight (1/N)** | Trivial 1/N over eligible assets | Honest baseline for comparing the others |
| **Black-Litterman** | Cap-weighted prior shrunk toward equal-weight by risk tolerance | Conservative tilt that won't deviate far from a market portfolio |

### Entry points

1. **Universal Asset Search** sticky selection bar → "Optimize" button → `/optimizer?source=search&symbols=A,B,C`
2. **Model Portfolios** card → Sliders icon → `/optimizer?source=model&id=...`
3. **Client Detail** header → "Optimize portfolio" → `/optimizer?source=client&id=...` (current weights pre-populated from holdings)

### Math

- **Historical returns:** 36 months of monthly returns per asset at [src/lib/optimizer/historical-data.json](src/lib/optimizer/historical-data.json), generated deterministically from a 3-factor model (market + sector + idiosyncratic). Realized stats are stored alongside for sanity checking.
- **Statistics:** annualized mean returns and a regularized (ridge `1e-4`) sample covariance matrix.
- **Mean-Variance:** closed form for both extremes:
  - Min-variance: w* ∝ Σ⁻¹ · 1
  - Max-Sharpe: w* ∝ Σ⁻¹ · (μ − r_f)
  - Result: `w = (1 − t)·w_minvar + t·w_maxsharpe`, t = risk tolerance ∈ [0, 1].
- **Risk Parity:** fixed-point iteration; starts from inverse-vol weights, multiplies by target/current RC ratio per step, renormalizes. 60-iter cap, 1e-4 convergence threshold.
- **Black-Litterman:** simplified — no advisor views, so the posterior recovers the market-cap-weighted prior, shrunk toward equal weight by `0.15 + (1 − t)·0.5` so the result diverges from a pure cap portfolio.
- **Long-only:** negative raw weights are clipped to zero before constraint projection (with a warning).
- **Sharpe:** `(μ_p − r_f) / σ_p`, annualized. Risk-free rate defaults to 4% (Saudi SAIBOR equivalent), advisor-editable in the config panel.

### Constraint projection

After the unconstrained optimum, the result is projected onto the feasible set by iteratively:

1. Clamping each weight to its `[min, max]` bound (or `[0, 99]` by default).
2. Redistributing the deficit/excess to other assets with headroom proportionally.
3. Scaling down any sector that breaches its cap, redistributing freed weight to non-capped sectors with room.

50-iteration cap, 0.01% tolerance. Infeasibility (e.g. per-asset minimums sum to > 99%) is detected up front and returned with a clear error message instead of a corrupt result.

### Apply flows

- **Model source:** replaces the model's `targetHoldings` JSON with the optimized weights. New symbols are upserted as `Fund` rows (same path the universal-search uses) so they become first-class in the rest of the app.
- **Client source:** computes target-value vs current-value per fund, generates buy/sell trades, executes through a fresh `RebalanceJob` — same machinery the existing Rebalance tool uses, so transactions, holdings, AuM, and audit log all line up.
- **Search source:** no automatic target; the result panel suggests the advisor open a model or client to apply.
- **Manual tweak:** "Tweak manually" opens the weights table for live editing with a sum guard (must equal 99%); Apply then writes the manual weights.

## Sector Heatmap + Basket Trading

Route: `/ar/sectors` (`/en/sectors`). Sidebar: **خريطة القطاعات / Sector Heatmap**, in the main group.

M1 Finance-style sector pie investing: visual grid of all 11 GICS sectors → click into any sector → buy a basket of its stocks in one action.

### Heatmap

- 4-column responsive grid, one tile per GICS sector (Tech, Healthcare, Financials, Consumer Discretionary, Consumer Staples, Communication, Industrials, Energy, Materials, Utilities, Real Estate).
- Tile color = today's cap-weighted change for that sector (green positive, red negative, intensity proportional to magnitude).
- Tile shows: name, today's %, YTD %, stock count, count of Shariah-compliant names within the sector.
- Classification source is a portable JSON map at [src/lib/sectors/sector-classification.json](src/lib/sectors/sector-classification.json) so an MSCI/FTSE feed can drop in without touching price data.

### Sector detail page

- Header with cap-weighted today's % + YTD % + stock count.
- **3 tabs:** Big movers today (top 10 by |today's %|), Top YTD gainers (top 10 by YTD), All stocks (full sorted list).
- Per-row checkboxes. **Shariah toggle** at top of the table, default ON. When ON, non-Shariah stocks are hidden. When OFF, they're visible but red-badged AND their checkboxes are disabled — `Select all` only ever selects compliant names.
- Each row: symbol, name, last price, today's %, YTD %, market cap, Shariah badge.

### Basket buy

Sticky bottom bar shows count + running estimated cost + investment amount input + allocation-method dropdown + two CTAs.

**Allocation methods:**
- **Equal weight** — investment / N per stock.
- **Market-cap weighted** — proportional to each stock's market cap.
- **Custom** — confirmation modal exposes editable per-stock % inputs that re-normalize to the total amount.

**Two CTAs:**
- **Buy selected** — only the checkboxed stocks.
- **One-Click Sector Buy** — every Shariah-compliant stock in the sector at the chosen method.

Confirmation modal previews the per-stock SAR breakdown before commit. On confirm, [executeBasketBuy](src/app/[locale]/(app)/sectors/actions.ts) creates a single `RebalanceJob` row + N `Transaction` rows (one per stock) + holding upserts + AuM increment + one `AuditLog` entry. Same path the Optimizer's apply-to-client uses, so basket buys show up in the existing client transaction history and audit feed without any parallel record type.

### Persistent client picker

A pill at the top of both the heatmap and sector detail pages exposes the active client. The selection persists across page navigation via `?client=<id>` in the URL (bookmarkable, survives reloads). Buy buttons disable with a "Pick a client first" hint when unset; trade defense-in-depth at the server boundary too.

### Out of scope (deliberate, per the prompt)

- Saudi sectors (TASI) — this phase is US-only.
- Real broker execution — every trade is simulated and written to the local DB.
- Real-time prices — 15-min delayed demo data; same Finnhub-or-static toggle the universal search uses.

## Madkhol AI Trading connect surface

Route: `/ar/madkhol-ai` (`/en/madkhol-ai`). Sidebar: **مدخول الذكي / Madkhol AI** with a green AI pill, sits at the end of the main nav group.

**This prompt shipped the marketing surface and connect flow only.** The actual ML/AI engine — model training, signal generation, broker execution — is out of scope and lives in a separate codebase. Everything below is the customer-facing skin around that future engine.

### What's live

- **Dashboard banner** at the top of `/dashboard`:
  - **Pre-connect** — full brand-gradient hero card with animated orbs, soft dot grid, the `bannerHeadline` + `bannerSubtext` + `Connect to Madkhol AI Trading` CTA + a link to the landing page.
  - **Post-connect** — quieter pale-green card: "Madkhol AI is connected. N suggestions pending review" + a "View suggestions" button.
- **Landing page** at `/madkhol-ai`:
  - **Hero** with brand-gradient background, two animated orbs, dot grid, AI pill, headline, subtitle, `Connect now` + `How it works` CTAs.
  - **How it works** — 3 numbered cards (Plug2 / Brain / ShieldCheck icons): one-click connect → continuous market analysis → you stay in control.
  - **What it does** — 4 feature cards: ML trade signals, S&P 500 benchmarking, real-time market analysis, Shariah filter built-in.
  - **Performance chart** — 12 months of mock Madkhol AI vs S&P 500, AI line solid green, S&P dashed grey. AI ends ~5.2% ahead. Header pill calls out the cumulative edge.
  - **FAQ** — 5 questions (safety, control, cost, Shariah, disconnect) as expandable rows; first one open by default.
  - **Bottom CTA** swaps to a connection summary + `Open suggestions` + `Disconnect` controls once connected.
- **Connect modal** — 3 steps + success state:
  1. **Terms & conditions** — scrollable demo legal text + agreement checkbox; Next disabled until checked.
  2. **Engagement level** — "Suggestions only" (default, locked on for the demo) + "Suggestions + auto-execute below SAR 10,000" (visually present, disabled with a `coming soon` lock badge per spec).
  3. **Confirm** — recap card.
  4. **Success** — animated brand-gradient checkmark, "Connected!" headline, links to Done / Open suggestions.
  Modal writes `madkholAiConnectedAt` + `madkholAiEngagementLevel` on the advisor row and emits an `AuditLog` entry.
- **Stub suggestions page** at `/madkhol-ai/suggestions`:
  - Header with pending count badge.
  - 4 mock cards (SPUS buy 50, NVDA buy 15, SPSK buy 120, LLY sell 8) — each with bilingual thesis, confidence meter (color-coded), client name, and Approve/Reject buttons.
  - **Buttons are intentional stubs** per the prompt — they flip the card to "Approved" / "Rejected" state locally without writing to the DB. Real wiring lands when the engine ships.
  - If the advisor isn't connected, the page shows a friendly "Connect Madkhol AI to start receiving suggestions" empty state with a back-link to the landing.

### Schema

Two nullable columns on `Advisor` track connection state — see migration `20260609200403_add_madkhol_ai_connection`:
```
madkholAiConnectedAt     DateTime?
madkholAiEngagementLevel String?    // "suggestions_only" | "auto_execute_below_10k"
```
Disconnect clears both.

### Out of scope (deliberate)

- The AI engine itself (model training, signal generation, scoring).
- Real broker execution of approved suggestions.
- Live performance feeds — the chart uses [src/lib/madkhol-ai/data.ts](src/lib/madkhol-ai/data.ts) mock data.
- Persisting Approve/Reject verdicts — local React state only.
- Auto-execute below SAR 10k — visually present, disabled, future phase.

## Alpaca Model Portfolios

Route: `/ar/alpaca-models` (`/en/alpaca-models`). Sidebar: **محافظ ألباكا / Alpaca Models** with a dark **α** badge in the Tools group, sits between Models and Optimizer.

Master model portfolios composed entirely of US-listed assets (stocks + ETFs) executable through the Alpaca API. **Separate from Generic Models** (the existing broker-agnostic feature) — both pages cross-link in a section header so the distinction is visible at a glance.

### What's live

- **List page** with create CTA, per-model cards showing name, version, # holdings, # linked clients, total linked AuM, pending-sync count, last synced timestamp.
- **Create / Edit modal** restricted to:
  - **Alpaca-tradeable universe only** — pulled from `getTradeableAssets()` in the mock layer (US equities + ETFs).
  - **Shariah-compliant only** — locked filter, advisor cannot save weights into non-compliant tickers.
  - **99% allocation + 1% cash reserve** — enforced server-side, friendly error if violated.
  - **Version bumps on save** — every edit that mutates `targetHoldings` increments the model's `version`.
- **Link clients flow** — multi-select modal on the model detail page. Each linked client starts at `lastSyncedVersion = 0` so they're immediately marked pending against the master.
- **Sync notifications** — derived from `master.version > link.lastSyncedVersion`. No separate notification table; no auto-propagation. Triggers:
  - **Dashboard banner** ("N clients pending sync to {model name}") when any model has pending links.
  - Per-model card warning chip on `/alpaca-models`.
  - Per-link status pill on the model detail page.
  - The amber `α` pill on the client detail "Alpaca model link" section.
- **Sync review page** at `/alpaca-models/[id]/sync` — one expanded card per pending client showing:
  - Master version delta (v_before → v_after).
  - **Current vs effective target** per symbol (after applying tweaks), with Δ column.
  - **Required trades** (buy/sell, SAR amount), sorted with sells first to free cash before buys.
  - Net cash impact pill (green = freeing cash, red = consuming cash).
  - Per-row **Approve** button + **Approve all** in the header.
- **Approval execution** — each approval routes through a fresh `RebalanceJob` + per-trade `Transaction` rows + holding upserts (same path the Optimizer's apply-to-client uses). Each trade hits the mock Alpaca `placeOrder` first, then the DB writes. Bumps `lastSyncedVersion` + `lastSyncedAt` on the link. Audit-logged.

### Per-client tweaks

A "tweak" is an explicit per-symbol override of two kinds:

- **Excluded** — drop the symbol entirely from this client's effective target.
- **Override weight** — pin the symbol's weight at a fixed % regardless of what the master says.

Stored as JSON on the `AlpacaModelLink.tweaks` column:

```json
{ "excluded": ["AAPL"], "overrides": { "MSFT": 12 } }
```

The resolver in [src/lib/alpaca-models/sync.ts](src/lib/alpaca-models/sync.ts) takes the master targets + tweaks and produces the client's effective target:

1. Drop excluded symbols.
2. Pin override weights.
3. Distribute the remaining budget proportionally to the surviving master weights.

This means **master changes flow through to non-tweaked symbols on every sync, while tweaked symbols are preserved across syncs** — exactly what the prompt asks for.

Tweaks are edited from the client detail page: each linked client gets a green/amber "Alpaca model link" card with a **Customize** button → modal with checkbox-to-exclude + per-symbol weight input per master holding.

### Mock Alpaca layer

[src/lib/alpaca-mock.ts](src/lib/alpaca-mock.ts) ships these stubs:

| Function | What it returns | Production swap |
| --- | --- | --- |
| `getTradeableAssets()` | US-listed stocks + ETFs from the existing universe | `alpaca.getAssets({ status: "active", tradable: true })` |
| `getAccountStatus(clientId)` | `{ status, buyingPower, cash, ... }` from a seeded hash | `alpaca.getAccount()` per linked account |
| `placeOrder({ symbol, qty, side, type, tif })` | Synthetic fill at the asset's `lastPrice` | `alpaca.createOrder(...)` + websocket fill |
| `isAlpacaTradeable(symbol)` | Boolean — used by the model editor to gate the picker | Same check via the assets endpoint |

All four are pure / synchronous-feeling — they resolve immediately so the demo never hangs and Alpaca's rate limit is irrelevant. To swap in real Alpaca, replace this single file with `@alpacahq/alpaca-trade-api` calls; the function signatures are designed to match.

### Schema

Two new tables — migration `20260609201715_add_alpaca_models`:

```
AlpacaModel        id, advisorId, name, nameAr, description, targetHoldings (JSON),
                   version, lastSyncedAt, createdAt, updatedAt
AlpacaModelLink    id, alpacaModelId, clientId, tweaks (JSON),
                   lastSyncedVersion, lastSyncedAt, createdAt
                   UNIQUE(alpacaModelId, clientId)
```

Sync state is **derived**, not stored: `pending = master.version > link.lastSyncedVersion`. No separate notification table → no consistency drift.

## Performance Projections

Route: `/ar/projections` (`/en/projections`). Sidebar: **توقعات الأداء / Projections** at the bottom of the Tools group with a line-chart icon.

10,000-run Monte Carlo projecting portfolio value forward over 6 mo / 1 yr / 5 yr / 10 yr, surfaced as a probability fan rather than a point estimate. Three entry points carry the subject through the URL:

| Entry point | Button | Carries |
| --- | --- | --- |
| Client detail header | "Project performance" | `?subject=client_portfolio&id=<clientId>` |
| Generic Models card | Chart icon | `?subject=model_generic&id=<modelId>` |
| Alpaca Model detail header | "Project performance" | `?subject=model_alpaca&id=<modelId>` |

### Methodology

- **Returns:** annualized monthly mean μ and covariance Σ computed from the existing 36-month [historical-data.json](src/lib/optimizer/historical-data.json). For holdings without historical data (typically Saudi seed funds from Phase 1), the engine falls back to **asset-class defaults**:

  | Class | Default μ | Default σ |
  | --- | --- | --- |
  | Equity / Stock | 12% | 22% |
  | ETF | 10% | 15% |
  | Sukuk | 4% | 6% |
  | MMF | 4% | 3% |
  | REIT | 8% | 18% |
  | Commodities | 6% | 18% |

  Defaults are documented per-asset in the projection diagnostics so the advisor sees which holdings used them.

- **Correlated draws:** Cholesky decomposition `L = chol(Σ + λI)` with `λ = 1e-4`. Per month, per run, we draw `z ~ N(0,1)^n` and emit `r = μ_mo + L · z`. Assets without historical data get independent draws with class-default σ.

- **Compounding:** monthly returns are applied to per-asset balances which are rebalanced back to starting weights at the start of each month. Contributions and withdrawals settle end-of-month against the total.

- **Inflation:** 3% annual Saudi inflation as the "beat inflation" benchmark; rendered as a dashed grey reference line on the fan chart.

- **Reproducibility:** seeded mulberry32 PRNG. Seed is derived deterministically from the scenario inputs (subject, horizon, contributions, withdrawals, CI), so identical inputs → identical results. Documented in the disclaimer footer.

- **Performance:** 10y × 10k runs × 5 assets benchmarks at ~600 ms locally (see [scripts/test-projection.ts](scripts/test-projection.ts)). The "complete in < 3s for a 10-asset portfolio" criterion holds with a wide margin.

### Cache

Each run persists to `ProjectionRun` (migration `20260609203523_add_projection_run`) with the scenario inputs as the cache key. Re-running an identical scenario within 24 h returns the cached run instead of recomputing. The History panel on the scenario sidebar lists the last 8 runs for the current subject — click any row to reload its results without re-running.

### Disclaimer

Placeholder copy lives in the `projections.disclaimerBody` i18n key and is marked **`[TODO: CMA-approved disclaimer copy pending compliance sign-off]`**. Replace with the final approved text once compliance signs off. The disclaimer is rendered on every projection result panel, no exceptions.

### Out of scope (deliberate)

- Tax modeling — KSA has no individual capital gains tax.
- Currency hedging models.
- Stress testing against specific scenarios (e.g., 2008 repeat) — deferred to a later phase.
- Real CMA disclaimer copy — the TODO above is the explicit handoff.

## Certified Advisor Marketplace

Two surfaces sharing one codebase, sitting on top of the new `AdvisorProfile` + `MarketplaceInquiry` tables.

### Consumer side (public, no auth)

- **`/ar/consumer/marketplace`** (or `/en/...`) — 10-card grid of certified advisors. Filter by specialization, language, max fee, min experience. Search-by-name. Cream-toned `(consumer)` route group with its own `layout.tsx` — no advisor sidebar/topbar, simple Madkhol logo header + "Are you an advisor?" link to `/login`.
- **`/ar/consumer/advisor/[id]`** — full profile with brand-gradient hero, AuM / client count / fee / languages stats, bio, multi-paragraph philosophy, specialization tags, sticky tier selector (Full discretionary / Advice only [recommended] / Hybrid), and a **Request a meeting** CTA that opens a 3-field modal (name + email + topic) and creates a `MarketplaceInquiry` row via the `createInquiry` server action (no auth required).
- Inquiry success state: "Request sent. {Advisor} will respond within 48 hours."

### Advisor side (inside the existing portal)

Sidebar adds a **Marketplace** section with three entries:

- **`/ar/marketplace/inquiries`** — list/thread split view. Per-row status pill (New / Replied / Booked / Closed). Click a row → conversation thread (WhatsApp-style). User names are partially masked (`Mohammed Al-Sabah` → `Mohammed A.`) per `maskUserName()` in [config.ts](src/lib/marketplace/config.ts). Three actions per inquiry: **Reply** (appends a message + flips status to `replied`), **Schedule meeting** (appends a system message + flips to `booked`), **Decline politely** (appends a polite closing + flips to `closed`).
- **`/ar/marketplace/profile`** — editor for the advisor's public marketplace card + full profile. Bilingual bio, bilingual philosophy, multi-select specializations (15 keys) and languages (6 keys), photo URL, years of experience, fee structure + bps. Top toggle: **Visible to users** (pause visibility without losing the data). **Preview** button opens the consumer profile in a new tab.
- **`/ar/admin/marketplace/certifications`** — admin-only stub showing all profiles split by status (Pending / Certified / Suspended) plus internal ratings (0–5 stars) and inquiry counts. The page footer carries a one-liner stating internal ratings are NOT exposed publicly, per Saudi defamation-law caution.

### Seed data

10 advisors total — 8 new ones seeded via [prisma/seed-marketplace.ts](prisma/seed-marketplace.ts) + the existing Saad and Sara getting marketplace profiles. AuM ranges from SAR 24M (Bandar, beginner-investor focus) to SAR 480M (Ahmed, family offices). Specializations span retirement, Shariah, ETF, Mirath, women clients, expat clients, healthcare/tech professionals, beginners — wide enough to demo all 5 filters.

4 inquiries pre-seeded against Saad's profile in 4 distinct states (New, Replied, Booked, Closed) so his Inquiries dashboard demos with content from minute zero.

Run with:

```bash
npx tsx prisma/seed-marketplace.ts
```

Idempotent — wipes existing marketplace rows + the 8 new advisors before re-seeding.

### Vetting model

- `AdvisorProfile.certificationStatus` ∈ `pending | certified | suspended`. Only **`certified` + `visible`** profiles appear on the consumer marketplace.
- Vetting (CMA license check + Madkhol internal review) happens **out of band** — there is no UI flow for the certification process itself per the spec. The admin page is a tracking dashboard, not a workflow tool.
- Newly-created profiles default to `pending`. Saved profiles update via `saveMarketplaceProfile`; only the seed or a manual SQL update flips them to `certified`.

### Fee + liability model

Documented in [src/lib/marketplace/config.ts](src/lib/marketplace/config.ts) and inline action comments — **not wired to billing yet**:

```ts
MARKETPLACE_CUT_BPS = 15           // 0.15% of the advisor's AuM fee
MARKETPLACE_CUT_BPS_RANGE = { min: 10, max: 20 }   // per-cohort negotiation
RESPONSE_SLA_HOURS = 48
```

- Marketplace is **free for retail users**.
- Madkhol takes the cut from the advisor's AuM fee, not from the user.
- The relationship is **contractual between advisor and user** — Madkhol just makes the introduction. Contract signing is **Phase 2**, no UI yet.
- Liability for the investment relationship is between the two contracting parties; there is **no claim against Madkhol** for advisor performance.

### Reviews + ratings

- **No public review system** in this phase (Saudi defamation-law caution per spec).
- Internal ratings live on `AdvisorProfile.internalRating` (0–5) and `AdvisorProfile.internalNotes`. Surfaced on the admin certifications page only, never on consumer routes.

### Photo strategy

Initials avatars on brand-gradient backgrounds (same pattern as everywhere else in the app — no external image hosts, offline-safe). The profile editor exposes a `photoUrl` field for production swap; when populated, the cards/profile render the actual image instead of initials.

### Production swap to Alpaca

Replace `src/lib/universal-search/finnhub.ts` with an Alpaca adapter — the surface stays the same (`fetchLiveQuote`, `fetchLiveCandles`). Endpoint mapping:

| Operation | Finnhub | Alpaca Market Data v2 |
| --- | --- | --- |
| Symbol search | `/search?q=` | `/v1/symbols/lookup` (Alpaca Broker API) |
| Quote / snapshot | `/quote?symbol=` | `/v2/stocks/{symbol}/snapshots` |
| Daily candles | `/stock/candle?resolution=D` | `/v2/stocks/{symbol}/bars?timeframe=1Day` |
| Company profile | `/stock/profile2?symbol=` | `/v2/stocks/{symbol}/asset` |

Replace the `FINNHUB_API_KEY` env var with `ALPACA_API_KEY_ID` + `ALPACA_API_SECRET_KEY` and swap the Bearer header for Alpaca's two-header auth. Caching behavior stays the same.

## Notes on the Mirath calculator

The Quranic share logic in `src/lib/mirath.ts` covers the common nuclear-family case the prompt asks for: spouse + sons + daughters + parents. It implements:

- Husband 1/2 or 1/4, Wife 1/4 or 1/8 (depending on children)
- Father 1/6 fardh with children; 1/6 + residuary if no children
- Mother 1/6 with children; 1/3 otherwise
- Sons + daughters take the residuary 2:1; daughters alone get 1/2 (one) or 2/3 (multiple)

What's deliberately **not** modelled (out of scope for a one-screen demo): grandparents, siblings, Awl/Radd corrections, Umariyyatan, kalalah, mushtarakah cases. The calculator's output is honest about this — the rationale column cites the basis for each share.

## Notes on the GOSI calculator

`src/components/differentiators/GosiPlanner.tsx` uses a simplified GOSI formula: 40% of trailing salary at retirement, inflated at 2.5% annually. Real GOSI uses a tiered formula with contribution years and last-36-month average; the demo number is in the right ballpark for retirement-gap conversations but is not a regulatory projection.

