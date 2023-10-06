import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const companies = await prisma.user.updateMany({
    data: {
      companyID: '651fc43f2b5306887a2c71ab',
    },
  });
  console.log({ companies });
}

run()
  .catch((e) => {
    console.log(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
