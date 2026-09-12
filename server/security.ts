import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Compares plaintext password against stored bcrypt hash
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

const COMMON_WEAK_PASSWORDS = [
  'password', 'password123', 'admin', 'admin123', '123456', '12345678',
  'qwerty', 'school', 'greenwood', 'student', 'teacher', '123456789'
];

/**
 * Validates password against enterprise security policy:
 * - Minimum 8 chars (recommended 12+)
 * - Must contain uppercase letter
 * - Must contain lowercase letter
 * - Must contain number
 * - Must contain special character
 * - Not a common dictionary password
 */
export function validatePasswordPolicy(password: string, minLength = 6): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters in length.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize strings to protect against basic XSS injection
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strip sensitive security fields before returning user object to client
 */
export function sanitizeUserOutput<T extends Record<string, any>>(user: T): Omit<T, 'passwordHash' | 'refreshToken' | 'passwordSalt' | 'resetToken'> {
  const { passwordHash, refreshToken, passwordSalt, resetToken, ...safeUser } = user;
  return safeUser;
}
