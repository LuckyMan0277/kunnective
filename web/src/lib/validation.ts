import { z } from 'zod'

// Konkuk University email validation
export function isKonkukEmail(email: string): boolean {
  return email.endsWith('@konkuk.ac.kr')
}

// Sign up schema
export const signUpSchema = z.object({
  email: z
    .string()
    .email('올바른 이메일 형식이 아닙니다')
    .refine(isKonkukEmail, {
      message: '건국대 이메일(@konkuk.ac.kr)만 사용 가능합니다',
    }),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Za-z]/, '비밀번호에 영문자가 포함되어야 합니다')
    .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

// Sign in schema
export const signInSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

// Profile schema
export const profileSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  major: z.string().optional(),
  year: z.number().min(1).max(4).optional(),
  bio: z.string().max(500, '자기소개는 500자 이내로 작성해주세요').optional(),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  portfolio_url: z.string().url('올바른 URL 형식이 아닙니다').optional().or(z.literal('')),
  github_url: z.string().url('올바른 URL 형식이 아닙니다').optional().or(z.literal('')),
})

export type SignUpFormData = z.infer<typeof signUpSchema>
export type SignInFormData = z.infer<typeof signInSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
