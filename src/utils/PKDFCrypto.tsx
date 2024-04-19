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

    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    return key;
  } catch (error) {
    console.error("Error deriving keys from password:", error);
    throw error;
  }
};

const pkdf2EncryptMessage = async (plaintext, encryptionKey) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      encryptionKey,
      plaintextBuffer
    );
    return {
        iv,
        ciphertext,
    }
  };

  const bufferToString = (iv: ArrayBuffer) => {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(iv)));
  }

  const stringToBuffer = (ivString: string) => {
    return Uint8Array.from(atob(ivString), c => c.charCodeAt(0));
  }

  const pkdf2DecryptMessage = async (encryptedMessage, encryptionKey) => {
    const iv = encryptedMessage.iv;
    const ciphertext = encryptedMessage.ciphertext; 
  
    try {
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

  
  
  

const pkdfDemo = async () => {
  try {
    const userPassword = "password";
    const userSalt = window.crypto.getRandomValues(new Uint8Array(16));

    const derivedKey = await deriveKeysFromPassword(userPassword, userSalt);

    const message = "Hello, world!";

    // Encrypt the message
    const encryptedMessage = await encryptMessage(message, derivedKey);
    console.log("Encrypted Message:", encryptedMessage);

    // Decrypt the message
    const decryptedMessage = await decryptMessage(
      encryptedMessage,
      derivedKey,
    );
    console.log("Decrypted Message:", decryptedMessage);
  } catch (error) {
    console.error("Error during PKDF demo:", error);
  }
};

export { pkdf2DeriveKeysFromPassword, pkdf2EncryptMessage, pkdf2DecryptMessage, bufferToString, stringToBuffer, pkdfDemo };
