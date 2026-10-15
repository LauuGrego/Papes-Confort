import { prisma } from '@papes-confort/database';

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
  userAgent?: string;
  result: 'SUCCESS' | 'FAILED' | 'LOCKED';
  attempts?: number;
  detail?: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface GenericAuditLogInput {
  userId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function createAuditRecord(input: GenericAuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? (input.metadata as any) : undefined,
      },
    });
  } catch (error) {
    console.error('[AUDIT LOG ERROR] Failed to persist audit log to database:', error);
  }
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
    ...options.metadata,
  };

  console.log(`[SECURITY AUDIT] ${JSON.stringify(logPayload)}`);

  // Asynchronously persist to database without blocking execution
  createAuditRecord({
    userId: options.userId,
    action: event,
    entity: options.entity || 'User',
    entityId: options.entityId || options.userId,
    ip: options.ip || null,
    userAgent: options.userAgent || null,
    metadata: {
      result: options.result,
      email: options.email || null,
      attempts: options.attempts ?? null,
      detail: options.detail || null,
      ...options.metadata,
    },
  }).catch((err) => {
    console.error('[SECURITY AUDIT DB ERROR]', err);
  });
}

