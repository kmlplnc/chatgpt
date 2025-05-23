export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function safeUUIDConversion(value: string): string {
  if (!isValidUUID(value)) {
    throw new Error('Invalid UUID format');
  }
  return value;
} 