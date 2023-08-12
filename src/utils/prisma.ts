import { PrismaClient, Prisma } from '@prisma/client';

type ModelNames = Prisma.ModelName;

export type PrismaModels = {
  [M in ModelNames]: Exclude<Awaited<ReturnType<PrismaClient[Uncapitalize<M>]['findUnique']>>, null>;
};

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  console.info(`Query took ${after - before}ms`);
  return result;
});

export default prisma;
