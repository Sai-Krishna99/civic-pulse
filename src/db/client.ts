import { DsqlSigner } from "@aws-sdk/dsql-signer";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cachedClient:
  | {
      client: ReturnType<typeof postgres>;
      key: string;
      expiresAt: number;
    }
  | undefined;

export async function getDb() {
  const options = await getConnectionOptions();

  if (!options) {
    return null;
  }

  const cacheKey =
    typeof options === "string"
      ? options
      : `${options.host}:${options.database}:${options.username}`;

  if (!cachedClient || cachedClient.key !== cacheKey || cachedClient.expiresAt < Date.now()) {
    await cachedClient?.client.end({ timeout: 1 });
    cachedClient = {
      client:
        typeof options === "string"
          ? postgres(options, { max: 3, prepare: false })
          : postgres({
              ...options,
              max: 3,
              prepare: false
            }),
      key: cacheKey,
      expiresAt: Date.now() + 50 * 60 * 1000
    };
  }

  return drizzle(cachedClient.client, { schema });
}

async function getConnectionOptions() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (!process.env.DSQL_HOST) {
    return null;
  }

  const region = process.env.DSQL_REGION ?? process.env.AWS_REGION ?? "us-east-1";
  const password =
    process.env.DSQL_AUTH_TOKEN ??
    (await new DsqlSigner({
      hostname: process.env.DSQL_HOST,
      region,
      expiresIn: 3600
    }).getDbConnectAdminAuthToken());

  return {
    host: process.env.DSQL_HOST,
    port: 5432,
    database: process.env.DSQL_DATABASE ?? "postgres",
    username: process.env.DSQL_USER ?? "admin",
    password,
    ssl: "require" as const
  };
}
