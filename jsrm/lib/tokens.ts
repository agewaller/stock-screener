import crypto from "node:crypto";

// Generate a high-entropy URL-safe token (raw form is sent in email links).
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Store only the hash in the DB. The raw token in the URL is hashed and compared.
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return crypto
    .createHash("sha256")
    .update(`${ip}|${process.env.CRON_SECRET ?? "salt"}`)
    .digest("hex");
}
