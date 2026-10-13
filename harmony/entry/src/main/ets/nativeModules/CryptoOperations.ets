import cryptoFramework from '@ohos.security.cryptoFramework';
import util from '@ohos.util';
import buffer from '@ohos.buffer';

export interface EncodedKeyPair {
  publicKey: string;
  privateKey: string;
}

export class CryptoOperations {
  private readonly base64: util.Base64Helper = new util.Base64Helper();

  private decode(value: string): Uint8Array {
    if (!value) return new Uint8Array(0);
    return this.base64.decodeSync(value.replace(/\s/g, ''));
  }

  private encode(value: Uint8Array): string {
    return this.base64.encodeToStringSync(value);
  }

  private aes(text: string, key: string, iv: string, mode: string, encrypt: boolean): string {
    const keyBytes = this.decode(key);
    if (![16, 24, 32].includes(keyBytes.length)) throw new Error('Invalid AES key length');
    let blockMode: string;
    let padding: string;
    if (mode === 'AES/CBC/PKCS7Padding') {
      blockMode = 'CBC';
      padding = 'PKCS7';
    } else if (mode === 'AES' || mode === 'AES/ECB/PKCS7Padding' || mode === 'AES/ECB/PKCS5Padding') {
      blockMode = 'ECB';
      padding = 'PKCS7';
    } else if (mode === 'AES/ECB/NoPadding') {
      blockMode = 'ECB';
      padding = 'NoPadding';
    } else {
      throw new Error('Unsupported AES mode');
    }
    const algorithm = `AES${keyBytes.length * 8}`;
    const secretKey = cryptoFramework.createSymKeyGenerator(algorithm).convertKeySync({ data: keyBytes });
    const cipher = cryptoFramework.createCipher(`${algorithm}|${blockMode}|${padding}`);
    let params: cryptoFramework.IvParamsSpec | null = null;
    if (blockMode === 'CBC') {
      if (!iv) throw new Error('CBC requires an IV');
      const ivBytes = new Uint8Array(16);
      ivBytes.set(this.decode(iv).subarray(0, 16));
      params = { algName: 'IvParamsSpec', iv: { data: ivBytes } };
    }
    cipher.initSync(encrypt ? cryptoFramework.CryptoMode.ENCRYPT_MODE : cryptoFramework.CryptoMode.DECRYPT_MODE, secretKey, params);
    const input = this.decode(text);
    const result: cryptoFramework.DataBlob | null = cipher.doFinalSync(input.length ? { data: input } : null);
    if (!result || !result.data.length) return '';
    return encrypt ? this.encode(result.data) : buffer.from(result.data).toString('utf8');
  }

  aesEncryptSync(text: string, key: string, iv: string, mode: string): string {
    return this.aes(text, key, iv, mode, true);
  }

  aesDecryptSync(text: string, key: string, iv: string, mode: string): string {
    return this.aes(text, key, iv, mode, false);
  }

  async aesEncrypt(text: string, key: string, iv: string, mode: string): Promise<string> {
    return this.aesEncryptSync(text, key, iv, mode);
  }

  async aesDecrypt(text: string, key: string, iv: string, mode: string): Promise<string> {
    return this.aesDecryptSync(text, key, iv, mode);
  }

  private rsa(text: string, key: string, padding: string, encrypt: boolean): string {
    const generator = cryptoFramework.createAsyKeyGenerator('RSA2048');
    const keyBlob: cryptoFramework.DataBlob = { data: this.decode(key) };
    const keyPair = generator.convertKeySync(encrypt ? keyBlob : null, encrypt ? null : keyBlob);
    const rsaKey: cryptoFramework.Key = encrypt ? keyPair.pubKey : keyPair.priKey;
    const modulus = (encrypt ? keyPair.pubKey : keyPair.priKey).getAsyKeySpec(cryptoFramework.AsyKeySpecItem.RSA_N_BN) as bigint;
    const algorithm = `RSA${modulus.toString(2).length}`;
    let transformation: string;
    if (padding === 'RSA/ECB/OAEPWithSHA1AndMGF1Padding') {
      transformation = `${algorithm}|PKCS1_OAEP|SHA1|MGF1_SHA1`;
    } else if (padding === 'RSA/ECB/NoPadding') {
      transformation = `${algorithm}|NoPadding`;
    } else {
      throw new Error('Unsupported RSA padding');
    }
    const cipher = cryptoFramework.createCipher(transformation);
    cipher.initSync(encrypt ? cryptoFramework.CryptoMode.ENCRYPT_MODE : cryptoFramework.CryptoMode.DECRYPT_MODE, rsaKey, null);
    const result = cipher.doFinalSync({ data: this.decode(text) }).data;
    return encrypt ? this.encode(result) : buffer.from(result).toString('utf8');
  }

  rsaEncryptSync(text: string, key: string, padding: string): string {
    return this.rsa(text, key, padding, true);
  }

  rsaDecryptSync(text: string, key: string, padding: string): string {
    return this.rsa(text, key, padding, false);
  }

  async rsaEncrypt(text: string, key: string, padding: string): Promise<string> {
    return this.rsaEncryptSync(text, key, padding);
  }

  async rsaDecrypt(text: string, key: string, padding: string): Promise<string> {
    return this.rsaDecryptSync(text, key, padding);
  }

  async generateRsaKey(): Promise<EncodedKeyPair> {
    const pair = await cryptoFramework.createAsyKeyGenerator('RSA2048').generateKeyPair();
    return { publicKey: this.encode(pair.pubKey.getEncoded().data), privateKey: this.encode(pair.priKey.getEncoded().data) };
  }

  async sha1(text: string): Promise<string> {
    if (text.length === 0) return 'da39a3ee5e6b4b0d3255bfef95601890afd80709';
    const digest = cryptoFramework.createMd('SHA1');
    const encoded = new util.TextEncoder().encodeInto(text);
    if (encoded.length) await digest.update({ data: encoded });
    const result = await digest.digest();
    return buffer.from(result.data).toString('hex');
  }
}
