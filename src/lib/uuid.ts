/**
 * A random (version 4) UUID.
 *
 * `crypto.randomUUID()` only exists in secure contexts: HTTPS and localhost.
 * Opening the dev site from a phone over plain http on the local network is
 * neither, and there it is simply undefined. The fallback builds the same
 * thing from `crypto.getRandomValues`, which has no such restriction.
 */
export function randomUuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // The two fixed fields that make a random UUID a valid version 4, variant 1.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}
