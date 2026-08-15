import crypto from 'crypto';
import { SECURITY_CONFIG } from '../config/security';

export type SecurityActionType = 'PASSWORD_CHANGE' | 'EMAIL_CHANGE';

interface PendingSecurityAction {
  codeHash: string;
  data: string; // newPasswordHash for PASSWORD_CHANGE, newEmail for EMAIL_CHANGE
  expiresAt: number;
  attempts: number;
  lastRequestAt: number;
}

export type CreateRequestResult =
  | { status: 'OK'; code: string }
  | { status: 'COOLDOWN'; remainingSeconds: number }
  | { status: 'LOCKED'; remainingSeconds: number };

export type VerifyRequestResult =
  | { status: 'OK'; data: string }
  | { status: 'LOCKED'; remainingSeconds: number }
  | { status: 'EXPIRED' }
  | { status: 'INVALID'; attempts: number; remainingAttempts: number; isLockedNow: boolean; remainingLockoutSeconds?: number };

class PasswordSecurityService {
  private pendings = new Map<string, PendingSecurityAction>();
  private lockouts = new Map<string, number>();

  private getKey(userId: string, type: SecurityActionType): string {
    return `${userId}:${type}`;
  }

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code.trim()).digest('hex');
  }

  private timingSafeCompareHashes(hashA: string, hashB: string): boolean {
    const bufA = Buffer.from(hashA, 'hex');
    const bufB = Buffer.from(hashB, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Generates cryptographically secure 6-digit code
   */
  public generateSecureCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Checks if an action is currently locked out
   */
  public isLocked(userId: string, type: SecurityActionType): { locked: boolean; remainingSeconds: number } {
    const key = this.getKey(userId, type);
    const lockedUntil = this.lockouts.get(key);
    const now = Date.now();

    if (lockedUntil && lockedUntil > now) {
      const remainingSeconds = Math.ceil((lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }

    if (lockedUntil && lockedUntil <= now) {
      this.lockouts.delete(key);
    }

    return { locked: false, remainingSeconds: 0 };
  }

  /**
   * Creates a security request (password or email change) with 60s cooldown and 30m lockout check
   */
  public createRequest(userId: string, type: SecurityActionType, data: string): CreateRequestResult {
    const lockoutCheck = this.isLocked(userId, type);
    if (lockoutCheck.locked) {
      return { status: 'LOCKED', remainingSeconds: lockoutCheck.remainingSeconds };
    }

    const key = this.getKey(userId, type);
    const pending = this.pendings.get(key);
    const now = Date.now();

    if (pending && now - pending.lastRequestAt < SECURITY_CONFIG.COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((SECURITY_CONFIG.COOLDOWN_MS - (now - pending.lastRequestAt)) / 1000);
      return { status: 'COOLDOWN', remainingSeconds };
    }

    const code = this.generateSecureCode();
    const codeHash = this.hashCode(code);

    this.pendings.set(key, {
      codeHash,
      data,
      expiresAt: now + SECURITY_CONFIG.CODE_TTL_MS,
      attempts: pending ? pending.attempts : 0, // retain attempts or keep existing attempt count
      lastRequestAt: now,
    });

    return { status: 'OK', code };
  }

  /**
   * Cancels a pending request (used when e.g. email sending fails)
   */
  public cancelPendingRequest(userId: string, type: SecurityActionType): void {
    const key = this.getKey(userId, type);
    this.pendings.delete(key);
  }

  /**
   * Verifies the code provided by the user with constant-time comparison and lockout policy
   */
  public verifyCode(userId: string, type: SecurityActionType, inputCode: string): VerifyRequestResult {
    const lockoutCheck = this.isLocked(userId, type);
    if (lockoutCheck.locked) {
      return { status: 'LOCKED', remainingSeconds: lockoutCheck.remainingSeconds };
    }

    const key = this.getKey(userId, type);
    const pending = this.pendings.get(key);
    const now = Date.now();

    if (!pending || pending.expiresAt < now) {
      if (pending) {
        this.pendings.delete(key);
      }
      return { status: 'EXPIRED' };
    }

    const inputHash = this.hashCode(inputCode);
    const isMatch = this.timingSafeCompareHashes(pending.codeHash, inputHash);

    if (isMatch) {
      const data = pending.data;
      this.pendings.delete(key);
      return { status: 'OK', data };
    }

    // Failed attempt
    pending.attempts += 1;

    if (pending.attempts >= SECURITY_CONFIG.MAX_ATTEMPTS) {
      const lockedUntil = now + SECURITY_CONFIG.LOCKOUT_MS;
      this.lockouts.set(key, lockedUntil);
      this.pendings.delete(key);
      const remainingLockoutSeconds = Math.ceil(SECURITY_CONFIG.LOCKOUT_MS / 1000);

      return {
        status: 'INVALID',
        attempts: pending.attempts,
        remainingAttempts: 0,
        isLockedNow: true,
        remainingLockoutSeconds,
      };
    }

    const remainingAttempts = SECURITY_CONFIG.MAX_ATTEMPTS - pending.attempts;
    return {
      status: 'INVALID',
      attempts: pending.attempts,
      remainingAttempts,
      isLockedNow: false,
    };
  }

  /**
   * Clear memory stores (useful for testing)
   */
  public resetAll(): void {
    this.pendings.clear();
    this.lockouts.clear();
  }
}

export const passwordSecurityService = new PasswordSecurityService();
