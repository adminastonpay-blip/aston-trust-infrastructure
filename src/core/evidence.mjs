import canonicalize from "canonicalize";

const encoder = new TextEncoder();
const HEX = /^[a-f0-9]{64}$/;

function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replaceAll("+", "-").replaceAll("/", "_");
}

function base64UrlToBytes(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new TypeError("Invalid base64url value");
  }
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function jcsBytes(value) {
  const canonical = canonicalize(value);
  if (canonical === undefined) throw new TypeError("Value is not JSON-canonicalizable");
  return encoder.encode(canonical);
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", value instanceof Uint8Array ? value : jcsBytes(value));
  return new Uint8Array(digest);
}

export async function sha256Hex(value) {
  return bytesToHex(await sha256(value));
}

export async function createEvidenceCore(input, payloadValue = null) {
  const payloadDigest = await sha256Hex(jcsBytes(payloadValue));
  const core = {
    ...input,
    payloadDigest: { algorithm: "SHA-256", value: payloadDigest }
  };
  delete core.eventDigest;
  delete core.signature;
  delete core.timestampReceiptRef;
  return core;
}

export async function signEvidence(core, privateKey, keyId) {
  if (!keyId) throw new TypeError("keyId is required");
  const digest = await sha256(jcsBytes(core));
  const signature = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, privateKey, digest));
  return {
    ...core,
    eventDigest: { algorithm: "SHA-256", value: bytesToHex(digest) },
    signature: {
      algorithm: "EdDSA",
      keyId,
      canonicalization: "RFC8785",
      digestAlgorithm: "SHA-256",
      value: bytesToBase64Url(signature)
    }
  };
}

export async function verifyEvidence(envelope, publicKey) {
  if (!envelope || envelope.signature?.algorithm !== "EdDSA" ||
      envelope.signature?.canonicalization !== "RFC8785" ||
      envelope.signature?.digestAlgorithm !== "SHA-256" ||
      envelope.signature?.keyId !== envelope.signer?.keyId) return false;
  const core = { ...envelope };
  delete core.eventDigest;
  delete core.signature;
  delete core.timestampReceiptRef;
  const digest = await sha256(jcsBytes(core));
  if (bytesToHex(digest) !== envelope.eventDigest?.value ||
      !HEX.test(envelope.eventDigest?.value ?? "")) return false;
  return crypto.subtle.verify(
    { name: "Ed25519" },
    publicKey,
    base64UrlToBytes(envelope.signature.value),
    digest
  );
}

export function decodeBase64Url(value) {
  return base64UrlToBytes(value);
}
