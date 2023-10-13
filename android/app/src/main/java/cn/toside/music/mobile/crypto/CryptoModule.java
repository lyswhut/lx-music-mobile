package cn.toside.music.mobile.crypto;

import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import java.security.Key;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.security.spec.PKCS8EncodedKeySpec;

public class CryptoModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;

  CryptoModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "CryptoModule";
  }

  @ReactMethod
  public void generateRsaKey(Promise promise) {
    KeyPair kp = RSA.getKeyPair();
    String publicKeyBytesBase64 = new String(Base64.encode(kp.getPublic().getEncoded(), Base64.DEFAULT));

    KeyFactory keyFac;
    try {
      keyFac = KeyFactory.getInstance("RSA");
    } catch (NoSuchAlgorithmException e) {
      promise.reject("-1", e.toString());
      return;
    }
    KeySpec keySpec = new PKCS8EncodedKeySpec(kp.getPrivate().getEncoded());
    Key key;
    try {
      key = keyFac.generatePrivate(keySpec);
    } catch (InvalidKeySpecException e) {
      promise.reject("-1", e.toString());
      return;
    }
    String privateKeyBytesBase64 = new String(Base64.encode(key.getEncoded(), Base64.DEFAULT));
    WritableMap params = Arguments.createMap();
    params.putString("publicKey", publicKeyBytesBase64);
    params.putString("privateKey", privateKeyBytesBase64);
    promise.resolve(params);
  }

  @ReactMethod
  public void rsaEncrypt(String text, String key, String padding, Promise promise) {
    promise.resolve(RSA.encryptRSAToString(text, key, padding));
    //    TaskRunner taskRunner = new TaskRunner();
    //    try {
    //      taskRunner.executeAsync(new GzipModule.UnGzip(source, target, force), (String errMessage) -> {
    //        if ("".equals(errMessage)) {
    //          promise.resolve(null);
    //        } else promise.reject("-2", errMessage);
    //      });
    //    } catch (RuntimeException err) {
    //      promise.reject("-2", err.getMessage());
    //    }
  }

  @ReactMethod
  public void rsaDecrypt(String text, String key, String padding, Promise promise) {
    promise.resolve(RSA.decryptRSAToString(text, key, padding));
    //    TaskRunner taskRunner = new TaskRunner();
    //    try {
    //      taskRunner.executeAsync(new GzipModule.UnGzip(source, target, force), (String errMessage) -> {
    //        if ("".equals(errMessage)) {
    //          promise.resolve(null);
    //        } else promise.reject("-2", errMessage);
    //      });
    //    } catch (RuntimeException err) {
    //      promise.reject("-2", err.getMessage());
    //    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String rsaEncryptSync(String text, String key, String padding) {
    return RSA.encryptRSAToString(text, key, padding);
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String rsaDecryptSync(String text, String key, String padding) {
    return RSA.decryptRSAToString(text, key, padding);
  }

  @ReactMethod
  public void aesEncrypt(String text, String key, String iv, String mode, Promise promise) {
    promise.resolve(AES.encrypt(text, key, iv, mode));
    //    TaskRunner taskRunner = new TaskRunner();
    //    try {
    //      taskRunner.executeAsync(new GzipModule.UnGzip(source, target, force), (String errMessage) -> {
    //        if ("".equals(errMessage)) {
    //          promise.resolve(null);
    //        } else promise.reject("-2", errMessage);
    //      });
    //    } catch (RuntimeException err) {
    //      promise.reject("-2", err.getMessage());
    //    }
  }

  @ReactMethod
  public void aesDecrypt(String text, String key, String iv, String mode, Promise promise) {
    promise.resolve(AES.decrypt(text, key, iv, mode));
    //    TaskRunner taskRunner = new TaskRunner();
    //    try {
    //      taskRunner.executeAsync(new GzipModule.UnGzip(source, target, force), (String errMessage) -> {
    //        if ("".equals(errMessage)) {
    //          promise.resolve(null);
    //        } else promise.reject("-2", errMessage);
    //      });
    //    } catch (RuntimeException err) {
    //      promise.reject("-2", err.getMessage());
    //    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String aesEncryptSync(String text, String key, String iv, String mode) {
    return AES.encrypt(text, key, iv, mode);
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String aesDecryptSync(String text, String key, String iv, String mode) {
    return AES.decrypt(text, key, iv, mode);
  }

}

