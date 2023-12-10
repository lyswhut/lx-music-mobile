/*
 * Entagged Audio Tag library
 * Copyright (c) 2004-2005 Christian Laireiter <liree@web.de>
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *  
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
package org.jaudiotagger.audio.asf.util;

import org.jaudiotagger.audio.asf.data.AsfHeader;
import org.jaudiotagger.audio.asf.data.GUID;
import org.jaudiotagger.logging.ErrorMessage;

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.Date;
import java.util.GregorianCalendar;

/**
 * Some static Methods which are used in several Classes. <br>
 *
 * @author Christian Laireiter
 */
public class Utils
{

    public static final long DIFF_BETWEEN_ASF_DATE_AND_JAVA_DATE = 11644470000000l;
    /**
     * Stores the default line separator of the current underlying system.
     */
    public final static String LINE_SEPARATOR = System.getProperty("line.separator"); //$NON-NLS-1$
    /**
     *
     */
    private static final int MAXIMUM_STRING_LENGTH_ALLOWED = 32766;

    /**
     * This method checks given string will not exceed limit in bytes[] when
     * converted UTF-16LE encoding (2 bytes per character) and checks whether
     * the length doesn't exceed 65535 bytes. <br>
     *
     * @param value The string to check.
     * @throws IllegalArgumentException If byte representation takes more than 65535 bytes.
     */
    public static void checkStringLengthNullSafe(String value) throws IllegalArgumentException
    {
        if (value != null)
        {
            if (value.length() > MAXIMUM_STRING_LENGTH_ALLOWED)
            {
                throw new IllegalArgumentException(ErrorMessage.WMA_LENGTH_OF_STRING_IS_TOO_LARGE.getMsg((value.length() * 2))
                );
            }
        }
    }

    /**
     * @param value String to check for null
     * @return true unless string is too long
     */
    public static boolean isStringLengthValidNullSafe(String value)
    {
        if (value != null)
        {
            if (value.length() > MAXIMUM_STRING_LENGTH_ALLOWED)
            {
                return false;
            }
        }
        return true;
    }

    /**
     * effectively copies a specified amount of bytes from one stream to
     * another.
     *
     * @param source stream to read from
     * @param dest   stream to write to
     * @param amount amount of bytes to copy
     * @throws IOException on I/O errors, and if the source stream depletes before all
     *                     bytes have been copied.
     */
    public static void copy(InputStream source, OutputStream dest, long amount) throws IOException
    {
        byte[] buf = new byte[8192];
        long copied = 0;
        while (copied < amount)
        {
            int toRead = 8192;
            if ((amount - copied) < 8192)
            {
                toRead = (int) (amount - copied);
            }
            int read = source.read(buf, 0, toRead);
            if (read == -1)
            {
                throw new IOException("Inputstream has to continue for another " + (amount - copied) + " bytes."
                );
            }
            dest.write(buf, 0, read);
            copied += read;
        }
    }

    /**
     * Copies all of the source to the destination.<br>
     *
     * @param source source to read from
     * @param dest   stream to write to
     * @throws IOException on I/O errors.
     */
    public static void flush(final InputStream source, final OutputStream dest) throws IOException
    {
        final byte[] buf = new byte[8192];
        int read;
        while ((read = source.read(buf)) != -1)
        {
            dest.write(buf, 0, read);
        }
    }

    /**
     * This method will create a byte[] at the size of <code>byteCount</code>
     * and insert the bytes of <code>value</code> (starting from lowset byte)
     * into it. <br>
     * You can easily create a Word (16-bit), DWORD (32-bit), QWORD (64 bit) out
     * of the value, ignoring the original type of value, since java
     * automatically performs transformations. <br>
     * <b>Warning: </b> This method works with unsigned numbers only.
     *
     * @param value     The value to be written into the result.
     * @param byteCount The number of bytes the array has got.
     * @return A byte[] with the size of <code>byteCount</code> containing the
     * lower byte values of <code>value</code>.
     */
    public static byte[] getBytes(final long value, final int byteCount)
    {
        byte[] result = new byte[byteCount];
        for (int i = 0; i < result.length; i++)
        {
            result[i] = (byte) ((value >>> (i * 8)) & 0xFF);
        }
        return result;
    }

    /**
     * Convenience method to convert the given string into a byte sequence which
     * has the format of the charset given.
     *
     * @param source  string to convert.
     * @param charset charset to apply
     * @return the source's binary representation according to the charset.
     */
    public static byte[] getBytes(final String source, final Charset charset)
    {
        assert charset != null;
        assert source != null;
        final ByteBuffer encoded = charset.encode(source);
        final byte[] result = new byte[encoded.limit()];
        encoded.rewind();
        encoded.get(result);
        return result;
    }

    /**
     * Since date values in ASF files are given in 100 ns steps since first
     * january of 1601 a little conversion must be done. <br>
     * This method converts a date given in described manner to a calendar.
     *
     * @param fileTime
     *            Time in 100ns since 1 jan 1601
     * @return Calendar holding the date representation.
     */
    /* Old method that ran very slowely and doesnt logical correct, how does dividing something
      at 10-4 by 10,000 convert it to 10 -3
    public static GregorianCalendar getDateOf(final BigInteger fileTime) {
        final GregorianCalendar result = new GregorianCalendar(1601, 0, 1);
        // lose anything beyond milliseconds, because calendar can't handle
        // less value
        BigInteger time = fileTime.divide(new BigInteger("10000")); //$NON-NLS-1$
        final BigInteger maxInt = new BigInteger(String
                .valueOf(Integer.MAX_VALUE));
        while (time.compareTo(maxInt) > 0) {
            result.add(Calendar.MILLISECOND, Integer.MAX_VALUE);
            time = time.subtract(maxInt);
        }
        result.add(Calendar.MILLISECOND, time.intValue());
        return result;
    }
    */

    /**
     * Date values in ASF files are given in 100 ns (10 exp -4) steps since first
     *
     * @param fileTime Time in 100ns since 1 jan 1601
     * @return Calendar holding the date representation.
     */
    public static GregorianCalendar getDateOf(final BigInteger fileTime)
    {
        final GregorianCalendar result = new GregorianCalendar();

        // Divide by 10 to convert from -4 to -3 (millisecs)
        BigInteger time = fileTime.divide(new BigInteger("10"));
        // Construct Date taking into the diff between 1601 and 1970
        Date date = new Date(time.longValue() - DIFF_BETWEEN_ASF_DATE_AND_JAVA_DATE);
        result.setTime(date);
        return result;
    }

    /**
     * Tests if the given string is <code>null</code> or just contains
     * whitespace characters.
     *
     * @param toTest String to test.
     * @return see description.
     */
    public static boolean isBlank(String toTest)
    {
        if (toTest == null)
        {
            return true;
        }

        for (int i = 0; i < toTest.length(); i++)
        {
            if (!Character.isWhitespace(toTest.charAt(i)))
            {
                return false;
            }
        }
        return true;
    }

    /**
     * Reads 8 bytes from stream and interprets them as a UINT64 which is
     * returned as {@link BigInteger}.<br>
     *
     * @param stream stream to readm from.
     * @return a BigInteger which represents the read 8 bytes value.
     * @throws IOException if problem reading bytes
     */
    public static BigInteger readBig64(InputStream stream) throws IOException
    {
        byte[] bytes = new byte[8];
        byte[] oa = new byte[8];
        int read = stream.read(bytes);
        if (read != 8)
        {
            // 8 bytes mandatory.
            throw new EOFException();
        }
        for (int i = 0; i < bytes.length; i++)
        {
            oa[7 - i] = bytes[i];
        }
        return new BigInteger(oa);
    }

    /**
     * Reads <code>size</code> bytes from the stream.<br>
     *
     * @param stream stream to read from.
     * @param size   amount of bytes to read.
     * @return the read bytes.
     * @throws IOException on I/O errors.
     */
    public static byte[] readBinary(InputStream stream, long size) throws IOException
    {
        byte[] result = new byte[(int) size];
        stream.read(result);
        return result;
    }

    /**
     * This method reads a UTF-16 String, which length is given on the number of
     * characters it consists of. <br>
     * The stream must be at the number of characters. This number contains the
     * terminating zero character (UINT16).
     *
     * @param stream Input source
     * @return String
     * @throws IOException read errors
     */
    public static String readCharacterSizedString(InputStream stream) throws IOException
    {
        StringBuilder result = new StringBuilder();
        int strLen = readUINT16(stream);
        int character = stream.read();
        character |= stream.read() << 8;
        do
        {
            if (character != 0)
            {
                result.append((char) character);
                character = stream.read();
                character |= stream.read() << 8;
            }
        }
        while (character != 0 || (result.length() + 1) > strLen);
        if (strLen != (result.length() + 1))
        {
            throw new IllegalStateException("Invalid Data for current interpretation"); //$NON-NLS-1$
        }
        return result.toString();
    }

    /**
     * This method reads a UTF-16 encoded String. <br>
     * For the use this method the number of bytes used by current string must
     * be known. <br>
     * The ASF specification recommends that those strings end with a
     * terminating zero. However it also says that it is not always the case.
     *
     * @param stream Input source
     * @param strLen Number of bytes the String may take.
     * @return read String.
     * @throws IOException read errors.
     */
    public static String readFixedSizeUTF16Str(InputStream stream, int strLen) throws IOException
    {
        byte[] strBytes = new byte[strLen];
        int read = stream.read(strBytes);
        if (read == strBytes.length)
        {
            if (strBytes.length >= 2)
            {
                /*
                 * Zero termination is recommended but optional. So check and
                 * if, remove.
                 */
                if (strBytes[strBytes.length - 1] == 0 && strBytes[strBytes.length - 2] == 0)
                {
                    byte[] copy = new byte[strBytes.length - 2];
                    System.arraycopy(strBytes, 0, copy, 0, strBytes.length - 2);
                    strBytes = copy;
                }
            }
            return new String(strBytes, "UTF-16LE");
        }
        throw new IllegalStateException("Couldn't read the necessary amount of bytes.");
    }

    /**
     * This Method reads a GUID (which is a 16 byte long sequence) from the
     * given <code>raf</code> and creates a wrapper. <br>
     * <b>Warning </b>: <br>
     * There is no way of telling if a byte sequence is a guid or not. The next
     * 16 bytes will be interpreted as a guid, whether it is or not.
     *
     * @param stream Input source.
     * @return A class wrapping the guid.
     * @throws IOException happens when the file ends before guid could be extracted.
     */
    public static GUID readGUID(InputStream stream) throws IOException
    {
        if (stream == null)
        {
            throw new IllegalArgumentException("Argument must not be null"); //$NON-NLS-1$
        }
        int[] binaryGuid = new int[GUID.GUID_LENGTH];
        for (int i = 0; i < binaryGuid.length; i++)
        {
            binaryGuid[i] = stream.read();
        }
        return new GUID(binaryGuid);
    }

    /**
     * Reads 2 bytes from stream and interprets them as UINT16.<br>
     *
     * @param stream stream to read from.
     * @return UINT16 value
     * @throws IOException on I/O Errors.
     */
    public static int readUINT16(InputStream stream) throws IOException
    {
        int result = stream.read();
        result |= stream.read() << 8;
        return result;
    }

    /**
     * Reads 4 bytes from stream and interprets them as UINT32.<br>
     *
     * @param stream stream to read from.
     * @return UINT32 value
     * @throws IOException on I/O Errors.
     */
    public static long readUINT32(InputStream stream) throws IOException
    {
        long result = 0;
        for (int i = 0; i <= 24; i += 8)
        {
            // Warning, always cast to long here. Otherwise it will be
            // shifted as int, which may produce a negative value, which will
            // then be extended to long and assign the long variable a negative
            // value.
            result |= (long) stream.read() << i;
        }
        return result;
    }

    /**
     * Reads long as little endian.
     *
     * @param stream Data source
     * @return long value
     * @throws IOException read error, or eof is reached before long is completed
     */
    public static long readUINT64(InputStream stream) throws IOException
    {
        long result = 0;
        for (int i = 0; i <= 56; i += 8)
        {
            // Warning, always cast to long here. Otherwise it will be
            // shifted as int, which may produce a negative value, which will
            // then be extended to long and assign the long variable a negative
            // value.
            result |= (long) stream.read() << i;
        }
        return result;
    }

    /**
     * This method reads a UTF-16 encoded String, beginning with a 16-bit value
     * representing the number of bytes needed. The String is terminated with as
     * 16-bit ZERO. <br>
     *
     * @param stream Input source
     * @return read String.
     * @throws IOException read errors.
     */
    public static String readUTF16LEStr(InputStream stream) throws IOException
    {
        int strLen = readUINT16(stream);
        byte[] buf = new byte[strLen];
        int read = stream.read(buf);
        if (read == strLen || (strLen == 0 && read == -1))
        {
            /*
             * Check on zero termination
             */
            if (buf.length >= 2)
            {
                if (buf[buf.length - 1] == 0 && buf[buf.length - 2] == 0)
                {
                    byte[] copy = new byte[buf.length - 2];
                    System.arraycopy(buf, 0, copy, 0, buf.length - 2);
                    buf = copy;
                }
            }
            return new String(buf, AsfHeader.ASF_CHARSET.name());
        }
        throw new IllegalStateException("Invalid Data for current interpretation"); //$NON-NLS-1$
    }

    /**
     * Writes the given value as UINT16 into the stream.
     *
     * @param number value to write.
     * @param out    stream to write into.
     * @throws IOException On I/O errors
     */
    public static void writeUINT16(int number, OutputStream out) throws IOException
    {
        if (number < 0)
        {
            throw new IllegalArgumentException("positive value expected."); //$NON-NLS-1$
        }
        byte[] toWrite = new byte[2];
        for (int i = 0; i <= 8; i += 8)
        {
            toWrite[i / 8] = (byte) ((number >> i) & 0xFF);
        }
        out.write(toWrite);
    }

    /**
     * Writes the given value as UINT32 into the stream.
     *
     * @param number value to write.
     * @param out    stream to write into.
     * @throws IOException On I/O errors
     */
    public static void writeUINT32(long number, OutputStream out) throws IOException
    {
        if (number < 0)
        {
            throw new IllegalArgumentException("positive value expected."); //$NON-NLS-1$
        }
        byte[] toWrite = new byte[4];
        for (int i = 0; i <= 24; i += 8)
        {
            toWrite[i / 8] = (byte) ((number >> i) & 0xFF);
        }
        out.write(toWrite);
    }

    /**
     * Writes the given value as UINT64 into the stream.
     *
     * @param number value to write.
     * @param out    stream to write into.
     * @throws IOException On I/O errors
     */
    public static void writeUINT64(long number, OutputStream out) throws IOException
    {
        if (number < 0)
        {
            throw new IllegalArgumentException("positive value expected."); //$NON-NLS-1$
        }
        byte[] toWrite = new byte[8];
        for (int i = 0; i <= 56; i += 8)
        {
            toWrite[i / 8] = (byte) ((number >> i) & 0xFF);
        }
        out.write(toWrite);
    }

}