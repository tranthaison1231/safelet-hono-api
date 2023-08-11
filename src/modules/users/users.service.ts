import prisma from '@/utils/prisma';
import { UserUpdatedDto } from './dto/user-payload.dto';

export class UserService {
  static async getAll(page = 1, limit = 10) {
    try {
      const items = await prisma.users.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await prisma.users.count();
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
      const user = await prisma.users.findUnique({
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
      const user = await prisma.users.delete({
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
      const user = await prisma.users.update({
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
