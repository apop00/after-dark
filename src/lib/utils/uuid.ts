import crypto from 'crypto';

/**
 * Ensures an ID is a valid RFC4122 v4 UUID string.
 * If already a valid UUID, returns it unchanged.
 * If an arbitrary string (e.g. 'usr_123', 'host_abc'), deterministically converts it into a UUID.
 */
export function ensureUuid(id: string): string {
  if (!id || typeof id !== 'string') {
    return '00000000-0000-0000-0000-000000000000';
  }

  const clean = id.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(clean)) {
    return clean.toLowerCase();
  }

  // Deterministically hash non-UUID strings into RFC4122 v4 formatted UUID
  const hash = crypto.createHash('md5').update(clean).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
