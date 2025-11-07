import { webcrypto } from 'crypto';
import * as cryptoNode from 'crypto';

const crypto = webcrypto;

export function getMasterKey() {
  const key = process.env.MASTER_KEY;
  if (!key) {
    throw new Error('MASTER_KEY environment variable is not set');
  }
  const buffer = Buffer.from(key, 'base64');
  if (buffer.length !== 32) {
    throw new Error('MASTER_KEY must be a base64-encoded 32-byte key');
  }
  return buffer;
}

export function generateDEK() {
  return cryptoNode.randomBytes(32);
}

export async function aesGcmEncrypt(buf, key) {
  const keyObj = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, keyObj, buf);
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -16);
  const authTag = encryptedArray.slice(-16);
  return { ciphertext: Buffer.from(ciphertext), iv: Buffer.from(iv), authTag: Buffer.from(authTag) };
}

export async function aesGcmDecrypt(ciphertext, iv, authTag, key) {
  const keyObj = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
  const encrypted = new Uint8Array(ciphertext.length + authTag.length);
  encrypted.set(ciphertext);
  encrypted.set(authTag, ciphertext.length);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyObj, encrypted);
  return Buffer.from(decrypted);
}

export async function wrapDEK(dek, masterKey) {
  return await aesGcmEncrypt(dek, masterKey);
}

export async function unwrapDEK(dekEncrypted, dekIv, dekAuthTag, masterKey) {
  return await aesGcmDecrypt(dekEncrypted, dekIv, dekAuthTag, masterKey);
}

export async function encryptSecretsForAccount({ apiKeyPrivate, apiSecret, apiPassphrase }) {
  const masterKey = getMasterKey();
  const dek = generateDEK();
  const wrappedDek = await wrapDEK(dek, masterKey);

  const result = {
    dek_encrypted: wrappedDek.ciphertext,
    dek_iv: wrappedDek.iv,
    dek_auth_tag: wrappedDek.authTag,
  };

  if (apiKeyPrivate) {
    const encrypted = await aesGcmEncrypt(Buffer.from(apiKeyPrivate, 'utf8'), dek);
    result.api_key_encrypted = encrypted.ciphertext;
    result.api_key_iv = encrypted.iv;
    result.api_key_auth_tag = encrypted.authTag;
  }

  if (apiSecret) {
    const encrypted = await aesGcmEncrypt(Buffer.from(apiSecret, 'utf8'), dek);
    result.api_secret_encrypted = encrypted.ciphertext;
    result.api_secret_iv = encrypted.iv;
    result.api_secret_auth_tag = encrypted.authTag;
  }

  if (apiPassphrase) {
    const encrypted = await aesGcmEncrypt(Buffer.from(apiPassphrase, 'utf8'), dek);
    result.api_passphrase_encrypted = encrypted.ciphertext;
    result.api_passphrase_iv = encrypted.iv;
    result.api_passphrase_auth_tag = encrypted.authTag;
  }

  return result;
}

export async function decryptSecretsForAccount(record) {
  const masterKey = getMasterKey();
  const dek = await unwrapDEK(record.dek_encrypted, record.dek_iv, record.dek_auth_tag, masterKey);

  const result = {};

  if (record.api_key_encrypted) {
    const decrypted = await aesGcmDecrypt(record.api_key_encrypted, record.api_key_iv, record.api_key_auth_tag, dek);
    result.apiKeyPrivate = decrypted.toString('utf8');
  }

  if (record.api_secret_encrypted) {
    const decrypted = await aesGcmDecrypt(record.api_secret_encrypted, record.api_secret_iv, record.api_secret_auth_tag, dek);
    result.apiSecret = decrypted.toString('utf8');
  }

  if (record.api_passphrase_encrypted) {
    const decrypted = await aesGcmDecrypt(record.api_passphrase_encrypted, record.api_passphrase_iv, record.api_passphrase_auth_tag, dek);
    result.apiPassphrase = decrypted.toString('utf8');
  }

  return result;
}
