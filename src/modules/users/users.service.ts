import prisma from '@/utils/prisma';
import { UserUpdatedDto } from './dto/user-payload.dto';

export class UserService {
  static async getAll({ page = 1, limit = 10, email, isVerified }) {
    try {
      const items = await prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          email: {
            contains: email,
          },
          isVerified: {
            equals: isVerified,
          },
        },
        include: {
          company: true,
          country: true,
        },
      });
      const total = await prisma.user.count({
        where: {
          email: {
            contains: email,
          },
          isVerified: {
            equals: isVerified,
          },
        },
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

  static async getBy(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async delete(id: string) {
    try {
      const user = await prisma.user.delete({
        where: {
          id,
        },
      });
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  static async updateBy(id: string, data: UserUpdatedDto) {
    try {
      const user = await prisma.user.update({
        where: {
          id,
        },
        data,
      });
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
