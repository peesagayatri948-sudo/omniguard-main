/**
 * AWS RDS PostgreSQL Schema Migration script for OmniGuard
 *
 * Reads all migration SQL scripts sequentially from supabase/migrations/
 * and runs them on your designated Amazon RDS PostgreSQL database instance.
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const host = process.env.RDS_HOST;
const user = process.env.RDS_USER || "postgres";
const password = process.env.RDS_PASSWORD;
const database = process.env.RDS_DB || "postgres";
const port = parseInt(process.env.RDS_PORT || "5432", 10);

if (!host || !password) {
  console.error("❌ Error: Missing RDS_HOST or RDS_PASSWORD in environment variables.");
  console.log("\nUsage instructions:");
  console.log("  $env:RDS_HOST=\"omniguard-rds.xxxx.us-east-1.rds.amazonaws.com\"");
  console.log("  $env:RDS_PASSWORD=\"yourSecurePassword\"");
  console.log("  node scripts/migrate-db-to-rds.js");
  process.exit(1);
}

const client = new Client({ host, user, password, database, port, ssl: { rejectUnauthorized: false } });

async function run() {
  console.log(`Connecting to AWS RDS Postgres database at ${host}:${port}...`);
  try {
    await client.connect();
    console.log("✓ Connected successfully.");

    const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort(); // Sort sequentially to preserve migration dependencies

    console.log(`Found ${files.length} SQL migrations files. Starting migration run...`);

    for (const file of files) {
      console.log(`\nExecuting migration: ${file}...`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      
      // Execute the migration transactionally
      await client.query("BEGIN");
      try {
        await client.query(sqlContent);
        await client.query("COMMIT");
        console.log(`✓ Migration completed: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`❌ Migration failed for: ${file}. Changes rolled back.`);
        throw err;
      }
    }

    console.log("\n=======================================================");
    console.log("✓ AWS RDS SCHEMA MIGRATION SUCCESSFUL!                 ");
    console.log("  All tables, roles, and RLS policies have been set up.");
    console.log("=======================================================");

  } catch (err) {
    console.error("❌ Migration process failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
