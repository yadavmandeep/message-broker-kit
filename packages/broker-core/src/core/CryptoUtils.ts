import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

/**
 * Utility to recursively encrypt/decrypt specific fields in an object payload.
 */
export class CryptoUtils {

  public static encrypt(value: string | object, secretKey: string): string {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(secretKey, 'utf8'); // Must be 32 bytes for AES-256
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let stringified = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    let encrypted = cipher.update(stringified, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Store IV along with ciphertext
    return `${iv.toString('hex')}:${encrypted}`;
  }

  public static decrypt(cipherTextWithIV: string, secretKey: string): string {
    const parts = cipherTextWithIV.split(':');
    if (parts.length !== 2) return cipherTextWithIV; // Fallback if plain

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = Buffer.from(secretKey, 'utf8');
    
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error('[CryptoUtils] Decryption failed.', e);
        return cipherTextWithIV; // Return original on failure
    }
  }

  public static processPayload(payload: any, fields: string[], operation: 'encrypt' | 'decrypt', secretKey: string) {
    if (!payload || typeof payload !== 'object' || fields.length === 0) return payload;

    // Shallow copy for simple cases, deep copy recommended in prod but we'll manipulate directly for performance
    const newPayload = JSON.parse(JSON.stringify(payload)); 

    const traverse = (obj: any, currentPath: string) => {
      for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        const path = currentPath ? `${currentPath}.${key}` : key;
        
        if (fields.includes(path) || fields.includes(key)) { // Support exact match or dot notation
           if (typeof obj[key] === 'string' && operation === 'decrypt') {
              obj[key] = this.decrypt(obj[key], secretKey);
              // Attempt to parse back if it was stringified object
              try {
                  obj[key] = JSON.parse(obj[key]);
              } catch (_) {}
           } else if (operation === 'encrypt') {
              obj[key] = this.encrypt(obj[key], secretKey);
           }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
           traverse(obj[key], path);
        }
      }
    };

    traverse(newPayload, '');
    return newPayload;
  }
}
