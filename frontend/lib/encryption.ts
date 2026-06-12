/**
 * Helper to convert ArrayBuffer to hex string.
 */
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Helper to convert hex string to ArrayBuffer.
 */
function hexToBuf(hex: string): ArrayBuffer {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Get or create ECDH P-256 keypair for a specific address.
 * Key is persisted in localStorage.
 */
export async function getOrCreateECDHKeypair(address: string): Promise<{ publicKeyHex: string }> {
  if (typeof window === "undefined") {
    return { publicKeyHex: "" };
  }
  const key = address.toLowerCase();
  const pubStorageKey = `afterlife_ecdh_pub_${key}`;
  const privStorageKey = `afterlife_ecdh_priv_${key}`;

  const existingPub = localStorage.getItem(pubStorageKey);
  const existingPriv = localStorage.getItem(privStorageKey);

  if (existingPub && existingPriv) {
    return { publicKeyHex: existingPub };
  }

  // Generate new ECDH P-256 keypair
  const keypair = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  // Export keys
  const pubRaw = await window.crypto.subtle.exportKey("raw", keypair.publicKey);
  const pubHex = bufToHex(pubRaw);
  const privJwk = await window.crypto.subtle.exportKey("jwk", keypair.privateKey);

  localStorage.setItem(pubStorageKey, pubHex);
  localStorage.setItem(privStorageKey, JSON.stringify(privJwk));

  return { publicKeyHex: pubHex };
}

/**
 * Retrieve private key for decryption.
 */
async function getPrivateKey(address: string): Promise<CryptoKey | null> {
  if (typeof window === "undefined") return null;
  const key = address.toLowerCase();
  const privStorageKey = `afterlife_ecdh_priv_${key}`;
  const jwkStr = localStorage.getItem(privStorageKey);
  if (!jwkStr) return null;

  try {
    const jwk = JSON.parse(jwkStr);
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );
  } catch (err) {
    console.error("Failed to import private key:", err);
    return null;
  }
}

/**
 * Encrypt a message client-side using recipient's ECDH public key (ECIES style).
 * Returns ENC:v2:ivHex:ephemeralPubKeyHex:ciphertextHex
 */
export async function encryptMessageForRecipient(
  plaintext: string,
  recipientPubKeyHex: string
): Promise<string> {
  // 1. Generate ephemeral keypair
  const ephemeralKeypair = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  // 2. Import recipient's public key
  const recipientPubKey = await window.crypto.subtle.importKey(
    "raw",
    hexToBuf(recipientPubKeyHex),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  // 3. Derive shared secret key for AES-GCM
  const sharedKey = await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: recipientPubKey },
    ephemeralKeypair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // 4. Encrypt message
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    new TextEncoder().encode(plaintext)
  );

  // 5. Export ephemeral public key
  const ephemeralPubRaw = await window.crypto.subtle.exportKey(
    "raw",
    ephemeralKeypair.publicKey
  );

  const ivHex = bufToHex(iv.buffer);
  const ephemeralPubHex = bufToHex(ephemeralPubRaw);
  const ciphertextHex = bufToHex(ciphertext);

  return `ENC:v2:${ivHex}:${ephemeralPubHex}:${ciphertextHex}`;
}

/**
 * Decrypt a message using recipient's private key.
 */
export async function decryptMessageAsRecipient(
  ciphertextEnvelope: string,
  myAddress: string
): Promise<string> {
  if (!ciphertextEnvelope.startsWith("ENC:v2:")) {
    // If not encrypted, return legacy format
    return ciphertextEnvelope;
  }

  const parts = ciphertextEnvelope.split(":");
  if (parts.length !== 5) {
    throw new Error("Invalid cipher envelope format");
  }

  const ivHex = parts[2];
  const ephemeralPubHex = parts[3];
  const ciphertextHex = parts[4];

  // 1. Load my private key
  const myPrivateKey = await getPrivateKey(myAddress);
  if (!myPrivateKey) {
    throw new Error("Private key not found in storage. Ensure you are on the same browser/wallet.");
  }

  // 2. Import ephemeral public key
  const ephemeralPubKey = await window.crypto.subtle.importKey(
    "raw",
    hexToBuf(ephemeralPubHex),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  // 3. Derive shared secret key
  const sharedKey = await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: ephemeralPubKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // 4. Decrypt
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: hexToBuf(ivHex) },
    sharedKey,
    hexToBuf(ciphertextHex)
  );

  return new TextDecoder().decode(decrypted);
}
