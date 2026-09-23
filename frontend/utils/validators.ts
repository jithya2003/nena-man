/**
 * nena-man · frontend/utils/validators.ts
 * Central Zod validation schemas for all auth forms.
 * Shared by login.tsx and register.tsx via react-hook-form + @hookform/resolvers.
 */

import { z } from 'zod';

// ─── Login Schema ────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'විද්‍යුත් තැපෑල හෝ ID ඇතුළත් කරන්න. (Email or ID is required.)')
    .refine(
      (val) => {
        // Allow plain student IDs (no @ required) OR valid emails
        if (!val.includes('@')) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      },
      'නිවැරදි විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න. (Invalid email address.)'
    ),
  password: z
    .string()
    .min(1, 'මුරපදය ඇතුළත් කරන්න. (Password is required.)'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Register Schema ─────────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'නම අවම වශයෙන් අකුරු 2ක් විය යුතුය. (Name must be at least 2 characters.)')
      .max(80, 'Name is too long.'),
    email: z
      .string()
      .min(1, 'විද්‍යුත් තැපෑල ඇතුළත් කරන්න. (Email is required.)')
      .regex(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'නිවැරදි විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න. (Invalid email address.)'
      ),
    password: z
      .string()
      .min(8, 'මුරපදය අවම වශයෙන් අකුරු 8ක් විය යුතුය. (Password must be at least 8 characters.)')
      .regex(/[A-Z]/, 'මුරපදයේ ලොකු අකුරක් (A-Z) තිබිය යුතුය. (Must include at least one uppercase letter.)')
      .regex(/[a-z]/, 'මුරපදයේ කුඩා අකුරක් (a-z) තිබිය යුතුය. (Must include at least one lowercase letter.)')
      .regex(/[0-9]/, 'මුරපදයේ ඉලක්කමක් (0-9) තිබිය යුතුය. (Must include at least one number.)')
      .regex(/[^A-Za-z0-9]/, 'මුරපදයේ විශේෂ අකුරක් (!@#$% ආදිය) තිබිය යුතුය. (Must include at least one special character e.g. !@#$%.)'),
    confirmPassword: z
      .string()
      .min(1, 'මුරපදය නැවත ඇතුළත් කරන්න. (Please confirm your password.)'),
    childName: z
      .string()
      .min(2, "දරුවාගේ නම ඇතුළත් කරන්න. (Child's name is required.)"),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'කරුණාකර නියම සහ ප්‍රතිපත්තිය පිළිගන්න. (You must agree to the Terms of Service.)',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'මුරපද දෙක සමාන නොවේ. (Passwords do not match.)',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
