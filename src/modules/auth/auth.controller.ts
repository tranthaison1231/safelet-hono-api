import { auth } from '@/middlewares/auth';
import { zValidator } from '@hono/zod-validator';
import { Context, Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { AuthService, REFRESH_TOKEN_EXPIRE_IN } from './auth.service';
import {
  changePasswordDto,
  confirmEmailDto,
  forgotPasswordDto,
  resetPasswordDto,
  signInDto,
  signUpDto,
  updateProfileDto,
} from './dto/auth-payload.dto';
import { UnauthorizedException } from '@/utils/exceptions';
import jwt from 'jsonwebtoken';
import { PrismaModels } from '@/utils/prisma';

export const router = new Hono();

router
  .post('/sign-up', zValidator('json', signUpDto), async (c) => {
    const body = c.req.valid('json');
    await AuthService.signUp(body);
    return c.json(
      {
        message: 'Sign up successfully. Please check your email to verify your account.',
      },
      201
    );
  })
  .post('/forgot-password', zValidator('json', forgotPasswordDto), async (c) => {
    const body = c.req.valid('json');
    await AuthService.forgotPassword(body);
    return c.json(
      {
        message: 'Please check your email to reset your password.',
      },
      200
    );
  })
  .put('/verify-email', auth, async (c) => {
    const user = c.get('user') as PrismaModels['User'];
    await AuthService.verifyEmail(user);
    return c.json(
      {
        message: 'Please check your email to verify your account.',
      },
      200
    );
  })
  .post('/sign-in', zValidator('json', signInDto), async (c) => {
    const body = c.req.valid("json");
    const data = await AuthService.signIn(body);
    setCookie(c, 'refreshToken', data.refreshToken, {
      maxAge: REFRESH_TOKEN_EXPIRE_IN * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/api/refresh-token',
    });
    return c.json(data, 200);
  })
  .put('/confirm-email', auth, zValidator('json', confirmEmailDto), async (c) => {
    const user = c.get('user') as PrismaModels['User'];
    const body = c.req.valid('json');
    await AuthService.confirmEmail(user, body.code);
    c.json(
      {
        message: 'Verify email successfully.',
      },
      200
    );
  })
  .put('/verify-email', auth, async (c) => {
    const user = c.get('user') as PrismaModels['User'];
    await AuthService.verifyEmail(user);
    c.json(
      {
        message: 'Please check your email to verify your account.',
      },
      200
    );
  })
  .post('/reset-password', auth, zValidator('json', resetPasswordDto), async (c) => {
    const user = c.get('user') as PrismaModels['User'];
    const body = c.req.valid('json');
    await AuthService.resetPassword(body, user);
    return c.json(
      {
        message: 'Reset password successfully.',
      },
      200
    );
  })
  .get('/profile', auth, async (c) => {
    const user = c.get('user');
    c.json({ user: user }, 200);
  })
  .put('/profile', auth, zValidator('json', updateProfileDto), async (c) => {
    const user = c.get('user') as PrismaModels['User'];
    const body = c.req.valid('json');
    const updatedUser = await AuthService.updateProfile(body, user);
    c.json({ user: updatedUser }, 200);
  })
  .put('/refresh-token', async (c) => {
    const authHeader = c.req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const jwtObject = jwt.decode(token) as { userId: string };
    const userID = jwtObject?.userId;
    const refreshToken = getCookie(c, 'refreshToken');
    if (!userID || !refreshToken) throw new UnauthorizedException('Invalid token');
    const data = await AuthService.refreshToken(refreshToken, userID as string);
    setCookie(c, 'refreshToken', data.refreshToken, {
      maxAge: REFRESH_TOKEN_EXPIRE_IN * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/api/refresh-token',
    });
    c.json(data, 200);
  })
  .put('/change-password', auth, zValidator('json', changePasswordDto), async (c) => {
    const user = c.get('user') as PrismaModels['User'];
    const body = c.req.valid('json');
    await AuthService.changePassword(body, user);
    c.json(
      {
        message: 'Change password successfully.',
      },
      200
    );
  })
  .put('/logout', auth, async (c) => {
    deleteCookie(c, 'refreshToken');
    const user = c.get('user') as PrismaModels['User'];
    await AuthService.logout(user);
    c.json(
      {
        message: 'Logout successfully.',
      },
      200
    );
  });
