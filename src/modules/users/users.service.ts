import { UserUpdatedDto } from './dto/user-payload.dto';
import { UserModel } from './users.schema';

export class UserService {
  static async getAll(page = 1, limit = 10) {
    try {
      const items = await UserModel.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
      const total = await UserModel.countDocuments().exec();
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
      const user = await UserModel.findById(id).exec();
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async delete(id: string) {
    try {
      const user = await UserModel.findByIdAndDelete(id).exec();
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  static async updateBy(id: string, data: UserUpdatedDto) {
    try {
      const user = await UserModel.findByIdAndUpdate(id, data, {
        new: true,
      }).exec();
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
