import mongoose, { HydratedDocument } from 'mongoose';

export enum UserRole {
  user = 'user',
  admin = 'admin',
}

export interface User {
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber: string;
  password: string;
  salt?: string;
  isVerified?: boolean;
  avatarURL?: string;
  role?: string;
}

const UserSchema = new mongoose.Schema<User>({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  salt: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  avatarURL: {
    type: String,
  },
  role: {
    type: String,
    enum: [UserRole.admin, UserRole.user],
    default: UserRole.user,
  },
});

UserSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.password;
    delete ret.salt;
    return ret;
  },
});

export type UserDocument = HydratedDocument<User>;
export const UserModel = mongoose.model('users', UserSchema);
