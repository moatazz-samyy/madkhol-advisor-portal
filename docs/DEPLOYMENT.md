# Madkhol Advisor Portal — Production Deployment Guide

Walkthrough for shipping the portal live so real advisors can test it.
**Time estimate:** 45–60 minutes the first time. Every change after that is `git push`.

The stack:
- **GitHub** — your source of truth
- **Neon** — managed Postgres (free)
- **Vercel** — hosts the Next.js app + handles deploys (free)

---

## Prerequisites

You'll need GitHub, Neon, and Vercel accounts. All free.

- GitHub: <https://github.com>
- Neon: <https://neon.tech> (sign in with GitHub for speed)
- Vercel: <https://vercel.com> (sign in with GitHub for speed)

---

## Step 1 — Push the code to GitHub

In a terminal at the project root:

```bash
git init
git add .
git commit -m "Initial deploy"
```

Then create a new **private** repo on GitHub (call it `madkhol-advisor-portal`),
copy the URL it gives you, and run:

```bash
git remote add origin <THE_URL_FROM_GITHUB>
git branch -M main
git push -u origin main
```

✓ The code is now on GitHub.

---

## Step 2 — Create the Postgres database on Neon

1. Go to <https://console.neon.tech> → **Create project**
2. Project name: `madkhol`
3. Region: pick **AWS — Frankfurt (eu-central-1)** for proximity to Saudi advisors
4. Postgres version: keep default (16)
5. Click **Create project**

Once the project is created, Neon shows a **Connection string** panel:

- Choose **Pooled connection** in the dropdown
- Copy the connection string. It looks like:
  `postgresql://neondb_owner:abc123...@ep-xyz-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`

✓ Save this string somewhere safe — it's your `DATABASE_URL`.

---

## Step 3 — Run the initial migration + seed against Neon

Back in your terminal at the project root:

```bash
# Point Prisma at the Neon DB for this one operation
export DATABASE_URL="<paste the Neon connection string here>"

# Generate the schema in Neon
npx prisma migrate deploy

# Seed the database (2 advisors, 20 clients, 50 funds, holdings, etc.)
npm run db:seed:all
```

If the migration succeeds you'll see `✓ Done`. If the seed succeeds you'll see
the summary line `✓ Marketplace seed complete: { advisors: 10, profiles: 10, inquiries: 4 }`.

✓ The database now contains the full demo dataset on Neon.

---

## Step 4 — Generate a NextAuth secret

In your terminal:

```bash
openssl rand -base64 32
```

Copy the output. That's your `NEXTAUTH_SECRET`. Save it next to the
`DATABASE_URL` for the next step.

---

## Step 5 — Deploy to Vercel

1. Go to <https://vercel.com/new>
2. **Import Git Repository** → pick the `madkhol-advisor-portal` repo
3. Vercel auto-detects Next.js. Don't change the build settings.
4. Expand **Environment Variables** and add these three (one at a time):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from Step 2 |
   | `NEXTAUTH_SECRET` | the openssl output from Step 4 |
   | `NEXTAUTH_URL` | leave blank for now — we'll fill it after the first deploy |

5. Click **Deploy**.

Vercel builds the app (~2 minutes). When it finishes you'll see a
**Visit** button with your live URL — something like
`https://madkhol-advisor-portal.vercel.app`.

✓ The site is live, but `NEXTAUTH_URL` still needs to be set.

---

## Step 6 — Set NEXTAUTH_URL and redeploy

1. In Vercel: **Project → Settings → Environment Variables**
2. Find `NEXTAUTH_URL`, click ✏️ Edit
3. Paste the URL Vercel gave you (e.g. `https://madkhol-advisor-portal.vercel.app`)
   — **no trailing slash**
4. Save
5. Go to **Deployments**, find the latest one, click the `⋯` menu →
   **Redeploy**

✓ Login now works on the live URL.

---

## Step 7 — Verify

Open your live URL and sign in:

- **`advisor1@madkhol.com`** · `demo123` → Saad's populated book
- **`advisor2@madkhol.com`** · `demo123` → Sara's fresher book

Walk to the dashboard, click a few clients, open Market Monitor — confirm
everything renders.

✓ You're live.

---

## Adding more advisors (so each tester has their own login)

Easiest path: edit `prisma/seed.ts` to add more advisor records, then re-run
the seed against the production database.

A simpler one-off pattern — open `prisma/add-advisor.ts` (create this file
with the snippet below), set your fields, then run:

```bash
export DATABASE_URL="<your Neon connection string>"
npx tsx prisma/add-advisor.ts
```

```ts
// prisma/add-advisor.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADVISORS = [
  { name: "Fahad Al-Sayed", nameAr: "فهد السيد",
    email: "fahad@example.com", password: "demo123",
    licenseNo: "CMA-2024-A-9001" },
  // ...add one entry per tester
];

(async () => {
  for (const a of ADVISORS) {
    const passwordHash = await bcrypt.hash(a.password, 8);
    await prisma.advisor.create({
      data: {
        name: a.name, nameAr: a.nameAr, email: a.email,
        passwordHash, licenseNo: a.licenseNo, brandColor: "#0A2E1F",
      },
    });
    console.log(`✓ ${a.email}`);
  }
})();
```

---

## Iterating after launch

Once live, every change is:

```bash
git add .
git commit -m "<short message>"
git push
```

Vercel auto-deploys on every push to `main`. ~2 minutes per deploy.

If you change the Prisma schema (`prisma/schema.prisma`), also run:

```bash
export DATABASE_URL="<Neon connection string>"
npx prisma migrate deploy
```

---

## Optional polish

- **Custom domain** (e.g. `portal.madkhol.sa`) — Vercel project → Settings →
  Domains → Add. Vercel walks you through DNS records. Update `NEXTAUTH_URL`
  after, then redeploy.
- **Live asset data** — set `FINNHUB_API_KEY` in Vercel env vars (free tier).
  The Search page automatically uses live quotes when this is set.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Login redirects to itself / errors | `NEXTAUTH_URL` is wrong or missing trailing slash. Edit it in Vercel and redeploy. |
| 500 on every page | `DATABASE_URL` is wrong. Test it: `psql "$DATABASE_URL" -c '\dt'` should list tables. |
| Build fails on Vercel | Check the build log for the actual error. Most common is missing env var. |
| Pages load but data is empty | The migration ran but the seed didn't. Re-run `npm run db:seed:all` with your DATABASE_URL. |

If you hit anything not on this list, screenshot the error and we'll debug it together.
