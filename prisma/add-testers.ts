/**
 * One-off script to add the first batch of tester advisors with random
 * passwords. Prints the credentials so they can be emailed out.
 *
 * Run with:
 *   export DATABASE_URL="<neon-connection-string>"
 *   npx tsx prisma/add-testers.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type TesterSeed = {
  email: string;
  name: string;
  nameAr: string;
  licenseNo: string;
};

const TESTERS: TesterSeed[] = [
  {
    email: "m.samy@madkhol.com",
    name: "Mohammed Samy",
    nameAr: "محمد سامي",
    licenseNo: "CMA-2026-T-9001",
  },
  {
    email: "satyan@madkhol.com",
    name: "Satyan",
    nameAr: "ساتيان",
    licenseNo: "CMA-2026-T-9002",
  },
  {
    email: "yasser@awraqholding.com",
    name: "Yasser (Awraq Holding)",
    nameAr: "ياسر (أوراق القابضة)",
    licenseNo: "CMA-2026-T-9003",
  },
  {
    email: "alshahrani.yasser@gmail.com",
    name: "Yasser Al-Shahrani",
    nameAr: "ياسر الشهراني",
    licenseNo: "CMA-2026-T-9004",
  },
  {
    email: "asem@alruhaily.com",
    name: "Asem Al-Ruhaily",
    nameAr: "عاصم الرحيلي",
    licenseNo: "CMA-2026-T-9005",
  },
  {
    email: "saudieconomist83@gmail.com",
    name: "Saudi Economist",
    nameAr: "الاقتصادي السعودي",
    licenseNo: "CMA-2026-T-9006",
  },
];

// Friendly random password: 10 chars from a safe alphabet (no 0/O/I/l/1).
function generatePassword(): string {
  const alphabet =
    "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function main() {
  console.log("\n→ Adding tester advisors to production Neon DB...\n");
  console.log("EMAIL                                  | PASSWORD     | NAME");
  console.log("─".repeat(80));

  for (const t of TESTERS) {
    // Skip if already exists (script can be re-run safely)
    const existing = await prisma.advisor.findUnique({
      where: { email: t.email },
    });
    if (existing) {
      console.log(
        `${t.email.padEnd(38)} | ${"(exists)".padEnd(12)} | ${t.name} — skipped`,
      );
      continue;
    }
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.advisor.create({
      data: {
        name: t.name,
        nameAr: t.nameAr,
        email: t.email,
        passwordHash,
        licenseNo: t.licenseNo,
        brandColor: "#0A2E1F",
      },
    });
    console.log(
      `${t.email.padEnd(38)} | ${password.padEnd(12)} | ${t.name}`,
    );
  }

  console.log("\n✓ Done. Email each tester their email + password.\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
