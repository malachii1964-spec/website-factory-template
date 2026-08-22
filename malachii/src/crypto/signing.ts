import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as nodeSign,
  verify as nodeVerify,
  type KeyObject,
} from "node:crypto";
import { sha256Text } from "./hash";

/**
 * Ed25519 signing over canonical bytes.
 *
 * Scope note: a signature proves the holder of a specific private key endorsed
 * exact bytes. It does NOT prove a human was present. If the signing key sits on
 * the same host as the agent, this buys tamper-evidence and non-repudiation
 * between components — not an air gap. Keep the root key off-box to make the
 * T2 boundary mean what section 27 of the spec says it means.
 */

export interface KeyPair {
  readonly privateKey: KeyObject;
  readonly publicKey: KeyObject;
  /** Stable short identity for a public key; what the constitution pins. */
  readonly fingerprint: string;
}

export function generateSigningKeyPair(): KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  return { privateKey, publicKey, fingerprint: fingerprintOf(publicKey) };
}

export function fingerprintOf(publicKey: KeyObject): string {
  const der = publicKey.export({ type: "spki", format: "der" });
  return sha256Text(der.toString("base64")).slice(0, 32);
}

export function publicKeyFromPem(pem: string): KeyObject {
  return createPublicKey(pem);
}

export function privateKeyFromPem(pem: string): KeyObject {
  return createPrivateKey(pem);
}

export function signBytes(message: string, privateKey: KeyObject): string {
  return nodeSign(null, Buffer.from(message, "utf8"), privateKey).toString("base64");
}

export function verifyBytes(
  message: string,
  signatureBase64: string,
  publicKey: KeyObject,
): boolean {
  let signature: Buffer;
  try {
    signature = Buffer.from(signatureBase64, "base64");
  } catch {
    return false;
  }
  if (signature.length === 0) return false;
  try {
    return nodeVerify(null, Buffer.from(message, "utf8"), publicKey, signature);
  } catch {
    return false;
  }
}
