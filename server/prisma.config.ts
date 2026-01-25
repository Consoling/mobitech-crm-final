import { SYS_ENV } from "./src/utils/env";
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: SYS_ENV.DATABASE_URL!,
  },
});
