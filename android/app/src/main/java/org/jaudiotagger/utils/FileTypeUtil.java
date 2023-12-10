package org.jaudiotagger.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class FileTypeUtil {
	private static final int BUFFER_SIZE = 4096;
	private static final int MAX_SIGNATURE_SIZE = 8;

	// PDF files starts with: %PDF
	// MS office files starts with: (D0 CF 11 E0 A1 B1 1A E1)
	// Java does not support byte literals. Use int literals instead.
	// private static final int[] pdfSig = { 0x25, 0x50, 0x44, 0x46 };
	// private static final int[] msOfficeSig = { 0xd0, 0xcf, 0x11, 0xe0, 0xa1,
	// 0xb1, 0x1a, 0xe1 };

	private static final Integer[] mp3v2Sig = { 0x49, 0x44, 0x33 };
	private static final Integer[] mp3v1Sig_1 = { 0xFF, 0xF3 };
	private static final Integer[] mp3v1Sig_2 = { 0xFF, 0xFA };
	private static final Integer[] mp3v1Sig_3 = { 0xFF, 0xF2 };
	private static final Integer[] mp3v1Sig_4 = { 0xFF, 0xFB };
	private static final Integer[] mp4Sig = { 0x00, 0x00, 0x00, null, 0x66, 0x74, 0x79, 0x70 };

	private static Map<String, Integer[]> signatureMap;
	private static Map<String, String> extensionMap;

	static {
		signatureMap = new HashMap<String, Integer[]>();
		signatureMap.put("MP3IDv2", mp3v2Sig);
		signatureMap.put("MP3IDv1_1", mp3v1Sig_1);
		signatureMap.put("MP3IDv1_2", mp3v1Sig_2);
		signatureMap.put("MP3IDv1_3", mp3v1Sig_3);
		signatureMap.put("MP3IDv1_4", mp3v1Sig_4);
		signatureMap.put("MP4", mp4Sig);
		
		extensionMap = new HashMap<String, String>();
		extensionMap.put("MP3IDv2", "mp3");
		extensionMap.put("MP3IDv1_1", "mp3");
		extensionMap.put("MP3IDv1_2", "mp3");
		extensionMap.put("MP3IDv1_3", "mp3");
		extensionMap.put("MP3IDv1_4", "mp3");
		extensionMap.put("MP4", "m4a");
		extensionMap.put("UNKNOWN", "");
	}
	
	public static String getMagicFileType(File f) throws IOException {
		byte[] buffer = new byte[BUFFER_SIZE];
		InputStream in = new FileInputStream(f);
		try {
			int n = in.read(buffer, 0, BUFFER_SIZE);
			int m = n;
			while ((m < MAX_SIGNATURE_SIZE) && (n > 0)) {
				n = in.read(buffer, m, BUFFER_SIZE - m);
				m += n;
			}

			String fileType = "UNKNOWN";
			for (Iterator<String> i = signatureMap.keySet().iterator(); i.hasNext();) {
				String key = i.next();
				if (matchesSignature(signatureMap.get(key), buffer, m)) {
					fileType = key;
					break;
				}
			}
			return fileType;
		} finally {
			in.close();
		}
	}

	public static String getMagicExt(String fileType){
		return extensionMap.get(fileType);
	}


	private static boolean matchesSignature(Integer[] signature, byte[] buffer, int size) {
		if (size < signature.length) {
			return false;
		}

		boolean b = true;
		for (int i = 0; i < signature.length; i++) {
			if (signature[i] != null) {
				if (signature[i] != (0x00ff & buffer[i])) {
					b = false;
					break;
				}
			}
		}

		return b;
	}

	
	public static void main(String[] args) throws IOException  {
		// if (args.length < 1) {
		// System.out.println("Usage: java TestExcelPDF <filename>");
		// System.exit(1);
		// }
		String testFileLoc = "C:/Users/keerthi/Dropbox/Works/Java/github/GaanaExtractor/workspace/jaudiotagger/testm4a";
		// FileTypeUtil t = new FileTypeUtil();
		String fileType = getMagicFileType(new File(testFileLoc));
		System.out.println("File type: " + fileType);
		System.out.println("File Extension: " + getMagicExt(fileType));
	}
}
