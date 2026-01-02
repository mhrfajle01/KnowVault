export const cryptoUtils = {
  // Generate a random salt
  generateSalt: () => {
    return window.crypto.getRandomValues(new Uint8Array(16));
  },

  // Derive a key from a password and salt using PBKDF2
  deriveKey: async (password, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true, // Key MUST be extractable for recovery wrapping
      ["encrypt", "decrypt"]
    );
  },

  exportKey: async (key) => {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return new Uint8Array(exported);
  },

  importKey: async (rawKey) => {
    return window.crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  },

  generateRecoveryCode: () => {
    const array = new Uint8Array(8); // 8 bytes = 16 hex chars
    window.crypto.getRandomValues(array);
    const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    // Format as XXXX-XXXX-XXXX-XXXX
    return `${hex.slice(0,4)}-${hex.slice(4,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}`;
  },

  // Encrypt data object
  encrypt: async (data, key) => {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = enc.encode(JSON.stringify(data));

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encodedData
    );

    // Return as base64 strings for storage
    return {
      ciphertext: bufferToBase64(ciphertext),
      iv: bufferToBase64(iv),
      _encrypted: true // Marker flag
    };
  },

  // Decrypt data object
  decrypt: async (encryptedWrapper, key) => {
    // If not encrypted, return as is (migration support)
    if (!encryptedWrapper._encrypted) return encryptedWrapper;

    const iv = base64ToBuffer(encryptedWrapper.iv);
    const ciphertext = base64ToBuffer(encryptedWrapper.ciphertext);

    try {
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decryptedBuffer));
    } catch (e) {
      console.error("Decryption failed", e);
      throw new Error("Invalid password or corrupted data");
    }
  }
};

// Helpers for Base64 conversion
function bufferToBase64(buffer) {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
