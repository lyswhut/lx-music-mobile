/**
 *  @author : Paul Taylor
 *  @author : Eric Farng
 *
 *  Version @version:$Id$
 *
 *  MusicTag Copyright (C)2003,2004
 *
 *  This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 *  General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 *  or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 *  the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *  See the GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License along with this library; if not,
 *  you can get a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * Description:
 *
 */
package org.jaudiotagger.tag.datatype;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.tag.InvalidDataTypeException;
import org.jaudiotagger.tag.id3.AbstractTagFrameBody;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;

import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CharsetEncoder;


/**
 * Represents a fixed length String, whereby the length of the String is known. The String
 * will be encoded based upon the text encoding of the frame that it belongs to.
 */
public class StringFixedLength extends AbstractString
{
    /**
     * Creates a new ObjectStringFixedsize datatype.
     *
     * @param identifier
     * @param frameBody
     * @param size
     * @throws IllegalArgumentException
     */
    public StringFixedLength(String identifier, AbstractTagFrameBody frameBody, int size)
    {
        super(identifier, frameBody);
        if (size < 0)
        {
            throw new IllegalArgumentException("size is less than zero: " + size);
        }
        setSize(size);
    }

    public StringFixedLength(StringFixedLength copyObject)
    {
        super(copyObject);
        this.size = copyObject.size;
    }

    /**
     * @param obj
     * @return if obj is equivalent to this
     */
    public boolean equals(Object obj)
    {
        if (!(obj instanceof StringFixedLength))
        {
            return false;
        }
        StringFixedLength object = (StringFixedLength) obj;
        return this.size == object.size && super.equals(obj);
    }

    /**
     * Read a string from buffer of fixed size(size has already been set in constructor)
     *
     * @param arr    this is the buffer for the frame
     * @param offset this is where to start reading in the buffer for this field
     */
    public void readByteArray(byte[] arr, int offset) throws InvalidDataTypeException
    {
        logger.config("Reading from array from offset:" + offset);
        try
        {
            final CharsetDecoder decoder = getTextEncodingCharSet().newDecoder();

            //Decode buffer if runs into problems should through exception which we
            //catch and then set value to empty string.
            logger.finest("Array length is:" + arr.length + "offset is:" + offset + "Size is:" + size);


            if (arr.length - offset < size)
            {
                throw new InvalidDataTypeException("byte array is to small to retrieve string of declared length:" + size);
            }
            String str = decoder.decode(ByteBuffer.wrap(arr, offset, size)).toString();
            if (str == null)
            {
                throw new NullPointerException("String is null");
            }
            value = str;
        }
        catch (CharacterCodingException ce)
        {
            logger.severe(ce.getMessage());
            value = "";
        }
        logger.config("Read StringFixedLength:" + value);
    }

    /**
     * Write String into byte array
     *
     * The string will be adjusted to ensure the correct number of bytes are written, If the current value is null
     * or to short the written value will have the 'space' character appended to ensure this. We write this instead of
     * the null character because the null character is likely to confuse the parser into misreading the next field.
     *
     * @return the byte array to be written to the file
     */
    public byte[] writeByteArray()
    {
        ByteBuffer dataBuffer;
        byte[] data;

        //Create with a series of empty of spaces to try and ensure integrity of field
        if (value == null)
        {
            logger.warning("Value of StringFixedlength Field is null using default value instead");
            data = new byte[size];
            for (int i = 0; i < size; i++)
            {
                data[i] = ' ';
            }
            return data;
        }

        try
        {
            final Charset charset = getTextEncodingCharSet();
            final CharsetEncoder encoder;
            if (StandardCharsets.UTF_16.equals(charset))
            {
                //Note remember LE BOM is ff fe but tis is handled by encoder Unicode char is fe ff
                encoder = StandardCharsets.UTF_16LE.newEncoder();
                dataBuffer = encoder.encode(CharBuffer.wrap('\ufeff' + (String) value));
            }
            else
            {
                encoder = charset.newEncoder();
                dataBuffer = encoder.encode(CharBuffer.wrap((String) value));
            }
        }
        catch (CharacterCodingException ce)
        {
            logger.warning("There was a problem writing the following StringFixedlength Field:" + value + ":" + ce.getMessage() + "using default value instead");
            data = new byte[size];
            for (int i = 0; i < size; i++)
            {
                data[i] = ' ';
            }
            return data;
        }

        // We must return the defined size.
        // To check now because size is in bytes not chars
        if (dataBuffer != null)
        {
            //Everything ok
            if (dataBuffer.limit() == size)
            {
                data = new byte[dataBuffer.limit()];
                dataBuffer.get(data, 0, dataBuffer.limit());
                return data;
            }
            //There is more data available than allowed for this field strip
            else if (dataBuffer.limit() > size)
            {
                logger.warning("There was a problem writing the following StringFixedlength Field:" + value + " when converted to bytes has length of:" + dataBuffer.limit() + " but field was defined with length of:" + size + " too long so stripping extra length");
                data = new byte[size];
                dataBuffer.get(data, 0, size);
                return data;
            }
            //There is not enough data
            else
            {
                logger.warning("There was a problem writing the following StringFixedlength Field:" + value + " when converted to bytes has length of:" + dataBuffer.limit() + " but field was defined with length of:" + size + " too short so padding with spaces to make up extra length");

                data = new byte[size];
                dataBuffer.get(data, 0, dataBuffer.limit());

                for (int i = dataBuffer.limit(); i < size; i++)
                {
                    data[i] = ' ';
                }
                return data;
            }
        }
        else
        {
            logger.warning("There was a serious problem writing the following StringFixedlength Field:" + value + ":" + "using default value instead");
            data = new byte[size];
            for (int i = 0; i < size; i++)
            {
                data[i] = ' ';
            }
            return data;
        }
    }

    /**
     * @return the encoding of the frame body this datatype belongs to
     */
    protected Charset getTextEncodingCharSet()
    {
        final byte textEncoding = this.getBody().getTextEncoding();
        final Charset charset = TextEncoding.getInstanceOf().getCharsetForId(textEncoding);
        logger.finest("text encoding:" + textEncoding + " charset:" + charset.name());
        return charset;
    }
}
