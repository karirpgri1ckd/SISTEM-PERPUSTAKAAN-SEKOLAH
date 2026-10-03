/**
 * Hash password securely using standard Web Crypto SHA-256
 */
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText + "_library_salt_2026");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  const currentHash = await hashPassword(plainText);
  return currentHash === hashed;
}
