export type SecurityAuditEvent =
  | 'PASSWORD_CHANGE_REQUESTED'
  | 'PASSWORD_CHANGE_CONFIRMED'
  | 'PASSWORD_CHANGE_ATTEMPT_FAILED'
  | 'PASSWORD_CHANGE_LOCKED'
  | 'EMAIL_CHANGE_REQUESTED'
  | 'EMAIL_CHANGE_CONFIRMED'
  | 'EMAIL_CHANGE_ATTEMPT_FAILED'
  | 'EMAIL_CHANGE_LOCKED';

export interface AuditLogOptions {
  userId: string;
  email?: string;
  ip?: string;
  result: 'SUCCESS' | 'FAILED' | 'LOCKED';
  attempts?: number;
  detail?: string;
}

export function auditSecurityEvent(event: SecurityAuditEvent, options: AuditLogOptions): void {
  const logPayload = {
    timestamp: new Date().toISOString(),
    event,
    userId: options.userId,
    email: options.email || null,
    ip: options.ip || 'unknown',
    result: options.result,
    attempts: options.attempts ?? null,
    detail: options.detail || null,
  };

  console.log(`[SECURITY AUDIT] ${JSON.stringify(logPayload)}`);
}
