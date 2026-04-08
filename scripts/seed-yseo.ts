import { seedYseoData } from "../src/lib/yseo/db-seed";

async function main() {
  const result = await seedYseoData();
  console.log(JSON.stringify({ status: "ok", seeded: result }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
