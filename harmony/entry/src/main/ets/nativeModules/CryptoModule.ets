import { UITurboModule } from '@rnoh/react-native-openharmony';
import { CryptoOperations, EncodedKeyPair } from './CryptoOperations';

export class CryptoModule extends UITurboModule {
  static readonly NAME: string = 'CryptoModule';
  private readonly operations: CryptoOperations = new CryptoOperations();

  aesEncryptSync(text: string, key: string, iv: string, mode: string): string { return this.operations.aesEncryptSync(text, key, iv, mode); }
  aesDecryptSync(text: string, key: string, iv: string, mode: string): string { return this.operations.aesDecryptSync(text, key, iv, mode); }
  aesEncrypt(text: string, key: string, iv: string, mode: string): Promise<string> { return this.operations.aesEncrypt(text, key, iv, mode); }
  aesDecrypt(text: string, key: string, iv: string, mode: string): Promise<string> { return this.operations.aesDecrypt(text, key, iv, mode); }
  rsaEncryptSync(text: string, key: string, padding: string): string { return this.operations.rsaEncryptSync(text, key, padding); }
  rsaDecryptSync(text: string, key: string, padding: string): string { return this.operations.rsaDecryptSync(text, key, padding); }
  rsaEncrypt(text: string, key: string, padding: string): Promise<string> { return this.operations.rsaEncrypt(text, key, padding); }
  rsaDecrypt(text: string, key: string, padding: string): Promise<string> { return this.operations.rsaDecrypt(text, key, padding); }
  generateRsaKey(): Promise<EncodedKeyPair> { return this.operations.generateRsaKey(); }
  sha1(text: string): Promise<string> { return this.operations.sha1(text); }
}
