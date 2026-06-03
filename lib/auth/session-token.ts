export type AppSessionUser = {
  createdAt: string;
  email: string;
  fullName?: string | null;
  id: string;
};

type SignedPayload<T> = {
  payload: T;
  signature: string;
};

const APP_SESSION_MAX_AGE_MS = 60 * 60 * 24 * 30 * 1000;

function getAppSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error("APP_SESSION_SECRET is required.");
  }

  return secret;
}

function toBase64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

async function importSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAppSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function signValue(value: string) {
  const key = await importSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(signature));
}

async function encodeSignedPayload<T>(payload: T) {
  const serialized = JSON.stringify(payload);
  const encodedPayload = toBase64Url(serialized);
  const signature = await signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

async function decodeSignedPayload<T>(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await signValue(encodedPayload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(encodedPayload)) as T;
  } catch {
    return null;
  }
}

export async function buildAppSessionValue(user: AppSessionUser) {
  return encodeSignedPayload({
    exp: Date.now() + APP_SESSION_MAX_AGE_MS,
    user
  });
}

export async function parseAppSessionValue(value: string | undefined | null) {
  const decoded = await decodeSignedPayload<{ exp: number; user: AppSessionUser }>(value);

  if (!decoded || decoded.exp < Date.now()) {
    return null;
  }

  return decoded.user;
}

export async function buildGoogleOAuthStateValue(payload: SignedPayload<{ next: string; nonce: string }>) {
  return encodeSignedPayload(payload);
}

export async function parseGoogleOAuthStateValue(value: string | undefined | null) {
  return decodeSignedPayload<SignedPayload<{ next: string; nonce: string }>>(value);
}

export async function signGoogleOAuthStatePayload(payload: { next: string; nonce: string }) {
  return signValue(JSON.stringify(payload));
}
