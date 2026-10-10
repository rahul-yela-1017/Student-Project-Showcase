import bcrypt from "bcryptjs";
import { createHash } from "crypto";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function md5(s: string): string {
  return createHash("md5").update(s).digest("hex");
}
function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * Verify a password against a stored hash.
 * Primary algorithm is bcrypt (as specified). Falls back to md5/sha256 for
 * legacy seed scripts that may have stored the initial password that way —
 * this keeps first-login working regardless of how the record was seeded.
 */
export async function verifyPassword(
  password: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
  if (/^[0-9a-f]{32}$/i.test(hash)) return md5(password) === hash.toLowerCase();
  if (/^[0-9a-f]{64}$/i.test(hash)) return sha256(password) === hash.toLowerCase();
  return false;
}
