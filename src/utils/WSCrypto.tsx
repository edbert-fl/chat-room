const generateKeyPair = async () => {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
};

const wsEncryptMessage = async (message, recipientPublicKey) => {
  const encryptedMessage = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    recipientPublicKey,
    new TextEncoder().encode(message)
  );
  return encryptedMessage;
};

const wsDecryptMessage = async (encryptedMessage, recipientPrivateKey) => {
  const decryptedMessage = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    recipientPrivateKey,
    encryptedMessage
  );
  return new TextDecoder().decode(decryptedMessage);
};

const exportPublicKeyToJWK = async (publicKey) => {
  const exportedKey = await crypto.subtle.exportKey("jwk", publicKey);
  return exportedKey;
};

const importPublicKeyFromJWK = async (exportedPublicKeyJWK) => {
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    exportedPublicKeyJWK,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
  return publicKey;
};

const arrayBufferToBase64 = ( buffer ) => {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }
  return window.btoa( binary );
}

const base64ToArrayBuffer = (base64String) => {
  const binaryString = window.atob(base64String);
  const length = binaryString.length;
  const uint8Array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array.buffer;
};

const runDemo = async () => {
  const recipientKeyPair = await generateKeyPair();

  const recipientPublicKey = recipientKeyPair.publicKey;

  const recipientPrivateKey = recipientKeyPair.privateKey;

  const exportedPublicKey = await exportPublicKeyToJWK(recipientPublicKey);

  const importedPublicKey = await importPublicKeyFromJWK(exportedPublicKey);

  const messageToSend = "Hello, World!";

  const encryptedMessage = await wsEncryptMessage(
    messageToSend,
    importedPublicKey
  );

  console.log("Encrypted message:", new Uint8Array(encryptedMessage));

  const decryptedMessage = await wsDecryptMessage(
    encryptedMessage,
    recipientPrivateKey
  );

  console.log("Decrypted message:", decryptedMessage);
};

export {
  generateKeyPair,
  wsEncryptMessage,
  wsDecryptMessage,
  exportPublicKeyToJWK,
  importPublicKeyFromJWK,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  runDemo,
};
