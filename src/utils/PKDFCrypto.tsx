import hmac from "crypto-js/hmac";

const pkdf2DeriveKeysFromPassword = async (password, salt) => {
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password + salt),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    const encryptionKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array([
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
        ]),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // Derive HMAC key
    const hmacKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array([
          17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
        ]),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign", "verify"]
    );

    return { encryptionKey, hmacKey };
  } catch (error) {
    console.error("Error deriving keys from password:", error);
    throw error;
  }
};

const pkdf2EncryptMessage = async (plaintext, derivedKeys) => {
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const encryptionKey = derivedKeys.encryptionKey;
    const hmacKey = derivedKeys.hmacKey;

    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      encryptionKey,
      plaintextBuffer
    );

    const hmac = await window.crypto.subtle.sign(
      { name: "HMAC" },
      hmacKey,
      new Uint8Array(ciphertext)
    );

    const hmacHex = Array.prototype.map
      .call(new Uint8Array(hmac), (x) => ("00" + x.toString(16)).slice(-2))
      .join("");

    return {
      iv,
      ciphertext,
      hmac: hmacHex,
    };
  } catch (error) {
    console.error("Error encrypting message:", error);
    throw error;
  }
};

const pkdf2DecryptMessage = async (
  encryptedMessage,
  derivedKeys
) => {
  const iv = encryptedMessage.iv;
  const ciphertext = encryptedMessage.ciphertext;
  const receivedHmac = encryptedMessage.hmac;
  const encryptionKey = derivedKeys.encryptionKey;
  const hmacKey = derivedKeys.hmacKey;
  
  try {
    const hmac = await window.crypto.subtle.sign(
      { name: "HMAC" },
      hmacKey,
      new Uint8Array(ciphertext)
    );

    const computedHmac = Array.prototype.map
      .call(new Uint8Array(hmac), (x) => ("00" + x.toString(16)).slice(-2))
      .join("");

    if (receivedHmac !== computedHmac) {
      throw new Error(
        "HMAC verification failed. Message may have been tampered with."
      );
    }

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      encryptionKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    const decryptedPlaintext = decoder.decode(decryptedBuffer);

    return decryptedPlaintext;
  } catch (error) {
    console.error("Error decrypting message:", error);
    throw error;
  }
};

const bufferToString = (iv: ArrayBuffer) => {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(iv)));
};

const stringToBuffer = (ivString: string) => {
  return Uint8Array.from(atob(ivString), (c) => c.charCodeAt(0));
};

const pbkdf2KeyToString = async (key) => {
  const exportedKey = await window.crypto.subtle.exportKey("jwk", key);
  console.log(exportedKey);
  return JSON.stringify(exportedKey);
};

const stringToPbkdf2Key = async (encodedKey: string) => {
  const jwkKey = JSON.parse(encodedKey);
  const importedKey = await window.crypto.subtle.importKey(
    "jwk",
    jwkKey,
    { name: "PBKDF2" },
    false,
    ["encrypt", "decrypt"]
  );
  return importedKey;
};

const pkdfDemo = async () => {
  try {
    const userPassword = "password";
    const userSalt = window.crypto.getRandomValues(new Uint8Array(16));

    const derivedKeys = await deriveKeysFromPassword(userPassword, userSalt);

    const message = "Hello, world!";

    // Encrypt the message
    const encryptedMessage = await pkdf2EncryptMessage(message, derivedKeys);
    console.log("Encrypted Message:", encryptedMessage);

    // Decrypt the message
    const decryptedMessage = await pkdf2DecryptMessage(encryptedMessage, derivedKeys);
    console.log("Decrypted Message:", decryptedMessage);
  } catch (error) {
    console.error("Error during PKDF demo:", error);
  }
};

export {
  pkdf2DeriveKeysFromPassword,
  pkdf2EncryptMessage,
  pkdf2DecryptMessage,
  pbkdf2KeyToString,
  stringToPbkdf2Key,
  bufferToString,
  stringToBuffer,
  pkdfDemo,
};
