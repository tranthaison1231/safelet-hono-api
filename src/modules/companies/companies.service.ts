import { csvToJson } from '@/utils/csvToJson';
import prisma from '@/utils/prisma';
import { Parser } from '@json2csv/plainjs';
import { Prisma } from '@prisma/client';

export class CompanyService {
  static async getAll({ page = 1, limit = 10, q }) {
    try {
      const items = await prisma.company.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          name: {
            contains: q,
          },
        },
      });
      const total = await prisma.company.count({
        where: {
          name: {
            contains: q,
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

  static async create({ name, logo }) {
    try {
      return await prisma.company.create({
        data: {
          name,
          logo,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  static async updateBy(id, { name, logo }) {
    try {
      return await prisma.company.update({
        where: {
          id,
        },
        data: {
          name,
          logo,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await prisma.company.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async exportExcel() {
    try {
      const items = await prisma.company.findMany();
      const filename = 'companies';
      const fields = ['id', 'name', 'logo', 'updatedAt', 'createdAt'];
      const parser = new Parser({
        fields,
      });
      const data = parser.parse(items);
      return {
        filename,
        data,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async importExcel(buffer: ArrayBuffer) {
    try {
      const csvString = Buffer.from(buffer).toString();
      const companies = csvToJson<Prisma.CompanyCreateManyInput>(csvString);
      const items = await prisma.$runCommandRaw({
        insert: 'companies',
        ordered: false,
        documents: companies.map(({ id, ...company }) => company),
      });
      return items;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
