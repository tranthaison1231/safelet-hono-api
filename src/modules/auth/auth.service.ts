import { mailService } from '@/lib/mail.service';
import { redisService } from '@/lib/redis.service';
import { CLIENT_URL } from '@/utils/constants';
import { NotFoundException, UnauthorizedException } from '@/utils/exceptions';
import { comparePassword, hashPassword } from '@/utils/password';
import { generateOpaqueToken } from '@/utils/token';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserDocument, UserModel } from '../users/users.schema';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  UpdateProfileDto,
} from './dto/auth-payload.dto';
import { uuid } from '@/utils/uuid';

export const ACCESS_TOKEN_EXPIRE_IN = 60;
export const REFRESH_TOKEN_EXPIRE_IN = 60 * 60 * 24 * 30;

export class AuthService {
  static async signUp(signUpDto: SignUpDto) {
    const body: Partial<User> = signUpDto;
    const user = await UserModel.findOne({ email: signUpDto.email }).exec();
    if (user) throw new UnauthorizedException('Email already exists');
    const salt = bcrypt.genSaltSync(10);
    body.password = await hashPassword(signUpDto.password, salt);
    body.salt = salt;

    const newUser = await UserModel.create(body);
    const token = await this.createToken({ userId: newUser._id.toString() });
    const code = uuid();
    await this.sendEmailVerification({
      email: newUser.email,
      token,
      code,
    });
    return newUser;
  }

  static async verifyEmail(user: UserDocument) {
    try {
      const token = await this.createToken({ userId: user._id.toString() });
      const code = uuid();
      await redisService.set(`verify-email:${user._id}`, code, 'EX', 60 * 60 * 24);
      await this.sendEmailVerification({ email: user.email, token, code });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async confirmEmail(user: UserDocument, code: string) {
    try {
      const redisCode = await redisService.get(`verify-email:${user._id}`);
      if (redisCode !== code) throw new UnauthorizedException('Invalid code');
      user.isVerified = true;
      redisService.del(`verify-email:${user._id}`);
      await user.save();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async sendEmailVerification({ email, token, code }: { email: string; token: string; code }) {
    try {
      await mailService.sendMail({
        to: email,
        subject: 'Verify Email',
        html: `<p>Click <a href="${CLIENT_URL}/verify-email?token=${token}&code=${code}">here</a> to verify your email.</p>`,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async createToken({ userId }: { userId: string }) {
    let jwtSecret = await redisService.get(`jwt-secret:${userId}`);
    if (!jwtSecret) {
      jwtSecret = uuid();
      await redisService.set(`jwt-secret:${userId}`, jwtSecret, 'EX', ACCESS_TOKEN_EXPIRE_IN);
    }
    return jwt.sign({ userId }, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRE_IN });
  }

  static async createRefreshToken({ userId }: { userId: string }) {
    const refreshToken = generateOpaqueToken();
    await redisService.set(`refresh-token:${userId}`, refreshToken, 'EX', REFRESH_TOKEN_EXPIRE_IN);
    return refreshToken;
  }

  static async signIn({ email, password }: SignInDto) {
    const user = await UserModel.findOne({ email: email }).exec();
    if (!user) throw new NotFoundException('User not found');
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Password does not match');
    const accessToken = await this.createToken({ userId: user._id.toString() });
    const refreshToken = await this.createRefreshToken({ userId: user._id.toString() });
    return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_EXPIRE_IN };
  }

  static async refreshToken(refreshToken: string, userID: string) {
    const redisRefreshToken = await redisService.get(`refresh-token:${userID}`);
    if (redisRefreshToken !== refreshToken) throw new UnauthorizedException('Invalid refresh token');
    const accessToken = await this.createToken({ userId: userID.toString() });
    const newRefreshToken = await this.createRefreshToken({ userId: userID.toString() });
    return { accessToken, refreshToken: newRefreshToken, expiresIn: ACCESS_TOKEN_EXPIRE_IN };
  }

  static async forgotPassword({ email }: ForgotPasswordDto) {
    try {
      const user = await UserModel.findOne({ email: email }).exec();
      if (!user) throw new NotFoundException('User not found');
      const token = await this.createToken({ userId: user._id.toString() });
      await mailService.sendMail({
        to: user.email,
        subject: 'Reset Password',
        html: `<p>Click <a href="${CLIENT_URL}/reset-password?token=${token}">here</a> to reset your password.</p>`,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async resetPassword({ password }: ResetPasswordDto, user: UserDocument) {
    try {
      user.password = await hashPassword(password, user.salt);
      await user.save();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static changePassword({ newPassword, password }: ChangePasswordDto, user: UserDocument) {
    try {
      const isMatch = comparePassword(password, user.password);
      if (!isMatch) throw new UnauthorizedException('Password does not match');
      if (user.password === newPassword)
        throw new UnauthorizedException('New password must be different from old password');
      user.password = newPassword;
      return user.save();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static logout(user: UserDocument) {
    try {
      redisService.del(`jwt-secret:${user._id}`);
      redisService.del(`refresh-token:${user._id}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async updateProfile({ firstName, lastName, phoneNumber, avatarURL }: UpdateProfileDto, user: UserDocument) {
    try {
      if (firstName) {
        user.firstName = firstName;
      }
      if (lastName) {
        user.lastName = lastName;
      }
      if (phoneNumber) {
        user.phoneNumber = phoneNumber;
      }
      if (avatarURL) {
        user.avatarURL = avatarURL;
      }
      return await user.save();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
