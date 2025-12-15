export const ADMIN_COOKIE_NAME = "alpha_admin";

const TOKEN_VERSION = "v1";

type AnyCrypto = {
  subtle: SubtleCrypto;
};

function getCrypto(): AnyCrypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("WebCrypto not available");
  }
  return globalThis.crypto as AnyCrypto;
}

function toBase64Url(bytes: Uint8Array) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  const b64 = btoa(str);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(s: string) {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export type AdminSessionPayload = {
  email: string;
  iat: number;
};

export function getAdminEmail() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("Missing ADMIN_EMAIL env var");
  return email;
}

export function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("Missing ADMIN_PASSWORD env var");
  return password;
}

export function getAdminSecret() {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_AUTH_SECRET env var");
  }
  return secret;
}

async function importKey(secret: string) {
  const crypto = getCrypto();
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSign(message: string, secret: string) {
  const crypto = getCrypto();
  const key = await importKey(secret);
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toBase64Url(new Uint8Array(sig));
}

function safeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i] ^ b[i];
  return out === 0;
}

export async function createAdminToken(payload: AdminSessionPayload) {
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const msg = `${TOKEN_VERSION}.${body}`;
  const sig = await hmacSign(msg, getAdminSecret());
  return `${msg}.${sig}`;
}

export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const [version, body, sig] = token.split(".");
    if (!version || !body || !sig) return null;
    if (version !== TOKEN_VERSION) return null;

    const msg = `${version}.${body}`;
    const expected = await hmacSign(msg, getAdminSecret());
    if (!safeEqual(fromBase64Url(expected), fromBase64Url(sig))) return null;

    const json = new TextDecoder().decode(fromBase64Url(body));
    const parsed = JSON.parse(json) as AdminSessionPayload;
    if (!parsed?.email || typeof parsed.iat !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}
