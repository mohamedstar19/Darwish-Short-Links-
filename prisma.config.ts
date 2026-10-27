import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Optional here so `prisma generate` (postinstall) works without a database;
  // migrate commands still need DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
