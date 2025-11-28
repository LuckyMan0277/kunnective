/**
 * 건국대학교 이메일 도메인 검증
 */
export function isKonkukEmail(email: string): boolean {
  const lowercaseEmail = email.toLowerCase().trim()
  return (
    lowercaseEmail.endsWith('@konkuk.ac.kr') ||
    lowercaseEmail.endsWith('@kku.ac.kr')
  )
}

/**
 * 이메일 형식 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 건국대학교 이메일 검증 (형식 + 도메인)
 */
export function validateKonkukEmail(email: string): {
  isValid: boolean
  message?: string
} {
  if (!email) {
    return { isValid: false, message: '이메일을 입력해주세요.' }
  }

  if (!isValidEmail(email)) {
    return { isValid: false, message: '올바른 이메일 형식이 아닙니다.' }
  }

  if (!isKonkukEmail(email)) {
    return {
      isValid: false,
      message: '건국대학교 이메일(@konkuk.ac.kr 또는 @kku.ac.kr)만 가입 가능합니다.',
    }
  }

  return { isValid: true }
}

/**
 * 비밀번호 강도 검증 (8자 이상, 대소문자, 숫자, 특수문자 포함)
 */
export function validatePassword(password: string): {
  isValid: boolean
  message?: string
} {
  if (!password) {
    return { isValid: false, message: '비밀번호를 입력해주세요.' }
  }

  if (password.length < 8) {
    return { isValid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' }
  }

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (!hasUpperCase) {
    return { isValid: false, message: '대문자를 최소 1개 포함해야 합니다.' }
  }

  if (!hasLowerCase) {
    return { isValid: false, message: '소문자를 최소 1개 포함해야 합니다.' }
  }

  if (!hasNumber) {
    return { isValid: false, message: '숫자를 최소 1개 포함해야 합니다.' }
  }

  if (!hasSpecialChar) {
    return { isValid: false, message: '특수문자(!@#$%^&* 등)를 최소 1개 포함해야 합니다.' }
  }

  return { isValid: true }
}
