import { z } from 'zod';

export const signUpDto = z.object({
  firstName: z
    .string({
      required_error: 'First Name is required',
    })
    .min(2)
    .max(255),
  lastName: z
    .string({
      required_error: 'Last Name is required',
    })
    .min(2)
    .max(255),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Email is not valid. Please provide a valid email address.'),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(4),
  phoneNumber: z
    .string({
      required_error: 'PhoneNumber is required',
    })
    .min(10),
});

export type SignUpDto = z.infer<typeof signUpDto>;

export const signInDto = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Email is not valid. Please provide a valid email address.'),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(4),
});

export type SignInDto = Required<z.infer<typeof signInDto>>;

export const forgotPasswordDto = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Email is not valid. Please provide a valid email address.'),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;

export const resetPasswordDto = z.object({
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(4),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;

export const confirmEmailDto = z.object({
  code: z.string({
    required_error: 'Code is required',
  }),
});

export const updateProfileDto = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  avatarURL: z.string().url('Avatar URL is not valid. Please provide a valid URL.').optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileDto>;

export const refreshTokenDto = z.object({
  refreshToken: z.string({
    required_error: 'Refresh Token is required',
  }),
});

export type RefreshTokenDto = Required<z.infer<typeof refreshTokenDto>>;

export const changePasswordDto = z.object({
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(4),
  newPassword: z
    .string({
      required_error: 'New Password is required',
    })
    .min(4),
});

export type ChangePasswordDto = z.infer<typeof changePasswordDto>;
