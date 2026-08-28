import { describe, it, expect } from 'vitest';
import { mapCustomerToDto } from '../../services/customer.service';

describe('Google Auth Integration & Customer Mapping', () => {
  it('mapea correctamente un cliente autenticado con Google sin contraseña local', () => {
    const mockCustomer = {
      id: 'cust-google-123',
      name: 'Lautaro Gregorutti',
      email: 'lautaro@gmail.com',
      password: null,
      googleId: 'google-sub-1009823',
      avatarUrl: 'https://lh3.googleusercontent.com/a/mock-photo',
      phone: null,
      cuilCuit: null,
      address: null,
      city: null,
      province: null,
      postalCode: null,
      marketingOptIn: true,
      createdAt: new Date('2026-08-28T10:00:00.000Z'),
      updatedAt: new Date('2026-08-28T10:00:00.000Z'),
    };

    const dto = mapCustomerToDto(mockCustomer);

    expect(dto.id).toBe('cust-google-123');
    expect(dto.email).toBe('lautaro@gmail.com');
    expect(dto.googleId).toBe('google-sub-1009823');
    expect(dto.avatarUrl).toBe('https://lh3.googleusercontent.com/a/mock-photo');
    expect(dto.hasPassword).toBe(false);
    expect(dto.marketingOptIn).toBe(true);
  });

  it('indica hasPassword: true cuando un cliente tiene contraseña local además de Google', () => {
    const mockCustomer = {
      id: 'cust-hybrid-456',
      name: 'María González',
      email: 'maria@gmail.com',
      password: '$2a$12$hashedpasswordexample...',
      googleId: 'google-sub-998877',
      avatarUrl: null,
      phone: '3445123456',
      cuilCuit: '27301234564',
      address: 'San Martín 123',
      city: 'Basavilbaso',
      province: 'Entre Ríos',
      postalCode: '3170',
      marketingOptIn: false,
      createdAt: new Date('2026-08-28T10:00:00.000Z'),
      updatedAt: new Date('2026-08-28T10:00:00.000Z'),
    };

    const dto = mapCustomerToDto(mockCustomer);

    expect(dto.hasPassword).toBe(true);
    expect(dto.googleId).toBe('google-sub-998877');
    expect(dto.phone).toBe('3445123456');
  });
});
