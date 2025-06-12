import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const uuidSchema = z.string().regex(uuidRegex, 'Invalid UUID format');

export function isValidUUID(uuid: string): boolean {
  return uuidSchema.safeParse(uuid).success;
}

export function safeUUIDConversion(value: string): string {
  if (!isValidUUID(value)) {
    throw new Error('Invalid UUID format');
  }
  return value;
} 