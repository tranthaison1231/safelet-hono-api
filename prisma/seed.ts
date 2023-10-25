import { companies } from './../src/modules/companies/companies.controller';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const companies = await prisma.company.deleteMany({});
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
