import { describe, it, expect, beforeEach } from 'vitest';
import { passwordSecurityService } from '../password-security.service';
import { SECURITY_CONFIG } from '../../config/security';

describe('PasswordSecurityService', () => {
  const userId = 'user-test-123';
  const type = 'PASSWORD_CHANGE';

  beforeEach(() => {
    passwordSecurityService.resetAll();
  });

  it('should generate a 6-digit cryptographically secure code', () => {
    const code = passwordSecurityService.generateSecureCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should create a request successfully and verify it with the correct code', () => {
    const res = passwordSecurityService.createRequest(userId, type, 'hashed-password-123');
    expect(res.status).toBe('OK');
    if (res.status !== 'OK') return;

    const verifyRes = passwordSecurityService.verifyCode(userId, type, res.code);
    expect(verifyRes.status).toBe('OK');
    if (verifyRes.status === 'OK') {
      expect(verifyRes.data).toBe('hashed-password-123');
    }
  });

  it('should enforce cooldown if request is created before 60 seconds', () => {
    const res1 = passwordSecurityService.createRequest(userId, type, 'hashed-password-123');
    expect(res1.status).toBe('OK');

    const res2 = passwordSecurityService.createRequest(userId, type, 'hashed-password-123');
    expect(res2.status).toBe('COOLDOWN');
    if (res2.status === 'COOLDOWN') {
      expect(res2.remainingSeconds).toBeGreaterThan(0);
      expect(res2.remainingSeconds).toBeLessThanOrEqual(60);
    }
  });

  it('should track failed attempts and trigger lockout at 5th attempt', () => {
    const res = passwordSecurityService.createRequest(userId, type, 'hashed-password-123');
    expect(res.status).toBe('OK');

    // 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const verify = passwordSecurityService.verifyCode(userId, type, '000000');
      expect(verify.status).toBe('INVALID');
      if (verify.status === 'INVALID') {
        expect(verify.attempts).toBe(i);
        expect(verify.remainingAttempts).toBe(SECURITY_CONFIG.MAX_ATTEMPTS - i);
        expect(verify.isLockedNow).toBe(false);
      }
    }

    // 5th failed attempt -> Lockout
    const verify5 = passwordSecurityService.verifyCode(userId, type, '000000');
    expect(verify5.status).toBe('INVALID');
    if (verify5.status === 'INVALID') {
      expect(verify5.attempts).toBe(5);
      expect(verify5.remainingAttempts).toBe(0);
      expect(verify5.isLockedNow).toBe(true);
      expect(verify5.remainingLockoutSeconds).toBe(SECURITY_CONFIG.LOCKOUT_MS / 1000);
    }

    // Subsequent request or verification attempt must return LOCKED
    const reqAfterLock = passwordSecurityService.createRequest(userId, type, 'hashed-password-123');
    expect(reqAfterLock.status).toBe('LOCKED');

    const verifyAfterLock = passwordSecurityService.verifyCode(userId, type, '123456');
    expect(verifyAfterLock.status).toBe('LOCKED');
  });

  it('should return EXPIRED if no pending request exists or code has expired', () => {
    const verify = passwordSecurityService.verifyCode(userId, type, '123456');
    expect(verify.status).toBe('EXPIRED');
  });
});
