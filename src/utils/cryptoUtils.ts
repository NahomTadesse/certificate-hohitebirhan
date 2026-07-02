import CryptoJS from "crypto-js";

export const encryptData = (data: string, secret: string): string => {
  return CryptoJS.AES.encrypt(data, secret).toString();
};

export const decryptData = (cipher: string, secret: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, secret);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
