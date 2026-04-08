import crypto from "node:crypto";

function getEncryptionSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET must be configured before storing OAuth credentials.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptJson(value: unknown) {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionSecret();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptJson<T>(encryptedPayload: string): T {
  const [ivPart, authTagPart, ciphertextPart] = encryptedPayload.split(".");

  if (!ivPart || !authTagPart || !ciphertextPart) {
    throw new Error("Encrypted payload is malformed.");
  }

  const key = getEncryptionSecret();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString("utf8")) as T;
}
