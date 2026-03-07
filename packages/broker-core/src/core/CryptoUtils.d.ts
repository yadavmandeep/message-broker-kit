/**
 * Utility to recursively encrypt/decrypt specific fields in an object payload.
 */
export declare class CryptoUtils {
    static encrypt(value: string | object, secretKey: string): string;
    static decrypt(cipherTextWithIV: string, secretKey: string): string;
    static processPayload(payload: any, fields: string[], operation: 'encrypt' | 'decrypt', secretKey: string): any;
}
//# sourceMappingURL=CryptoUtils.d.ts.map