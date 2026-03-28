package cn.toside.music.mobile.crypto;

import android.util.Base64;

import java.nio.charset.StandardCharsets;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class AES {
  private static final String AES_MODE_CBC_PKCS7Padding = "AES/CBC/PKCS7Padding";
  private static final String AES_MODE_ECB_NoPadding = "AES/ECB/NoPadding";

  private static byte[] decodeBase64(String data) {
    return Base64.decode(data, Base64.DEFAULT);
  }

  private static String encodeBase64(byte[] data) {
    return new String(Base64.encode(data, Base64.NO_WRAP), StandardCharsets.UTF_8);
  }

  public static String encrypt(byte[] data, byte[] key, byte[] iv, String mode) {
    String encryptedBase64 = "";
    try {
      Cipher cipher = Cipher.getInstance(mode);
      SecretKeySpec secretKeySpec = new SecretKeySpec(key, "AES");
      byte[] finalIvs = new byte[16];
      int len = Math.min(iv.length, 16);
      System.arraycopy(iv, 0, finalIvs, 0, len);
      IvParameterSpec ivps = new IvParameterSpec(finalIvs);
      cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, ivps);
      encryptedBase64 = encodeBase64(cipher.doFinal(data));
    } catch (Exception e) {
      e.printStackTrace();
    }

    return encryptedBase64;
  }

  public static String encrypt(byte[] data, byte[] key, String mode) {
    String encryptedBase64 = "";
    try {
      Cipher cipher = Cipher.getInstance(mode);
      SecretKeySpec secretKeySpec = new SecretKeySpec(key, "AES");
      cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
      encryptedBase64 = encodeBase64(cipher.doFinal(data));
    } catch (Exception e) {
      e.printStackTrace();
    }

    return encryptedBase64;
  }

  public static String encrypt(String data, String key, String iv, String mode) {
    return "".equals(iv) ? encrypt(decodeBase64(data), decodeBase64(key), mode)
      : encrypt(decodeBase64(data), decodeBase64(key), decodeBase64(iv), mode);
  }


  public static String decrypt(byte[] data, byte[] key, byte[] iv, String mode) {
    String decryptedString = "";
    try {
      Cipher cipher = Cipher.getInstance(mode);
      SecretKeySpec secretKeySpec = new SecretKeySpec(key, "AES");
      byte[] finalIvs = new byte[16];
      int len = Math.min(iv.length, 16);
      System.arraycopy(iv, 0, finalIvs, 0, len);
      IvParameterSpec ivps = new IvParameterSpec(finalIvs);
      cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, ivps);
      decryptedString = new String(cipher.doFinal(data), StandardCharsets.UTF_8);
    } catch (Exception e) {
      e.printStackTrace();
    }

    return decryptedString;
  }

  public static String decrypt(byte[] data, byte[] key, String mode) {
    String decryptedString = "";
    try {
      Cipher cipher = Cipher.getInstance(mode);
      SecretKeySpec secretKeySpec = new SecretKeySpec(key, "AES");
      cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
      decryptedString = new String(cipher.doFinal(data), StandardCharsets.UTF_8);
    } catch (Exception e) {
      e.printStackTrace();
    }

    return decryptedString;
  }

  public static String decrypt(String data, String key, String iv, String mode) {
    return "".equals(iv) ? decrypt(decodeBase64(data), decodeBase64(key), mode)
      : decrypt(decodeBase64(data), decodeBase64(key), decodeBase64(iv), mode);
  }

}
