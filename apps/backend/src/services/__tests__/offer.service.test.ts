import { describe, it, expect } from 'vitest';
import { slugify } from '../offer.service';

describe('Offer Service - slugify', () => {
  it('should format normal strings to lower-case hyphenated slugs', () => {
    expect(slugify('Cyber Papes 2026')).toBe('cyber-papes-2026');
  });

  it('should remove accents and special characters', () => {
    expect(slugify('¡Oferta de Electrodomésticos en Óptimas Condiciones!')).toBe(
      'oferta-de-electrodomesticos-en-optimas-condiciones'
    );
  });

  it('should handle extra spaces and trailing dashes', () => {
    expect(slugify('   Gran   Descuento   --- ')).toBe('gran-descuento');
  });
});
