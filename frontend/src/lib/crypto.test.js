import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateDEK,
  aesGcmEncrypt,
  aesGcmDecrypt,
  wrapDEK,
  unwrapDEK,
  encryptSecretsForAccount,
  decryptSecretsForAccount,
} from './crypto.js';

// Mock process.env for tests
beforeAll(() => {
  process.env.MASTER_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='; // base64 of 32 zero bytes
});

describe('Crypto functions', () => {
  it('should generate a 32-byte DEK', () => {
    const dek = generateDEK();
    expect(dek.length).toBe(32);
  });

  it('should encrypt and decrypt with AES-GCM', async () => {
    const key = generateDEK();
    const data = Buffer.from('test data');
    const encrypted = await aesGcmEncrypt(data, key);
    const decrypted = await aesGcmDecrypt(encrypted.ciphertext, encrypted.iv, encrypted.authTag, key);
    expect(decrypted).toEqual(data);
  });

  it('should fail decryption with wrong authTag', async () => {
    const key = generateDEK();
    const data = Buffer.from('test data');
    const encrypted = await aesGcmEncrypt(data, key);
    const wrongAuthTag = Buffer.from(encrypted.authTag);
    wrongAuthTag[0] ^= 1; // Flip a bit
    await expect(aesGcmDecrypt(encrypted.ciphertext, encrypted.iv, wrongAuthTag, key)).rejects.toThrow();
  });

  it('should wrap and unwrap DEK', async () => {
    const dek = generateDEK();
    const masterKey = Buffer.from(process.env.MASTER_KEY, 'base64');
    const wrapped = await wrapDEK(dek, masterKey);
    const unwrapped = await unwrapDEK(wrapped.ciphertext, wrapped.iv, wrapped.authTag, masterKey);
    expect(unwrapped).toEqual(dek);
  });

  it('should encrypt and decrypt secrets for account', async () => {
    const secrets = {
      apiKeyPrivate: 'private_key',
      apiSecret: 'secret',
      apiPassphrase: 'passphrase',
    };
    const encrypted = await encryptSecretsForAccount(secrets);
    const record = {
      dek_encrypted: encrypted.dek_encrypted,
      dek_iv: encrypted.dek_iv,
      dek_auth_tag: encrypted.dek_auth_tag,
      api_key_encrypted: encrypted.api_key_encrypted,
      api_key_iv: encrypted.api_key_iv,
      api_key_auth_tag: encrypted.api_key_auth_tag,
      api_secret_encrypted: encrypted.api_secret_encrypted,
      api_secret_iv: encrypted.api_secret_iv,
      api_secret_auth_tag: encrypted.api_secret_auth_tag,
      api_passphrase_encrypted: encrypted.api_passphrase_encrypted,
      api_passphrase_iv: encrypted.api_passphrase_iv,
      api_passphrase_auth_tag: encrypted.api_passphrase_auth_tag,
    };
    const decrypted = await decryptSecretsForAccount(record);
    expect(decrypted).toEqual(secrets);
  });

  it('should handle partial secrets', async () => {
    const secrets = {
      apiKeyPrivate: 'private_key',
      apiSecret: undefined,
      apiPassphrase: 'passphrase',
    };
    const encrypted = await encryptSecretsForAccount(secrets);
    const record = {
      dek_encrypted: encrypted.dek_encrypted,
      dek_iv: encrypted.dek_iv,
      dek_auth_tag: encrypted.dek_auth_tag,
      api_key_encrypted: encrypted.api_key_encrypted,
      api_key_iv: encrypted.api_key_iv,
      api_key_auth_tag: encrypted.api_key_auth_tag,
      api_secret_encrypted: null,
      api_secret_iv: null,
      api_secret_auth_tag: null,
      api_passphrase_encrypted: encrypted.api_passphrase_encrypted,
      api_passphrase_iv: encrypted.api_passphrase_iv,
      api_passphrase_auth_tag: encrypted.api_passphrase_auth_tag,
    };
    const decrypted = await decryptSecretsForAccount(record);
    expect(decrypted.apiKeyPrivate).toBe('private_key');
    expect(decrypted.apiSecret).toBeUndefined();
    expect(decrypted.apiPassphrase).toBe('passphrase');
  });
});
