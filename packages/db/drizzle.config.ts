import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "../../apps/web/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/298facb19d2e5d3a074b82712780a4d4569c7f1cfbeb46b660796c52aaff1bb2.sqlite",
  },
});
