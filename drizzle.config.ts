import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

// DSQL auth tokens contain URL-reserved characters, so prefer the object form
// (host/user/password) over a connection URL when connecting to Aurora DSQL.
// Generate a token into DSQL_PASSWORD first:  export DSQL_PASSWORD=$(npm run -s db:token)
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DSQL_HOST ?? "",
        port: 5432,
        user: process.env.DSQL_USER ?? "admin",
        password: process.env.DSQL_PASSWORD ?? process.env.DSQL_AUTH_TOKEN ?? "",
        database: process.env.DSQL_DATABASE ?? "postgres",
        ssl: "require"
      }
});
