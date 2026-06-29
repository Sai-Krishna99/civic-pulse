import { loadEnvConfig } from "@next/env";
import { DsqlSigner } from "@aws-sdk/dsql-signer";

// Print a short-lived Aurora DSQL admin auth token to stdout (nothing else),
// so it can be captured into an env var for drizzle-kit:
//   export DSQL_PASSWORD=$(npm run -s db:token)
//   npm run db:push
// Reads DSQL_HOST / DSQL_REGION / AWS_PROFILE from .env.local.

const noop = () => {};
const originalLog = console.log;
const originalInfo = console.info;
console.log = noop;
console.info = noop;
loadEnvConfig(process.cwd());
console.log = originalLog;
console.info = originalInfo;

async function main() {
  const host = process.env.DSQL_HOST;

  if (!host) {
    throw new Error("DSQL_HOST is required to generate a DSQL auth token.");
  }

  const region = process.env.DSQL_REGION ?? process.env.AWS_REGION ?? "us-east-1";

  const token = await new DsqlSigner({
    hostname: host,
    region,
    expiresIn: 3600
  }).getDbConnectAdminAuthToken();

  process.stdout.write(token);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
