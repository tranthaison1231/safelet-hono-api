import prisma from '@/utils/prisma';

export class CountryService {
  static async getAll({ page = 1, limit = 10, q }) {
    try {
      const items = await prisma.country.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          name: {
            contains: q,
          },
        }
      });
      const total = await prisma.country.count({
        where: {
          name: {
            contains: q,
          },
        }
      });
      return {
        items,
        page,
        limit,
        total,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
