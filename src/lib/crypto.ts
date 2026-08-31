import CryptoJS from 'crypto-js';

// Default Master Salt for E2EE context
const E2EE_APP_SALT = '7KAIH_SECURE_E2EE_VAULT_2026';

export class E2EEService {
  /**
   * Encrypts private reflection / sensitive notes with AES-256
   */
  static encrypt(plainText: string, userKey: string = E2EE_APP_SALT): string {
    if (!plainText) return '';
    try {
      const derivedKey = CryptoJS.PBKDF2(userKey, E2EE_APP_SALT, {
        keySize: 256 / 32,
        iterations: 1000
      }).toString();
      
      const encrypted = CryptoJS.AES.encrypt(plainText, derivedKey).toString();
      return encrypted;
    } catch (e) {
      console.error('Encryption failed:', e);
      return plainText;
    }
  }

  /**
   * Decrypts AES-256 cipher string back to plain text
   */
  static decrypt(cipherText: string, userKey: string = E2EE_APP_SALT): string {
    if (!cipherText) return '';
    try {
      const derivedKey = CryptoJS.PBKDF2(userKey, E2EE_APP_SALT, {
        keySize: 256 / 32,
        iterations: 1000
      }).toString();

      const bytes = CryptoJS.AES.decrypt(cipherText, derivedKey);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText || '[Teks Terenkripsi E2EE]';
    } catch (e) {
      console.warn('Decryption failed, returning raw/fallback:', e);
      return cipherText;
    }
  }

  /**
   * Generates a cryptographic SHA-256 verification hash
   */
  static generateHash(content: string): string {
    return CryptoJS.SHA256(content).toString().substring(0, 16);
  }

  /**
   * Generates a secure random alphanumeric password
   */
  static generateSecurePassword(length = 10): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
