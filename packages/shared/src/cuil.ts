/**
 * Utilidades para validación y formateo de CUIL / CUIT (Argentina - AFIP)
 */

export function cleanCuilCuit(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Valida un número de CUIL / CUIT según el algoritmo de dígito verificador (Módulo 11) de AFIP.
 */
export function isValidCuilCuit(value: string | null | undefined): boolean {
  if (!value) return false;

  const clean = cleanCuilCuit(value);

  // Debe tener exactamente 11 dígitos numéricos
  if (clean.length !== 11) {
    return false;
  }

  // Prefijos comunes reconocidos por AFIP (personas físicas, jurídicas, etc.)
  const validPrefixes = ['20', '23', '24', '25', '26', '27', '30', '33', '34'];
  const prefix = clean.substring(0, 2);
  if (!validPrefixes.includes(prefix)) {
    return false;
  }

  const digits = clean.split('').map(Number);
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * multipliers[i];
  }

  const remainder = sum % 11;
  let checkDigit = 11 - remainder;

  if (checkDigit === 11) {
    checkDigit = 0;
  } else if (checkDigit === 10) {
    checkDigit = 9;
  }

  return checkDigit === digits[10];
}

/**
 * Formatea un CUIL / CUIT a la convención estándar XX-XXXXXXXX-X
 */
export function formatCuilCuit(value: string | null | undefined): string {
  if (!value) return '';
  const clean = cleanCuilCuit(value);
  if (clean.length === 0) return '';
  if (clean.length <= 2) return clean;
  if (clean.length <= 10) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10, 11)}`;
}
