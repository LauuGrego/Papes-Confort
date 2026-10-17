import { prisma } from '@papes-confort/database';
import {
  BankPromotionDto,
  CreatePromotionPayload,
  UpdatePromotionPayload,
} from '@papes-confort/shared';

function mapPromotionToDto(p: any): BankPromotionDto {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    bankName: p.bankName,
    cardType: p.cardType,
    dayOfWeek: p.dayOfWeek,
    discountPercent: Number(p.discountPercent),
    maxReimbursement: Number(p.maxReimbursement),
    installmentsTotal: p.installmentsTotal,
    installmentsPaid: p.installmentsPaid,
    isActive: p.isActive,
    validFrom: p.validFrom.toISOString(),
    validUntil: p.validUntil.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/**
 * Obtiene el día de la semana actual en Argentina (0 = Domingo, ..., 6 = Sábado)
 */
export function getArgentinaDayOfWeek(): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short',
  });
  const dayStr = formatter.format(now);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return dayMap[dayStr] ?? now.getDay();
}

/**
 * Lista todas las promociones bancarias (para panel admin)
 */
export async function getAllPromotions(): Promise<BankPromotionDto[]> {
  const promotions = await prisma.bankPromotion.findMany({
    orderBy: [
      { isActive: 'desc' },
      { dayOfWeek: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return promotions.map(mapPromotionToDto);
}

/**
 * Lista las promociones bancarias activas y vigentes
 */
export async function getActivePromotions(dayOfWeek?: number): Promise<BankPromotionDto[]> {
  const now = new Date();

  const where: any = {
    isActive: true,
    validFrom: { lte: now },
    validUntil: { gte: now },
  };

  if (dayOfWeek !== undefined) {
    where.OR = [
      { dayOfWeek },
      { dayOfWeek: null },
    ];
  }

  const promotions = await prisma.bankPromotion.findMany({
    where,
    orderBy: [
      { dayOfWeek: 'asc' },
      { discountPercent: 'desc' },
    ],
  });

  return promotions.map(mapPromotionToDto);
}

/**
 * Obtiene la promoción bancaria destacada del día de hoy
 */
export async function getTodayPromotion(): Promise<BankPromotionDto | null> {
  const todayDayOfWeek = getArgentinaDayOfWeek();
  const activeToday = await getActivePromotions(todayDayOfWeek);

  // Priorizar las que son específicas del día de hoy, y luego mayor descuento
  const sorted = activeToday.sort((a, b) => {
    if (a.dayOfWeek === todayDayOfWeek && b.dayOfWeek !== todayDayOfWeek) return -1;
    if (b.dayOfWeek === todayDayOfWeek && a.dayOfWeek !== todayDayOfWeek) return 1;
    return b.discountPercent - a.discountPercent;
  });

  return sorted[0] || null;
}

/**
 * Crea una nueva promoción bancaria
 */
export async function createPromotion(data: CreatePromotionPayload): Promise<BankPromotionDto> {
  const promotion = await prisma.bankPromotion.create({
    data: {
      name: data.name,
      description: data.description || null,
      bankName: data.bankName,
      cardType: data.cardType,
      dayOfWeek: data.dayOfWeek !== undefined && data.dayOfWeek !== null ? Number(data.dayOfWeek) : null,
      discountPercent: data.discountPercent,
      maxReimbursement: data.maxReimbursement ?? 0,
      installmentsTotal: Number(data.installmentsTotal),
      installmentsPaid: Number(data.installmentsPaid),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
    },
  });

  return mapPromotionToDto(promotion);
}

/**
 * Actualiza una promoción bancaria existente
 */
export async function updatePromotion(id: string, data: UpdatePromotionPayload): Promise<BankPromotionDto> {
  const existing = await prisma.bankPromotion.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Promoción bancaria no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.bankPromotion.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.bankName !== undefined && { bankName: data.bankName }),
      ...(data.cardType !== undefined && { cardType: data.cardType }),
      ...(data.dayOfWeek !== undefined && {
        dayOfWeek: data.dayOfWeek !== null ? Number(data.dayOfWeek) : null,
      }),
      ...(data.discountPercent !== undefined && { discountPercent: data.discountPercent }),
      ...(data.maxReimbursement !== undefined && { maxReimbursement: data.maxReimbursement ?? 0 }),
      ...(data.installmentsTotal !== undefined && { installmentsTotal: Number(data.installmentsTotal) }),
      ...(data.installmentsPaid !== undefined && { installmentsPaid: Number(data.installmentsPaid) }),
      ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      ...(data.validFrom !== undefined && { validFrom: new Date(data.validFrom) }),
      ...(data.validUntil !== undefined && { validUntil: new Date(data.validUntil) }),
    },
  });

  return mapPromotionToDto(updated);
}

/**
 * Alterna el estado activo de una promoción
 */
export async function togglePromotionActive(id: string): Promise<BankPromotionDto> {
  const existing = await prisma.bankPromotion.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Promoción bancaria no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.bankPromotion.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  return mapPromotionToDto(updated);
}

/**
 * Elimina una promoción bancaria
 */
export async function deletePromotion(id: string): Promise<{ success: boolean }> {
  const existing = await prisma.bankPromotion.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Promoción bancaria no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.bankPromotion.delete({ where: { id } });
  return { success: true };
}
