import { mailService } from '@/lib/mail.service';
import { redisService } from '@/lib/redis.service';
import { CLIENT_URL } from '@/utils/constants';
import { NotFoundException, UnauthorizedException } from '@/utils/exceptions';
import { comparePassword, hashPassword } from '@/utils/password';
import prisma, { PrismaModels } from '@/utils/prisma';
import { generateOpaqueToken } from '@/utils/token';
import { uuid } from '@/utils/uuid';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  UpdateProfileDto,
} from './dto/auth-payload.dto';

export const ACCESS_TOKEN_EXPIRE_IN = 60 * 60;
export const REFRESH_TOKEN_EXPIRE_IN = 60 * 60 * 24 * 30;

export class AuthService {
  static async signUp(signUpDto: SignUpDto) {
    const body: Partial<PrismaModels['User']> = signUpDto;
    const user = await prisma.user.findUnique({
      where: {
        email: signUpDto.email,
      },
    });
    if (user) throw new UnauthorizedException('Email already exists');
    const salt = bcrypt.genSaltSync(10);
    body.password = await hashPassword(signUpDto.password, salt);
    body.salt = salt;

    const newUser = await prisma.user.create({
      data: {
        firstName: signUpDto.firstName,
        lastName: signUpDto.lastName,
        email: signUpDto.email,
        phoneNumber: signUpDto.phoneNumber,
        password: body.password,
        salt: body.salt,
      },
    });
    const token = await this.createToken({ userId: newUser.id });
    const code = uuid();
    await this.sendEmailVerification({
      email: newUser.email,
      token,
      code,
    });
    return newUser;
  }

  static async verifyEmail(user: PrismaModels['User']) {
    try {
      const token = await this.createToken({ userId: user.id.toString() });
      const code = uuid();
      await redisService.set(`verify-email:${user.id}`, code, 'EX', 60 * 60 * 24);
      await this.sendEmailVerification({ email: user.email, token, code });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async confirmEmail(user: PrismaModels['User'], code: string) {
    try {
      const redisCode = await redisService.get(`verify-email:${user.id}`);
      if (redisCode !== code) throw new UnauthorizedException('Invalid code');
      redisService.del(`verify-email:${user.id}`);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          isVerified: true,
        },
      });
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
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Password does not match');
    const accessToken = await this.createToken({ userId: user.id });
    const refreshToken = await this.createRefreshToken({ userId: user.id });
    return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_EXPIRE_IN };
  }

  static async refreshToken(refreshToken: string, userID: string) {
    const redisRefreshToken = await redisService.get(`refresh-token:${userID}`);
    if (redisRefreshToken !== refreshToken) throw new UnauthorizedException('Invalid refresh token');
    const accessToken = await this.createToken({ userId: userID });
    const newRefreshToken = await this.createRefreshToken({ userId: userID });
    return { accessToken, refreshToken: newRefreshToken, expiresIn: ACCESS_TOKEN_EXPIRE_IN };
  }

  static async forgotPassword({ email }: ForgotPasswordDto) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });
      if (!user) throw new NotFoundException('User not found');
      const token = await this.createToken({ userId: user.id });
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

  static async resetPassword({ password }: ResetPasswordDto, user: PrismaModels['User']) {
    try {
      const newPassword = await hashPassword(password, user.salt);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: newPassword,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async changePassword({ newPassword, password }: ChangePasswordDto, user: PrismaModels['User']) {
    try {
      const isMatch = comparePassword(password, user.password);
      if (!isMatch) throw new UnauthorizedException('Password does not match');
      if (user.password === newPassword)
        throw new UnauthorizedException('New password must be different from old password');
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: newPassword,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static logout(user: PrismaModels['User']) {
    try {
      redisService.del(`jwt-secret:${user.id}`);
      redisService.del(`refresh-token:${user.id}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async updateProfile(
    { firstName, lastName, phoneNumber, avatarURL }: UpdateProfileDto,
    user: PrismaModels['User']
  ) {
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
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          avatarURL: user.avatarURL,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
