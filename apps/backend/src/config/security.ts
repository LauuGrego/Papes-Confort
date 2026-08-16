export const SECURITY_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_MS: 30 * 60 * 1000, // 30 minutos
  CODE_TTL_MS: 10 * 60 * 1000, // 10 minutos
  COOLDOWN_MS: 60 * 1000, // 60 segundos
};
