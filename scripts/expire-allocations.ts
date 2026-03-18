import { expireOverdueAllocations } from '@/lib/services/allocation-expiry-service';

async function main() {
  const result = await expireOverdueAllocations();
  console.log(`Expired allocations processed: ${result.expired}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
