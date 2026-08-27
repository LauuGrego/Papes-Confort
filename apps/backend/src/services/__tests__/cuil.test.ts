import { describe, it, expect } from 'vitest';
import { isValidCuilCuit, formatCuilCuit, cleanCuilCuit } from '@papes-confort/shared';

describe('CUIL / CUIT Validator & Formatter (AFIP Módulo 11)', () => {
  it('should clean non-digit characters correctly', () => {
    expect(cleanCuilCuit('20-30123456-7')).toBe('20301234567');
    expect(cleanCuilCuit(' 20 30123456 7 ')).toBe('20301234567');
    expect(cleanCuilCuit(null)).toBe('');
    expect(cleanCuilCuit(undefined)).toBe('');
  });

  it('should format clean numbers to standard AFIP format XX-XXXXXXXX-X', () => {
    expect(formatCuilCuit('20301234567')).toBe('20-30123456-7');
    expect(formatCuilCuit('27123456789')).toBe('27-12345678-9');
    expect(formatCuilCuit('30712345678')).toBe('30-71234567-8');
    expect(formatCuilCuit('')).toBe('');
  });

  it('should validate valid Argentine CUIL/CUIT numbers', () => {
    // Casos válidos reales con dígito verificador calculado
    // 20-32943234-8 -> sum = 2*5 + 0*4 + 3*3 + 2*2 + 9*7 + 4*6 + 3*5 + 2*4 + 3*3 + 4*2 = 10+0+9+4+63+24+15+8+9+8 = 150. 150 % 11 = 7. 11 - 7 = 4 -> digit 4
    // Verifiquemos con un CUIT real de AFIP:
    // CUIT de AFIP: 33-69345023-9
    expect(isValidCuilCuit('33-69345023-9')).toBe(true);
    expect(isValidCuilCuit('33693450239')).toBe(true);

    // CUIT Banco de la Nación Argentina: 30-50001091-2
    expect(isValidCuilCuit('30-50001091-2')).toBe(true);

    // CUIT Google Argentina SRL: 30-70977239-9
    expect(isValidCuilCuit('30-70977239-9')).toBe(true);
  });

  it('should reject invalid CUIL/CUIT numbers', () => {
    // Dígito verificador incorrecto
    expect(isValidCuilCuit('30-70977239-5')).toBe(false);
    expect(isValidCuilCuit('30500010919')).toBe(false);

    // Longitud incorrecta
    expect(isValidCuilCuit('203012345')).toBe(false);
    expect(isValidCuilCuit('2030123456789')).toBe(false);

    // Prefijo inválido
    expect(isValidCuilCuit('99-70977239-0')).toBe(false);

    // Vacío o nulo
    expect(isValidCuilCuit('')).toBe(false);
    expect(isValidCuilCuit(null)).toBe(false);
  });
});
