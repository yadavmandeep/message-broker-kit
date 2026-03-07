"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtils = void 0;
const crypto = __importStar(require("crypto"));
const ALGORITHM = 'aes-256-cbc';
/**
 * Utility to recursively encrypt/decrypt specific fields in an object payload.
 */
class CryptoUtils {
    static encrypt(value, secretKey) {
        const iv = crypto.randomBytes(16);
        const key = Buffer.from(secretKey, 'utf8'); // Must be 32 bytes for AES-256
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let stringified = typeof value === 'object' ? JSON.stringify(value) : String(value);
        let encrypted = cipher.update(stringified, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        // Store IV along with ciphertext
        return `${iv.toString('hex')}:${encrypted}`;
    }
    static decrypt(cipherTextWithIV, secretKey) {
        const parts = cipherTextWithIV.split(':');
        if (parts.length !== 2)
            return cipherTextWithIV; // Fallback if plain
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const key = Buffer.from(secretKey, 'utf8');
        try {
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (e) {
            console.error('[CryptoUtils] Decryption failed.', e);
            return cipherTextWithIV; // Return original on failure
        }
    }
    static processPayload(payload, fields, operation, secretKey) {
        if (!payload || typeof payload !== 'object' || fields.length === 0)
            return payload;
        // Shallow copy for simple cases, deep copy recommended in prod but we'll manipulate directly for performance
        const newPayload = JSON.parse(JSON.stringify(payload));
        const traverse = (obj, currentPath) => {
            for (const key in obj) {
                if (!obj.hasOwnProperty(key))
                    continue;
                const path = currentPath ? `${currentPath}.${key}` : key;
                if (fields.includes(path) || fields.includes(key)) { // Support exact match or dot notation
                    if (typeof obj[key] === 'string' && operation === 'decrypt') {
                        obj[key] = this.decrypt(obj[key], secretKey);
                        // Attempt to parse back if it was stringified object
                        try {
                            obj[key] = JSON.parse(obj[key]);
                        }
                        catch (_) { }
                    }
                    else if (operation === 'encrypt') {
                        obj[key] = this.encrypt(obj[key], secretKey);
                    }
                }
                else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    traverse(obj[key], path);
                }
            }
        };
        traverse(newPayload, '');
        return newPayload;
    }
}
exports.CryptoUtils = CryptoUtils;
