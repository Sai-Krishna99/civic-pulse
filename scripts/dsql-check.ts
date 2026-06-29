import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import { DsqlSigner } from "@aws-sdk/dsql-signer";

// Diagnostic: connect to Aurora DSQL and report which tables exist and their row counts.
//   npm run db:check

loadEnvConfig(process.cwd());

async function connect() {
  if (process.env.DATABASE_URL) {
    return postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  }

  const host = process.env.DSQL_HOST;
  if (!host) {
    throw new Error("Set DSQL_HOST (or DATABASE_URL) to check the database.");
  }

  const region = process.env.DSQL_REGION ?? process.env.AWS_REGION ?? "us-east-1";
  const password =
    process.env.DSQL_AUTH_TOKEN ??
    (await new DsqlSigner({ hostname: host, region, expiresIn: 3600 }).getDbConnectAdminAuthToken());

  return postgres({
    host,
    port: 5432,
    database: process.env.DSQL_DATABASE ?? "postgres",
    username: process.env.DSQL_USER ?? "admin",
    password,
    ssl: "require",
    max: 1,
    prepare: false
  });
}

const expected = [
  "providers",
  "service_capacities",
  "incoming_needs",
  "referrals",
  "routing_decisions",
  "provider_updates",
  "neighborhood_signals"
];

async function main() {
  const sql = await connect();

  try {
    console.log(`Connected to DSQL host: ${process.env.DSQL_HOST ?? "(DATABASE_URL)"}`);
    const rows = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
      where table_schema = 'public' order by table_name
    `;
    const present = new Set(rows.map((r) => r.table_name));
    console.log(
      `\nPublic tables found: ${rows.length === 0 ? "(none — database is empty)" : [...present].join(", ")}\n`
    );

    let totalRows = 0;
    for (const t of expected) {
      if (!present.has(t)) {
        console.log(`  ${t.padEnd(22)} MISSING`);
        continue;
      }
      const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from ${sql(t)}`;
      totalRows += count;
      console.log(`  ${t.padEnd(22)} ${count} rows`);
    }

    const allPresent = expected.every((t) => present.has(t));
    console.log(
      `\nSUMMARY: ${allPresent ? "all 7 tables present" : "schema NOT fully pushed"}; ${totalRows} total rows ${
        totalRows === 0 ? "(NOT seeded)" : "(seeded)"
      }`
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
