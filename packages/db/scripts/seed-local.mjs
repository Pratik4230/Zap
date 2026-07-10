#!/usr/bin/env node
/**
 * Seed local D1 with mock links + clicks for development.
 * Usage (from repo root): pnpm --filter web db:seed
 * Optional: SEED_USER_ID=... pnpm --filter web db:seed
 */

import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../../..");
const WEB_DIR = join(REPO_ROOT, "apps/web");
const DOMAIN = "go.xaply.in";
const LINK_COUNT = 150;
const SEED_SLUG_PREFIX = "seed-";

const DESTINATIONS = [
  "https://github.com/xaply",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://vercel.com/docs",
  "https://developers.cloudflare.com/workers/",
  "https://x.com/home",
  "https://www.notion.so",
  "https://openai.com",
  "https://news.ycombinator.com",
  "https://www.producthunt.com",
  "https://tailwindcss.com/docs",
];

const TITLES = [
  "Product launch",
  "YouTube campaign",
  "Docs link",
  "Blog post",
  "Newsletter signup",
  "Instagram bio",
  "Conference talk",
  "Portfolio",
  "Job posting",
  "Release notes",
  "Beta invite",
  "Pricing page",
];

const LOCATIONS = [
  { country: "IN", city: "Mumbai" },
  { country: "IN", city: "Pune" },
  { country: "IN", city: "Bengaluru" },
  { country: "IN", city: "Delhi" },
  { country: "IN", city: "Hyderabad" },
  { country: "US", city: "New York" },
  { country: "US", city: "San Francisco" },
  { country: "US", city: "Austin" },
  { country: "GB", city: "London" },
  { country: "DE", city: "Berlin" },
  { country: "SG", city: "Singapore" },
  { country: "AE", city: "Dubai" },
  { country: "CA", city: "Toronto" },
  { country: "AU", city: "Sydney" },
  { country: "BR", city: "São Paulo" },
];

const DEVICES = ["mobile", "desktop", "tablet"];
const OS_OPTIONS = ["iOS", "Android", "Windows", "macOS", "Linux"];
const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge"];
const REFERRERS = [
  null,
  "https://twitter.com/",
  "https://www.google.com/",
  "https://www.linkedin.com/",
  "https://t.co/",
  "https://www.reddit.com/",
];

const STATUSES = ["active", "active", "active", "active", "paused", "expired"];

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

function randId(length = 21) {
  return randomBytes(length).toString("base64url").slice(0, length);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function runWranglerJson(command) {
  const out = execSync(`npx wrangler d1 execute zap-db --local --command ${JSON.stringify(command)} --json`, {
    cwd: WEB_DIR,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return JSON.parse(out);
}

function runWranglerFile(filePath) {
  execSync(`npx wrangler d1 execute zap-db --local --file=${JSON.stringify(filePath)}`, {
    cwd: WEB_DIR,
    stdio: "inherit",
  });
}

function resolveUserId() {
  if (process.env.SEED_USER_ID) return process.env.SEED_USER_ID;

  const result = runWranglerJson("SELECT id, email FROM user ORDER BY created_at ASC LIMIT 1;");
  const row = result[0]?.results?.[0];
  if (!row?.id) {
    throw new Error("No user found in local D1. Sign up locally first, or set SEED_USER_ID.");
  }
  console.log(`Seeding for user: ${row.email} (${row.id})`);
  return row.id;
}

function buildSeedSql(userId) {
  const now = Math.floor(Date.now() / 1000);
  const statements = [];

  statements.push(
    `DELETE FROM clicks WHERE link_id IN (SELECT id FROM links WHERE slug LIKE '${SEED_SLUG_PREFIX}%');`
  );
  statements.push(`DELETE FROM links WHERE slug LIKE '${SEED_SLUG_PREFIX}%';`);

  const links = [];
  const clickRows = [];

  for (let i = 0; i < LINK_COUNT; i++) {
    const id = randId();
    const slug = `${SEED_SLUG_PREFIX}${String(i + 1).padStart(3, "0")}-${randId(5)}`;
    const status = pick(STATUSES);
    const clickCount =
      status === "expired" ? randInt(20, 200) : status === "paused" ? randInt(0, 40) : randInt(5, 450);

    const createdAt = now - randInt(2, 90) * 86_400;
    const updatedAt = createdAt + randInt(0, 7) * 86_400;
    const expiresAt =
      status === "expired"
        ? now - randInt(1, 14) * 86_400
        : Math.random() < 0.2
          ? now + randInt(3, 60) * 86_400
          : null;
    const clickLimit = Math.random() < 0.15 ? clickCount + randInt(10, 100) : null;
    const passwordHash = Math.random() < 0.1 ? "pbkdf2_sha256$100000$c2VlZA$mock" : null;

    links.push({
      id,
      slug,
      status,
      clickCount,
      createdAt,
      updatedAt,
      expiresAt,
      clickLimit,
      passwordHash,
      title: `${pick(TITLES)} #${i + 1}`,
      destinationUrl: pick(DESTINATIONS),
    });

    for (let c = 0; c < clickCount; c++) {
      const daysAgo = randInt(0, 6);
      const hoursAgo = randInt(0, 23);
      const clickTs = now - daysAgo * 86_400 - hoursAgo * 3600 - randInt(0, 3599);
      const loc = pick(LOCATIONS);
      const device = pick(DEVICES);
      const os =
        device === "mobile"
          ? Math.random() < 0.55
            ? "Android"
            : "iOS"
          : pick(OS_OPTIONS);
      const referrer = pick(REFERRERS);

      clickRows.push({
        id: randId(),
        linkId: id,
        timestamp: clickTs,
        country: loc.country,
        city: Math.random() < 0.85 ? loc.city : null,
        device,
        os,
        browser: pick(BROWSERS),
        referrer,
      });
    }
  }

  for (const link of links) {
    statements.push(
      `INSERT INTO links (id, user_id, slug, domain, destination_url, title, password_hash, expires_at, click_limit, click_count, status, created_at, updated_at) VALUES (` +
        `'${link.id}', ` +
        `'${userId}', ` +
        `'${sqlEscape(link.slug)}', ` +
        `'${DOMAIN}', ` +
        `'${sqlEscape(link.destinationUrl)}', ` +
        `'${sqlEscape(link.title)}', ` +
        `${link.passwordHash ? `'${sqlEscape(link.passwordHash)}'` : "NULL"}, ` +
        `${link.expiresAt ?? "NULL"}, ` +
        `${link.clickLimit ?? "NULL"}, ` +
        `${link.clickCount}, ` +
        `'${link.status}', ` +
        `${link.createdAt}, ` +
        `${link.updatedAt}` +
        `);`
    );
  }

  const chunkSize = 100;
  for (let i = 0; i < clickRows.length; i += chunkSize) {
    const chunk = clickRows.slice(i, i + chunkSize);
    const values = chunk
      .map(
        (row) =>
          `('${row.id}', '${row.linkId}', ${row.timestamp}, '${row.country}', ` +
          `${row.city ? `'${sqlEscape(row.city)}'` : "NULL"}, ` +
          `'${row.device}', '${row.os}', '${row.browser}', ` +
          `${row.referrer ? `'${sqlEscape(row.referrer)}'` : "NULL"})`
      )
      .join(",\n");
    statements.push(
      `INSERT INTO clicks (id, link_id, timestamp, country, city, device, os, browser, referrer) VALUES\n${values};`
    );
  }

  return { sql: statements.join("\n"), linkCount: links.length, clickCount: clickRows.length };
}

function main() {
  const userId = resolveUserId();
  const { sql, linkCount, clickCount } = buildSeedSql(userId);
  const filePath = join(WEB_DIR, ".seed-local.sql");

  writeFileSync(filePath, sql, "utf8");
  console.log(`Generated ${linkCount} links and ${clickCount} clicks → ${filePath}`);

  try {
    runWranglerFile(filePath);
    console.log("Seed complete.");
  } finally {
    try {
      unlinkSync(filePath);
    } catch {
      // ignore
    }
  }
}

main();
