import { prisma } from '@/lib/prisma';
import { refreshNotifications } from '@/lib/services/notification-service';

async function main() {
  const result = await refreshNotifications();
  console.log(result);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
