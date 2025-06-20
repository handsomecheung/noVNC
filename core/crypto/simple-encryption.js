/*
 * Simple WebSocket Encryption Layer
 * Uses AES-GCM with password-based key derivation
 */

export class SimpleEncryption {
  constructor() {
    this.key = null;
    this.ready = false;
    this.counter = 0;
  }

  async initializeFromPassword(password) {
    if (!password) {
      throw new Error("Password is required for encryption");
    }

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"],
    );

    // TODO fixed salt for now, to rewrite it using random salt
    const salt = encoder.encode("novnc-encryption-salt");

    this.key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );

    this.ready = true;
    console.log("Simple encryption initialized");
  }

  async encrypt(data) {
    if (!this.ready) {
      throw new Error("Encryption not initialized");
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      this.key,
      data,
    );

    const result = new Uint8Array(12 + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), 12);
    return result;
  }

  async decrypt(encryptedData) {
    if (!this.ready) {
      throw new Error("Encryption not initialized");
    }

    if (encryptedData.length < 12) {
      throw new Error("Invalid encrypted data length");
    }

    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      this.key,
      ciphertext,
    );

    return new Uint8Array(decrypted);
  }

  isReady() {
    return this.ready;
  }

  static async fromLocalStorage(storageKey) {
    const password = localStorage.getItem(storageKey);
    if (!password) {
      console.warn("No encryption key found in localStorage:", storageKey);
      return null;
    }

    const encryption = new SimpleEncryption();
    await encryption.initializeFromPassword(password);
    return encryption;
  }
}
