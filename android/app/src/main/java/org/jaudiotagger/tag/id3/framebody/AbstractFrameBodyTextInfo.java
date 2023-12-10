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
 */
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.datatype.NumberHashMap;
import org.jaudiotagger.tag.datatype.TextEncodedStringSizeTerminated;
import org.jaudiotagger.tag.id3.ID3TextEncodingConversion;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.List;

/**
 * Abstract representation of a Text Frame
 *
 * The text information frames are often the most important frames, containing information like artist, album and
 * more. There may only be  one text information frame of its kind in an tag. In ID3v24 All text information frames
 * supports multiple strings, stored as a null separated list, where null is represented by the termination code
 * for the character encoding. All text frame identifiers begin with "T". Only text frame identifiers begin with "T",
 * with the exception of the "TXXX" frame. All the text information frames have the following  format:
 *
 * Header for 'Text information frame', ID: "T000" - "TZZZ",
 * excluding "TXXX" described in 4.2.6.
 *
 * Text encoding                $xx
 * Information                  text string(s) according to encoding
 *
 * The list of valid text encodings increased from two in ID3v23 to four in ID3v24
 *
 * iTunes incorrectly writes null terminators at the end of every String, even though it only writes one String.
 *
 * You can retrieve the first value without the null terminator using {@link #getFirstTextValue}
 */
public abstract class AbstractFrameBodyTextInfo extends AbstractID3v2FrameBody
{

    /**
     * Creates a new FrameBodyTextInformation datatype. The super.super
     * Constructor sets up the Object list for the frame.
     */
    protected AbstractFrameBodyTextInfo()
    {
        super();
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
        setObjectValue(DataTypes.OBJ_TEXT, "");
    }

    /**
     * Copy Constructor
     *
     * @param body AbstractFrameBodyTextInformation
     */
    protected AbstractFrameBodyTextInfo(AbstractFrameBodyTextInfo body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyTextInformation data type. This is used when user
     * wants to create a new frame based on data in a user interface.
     *
     * @param textEncoding Specifies what encoding should be used to write
     *                     text to file.
     * @param text         Specifies the text String.
     */
    protected AbstractFrameBodyTextInfo(byte textEncoding, String text)
    {
        super();
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        setObjectValue(DataTypes.OBJ_TEXT, text);
    }

    /**
     * Creates a new FrameBodyTextInformation data type from file.
     *
     * <p>The super.super Constructor sets up the Object list for the frame.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    protected AbstractFrameBodyTextInfo(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * Set the Full Text String.
     *
     * <p>If this String contains null terminator characters these are parsed as value
     * separators, allowing you to hold multiple strings within one text frame. This functionality is only
     * officially support in ID3v24.
     *
     * @param text to set
     */
    public void setText(String text)
    {
        if (text == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        setObjectValue(DataTypes.OBJ_TEXT, text);
    }

    public String getUserFriendlyValue()
    {
        return getTextWithoutTrailingNulls();
    }

    /**
     * Retrieve the complete text String as it is held internally.
     *
     * If multiple values are held these will be returned, needless trailing nulls will also be returned
     *
     * @return the text string
     */
    public String getText()
    {
        return (String) getObjectValue(DataTypes.OBJ_TEXT);
    }

    /**
     * Retrieve the complete text String but without any trailing nulls
     *
     * If multiple values are held these will be returned, needless trailing nulls will not be returned
     *
     * @return the text string
     */
    public String getTextWithoutTrailingNulls()
    {
        TextEncodedStringSizeTerminated text = (TextEncodedStringSizeTerminated) getObject(DataTypes.OBJ_TEXT);
        return text.getValueWithoutTrailingNull();
    }

    /**
     * Get first value
     *
     * @return value at index 0
     */
    public String getFirstTextValue()
    {
        TextEncodedStringSizeTerminated text = (TextEncodedStringSizeTerminated) getObject(DataTypes.OBJ_TEXT);
        return text.getValueAtIndex(0);
    }

    /**
     * Get text value at index
     *
     * When a multiple values are stored within a single text frame this method allows access to any of the
     * individual values.
     *
     * @param index
     * @return value at index
     */
    public String getValueAtIndex(int index)
    {
        TextEncodedStringSizeTerminated text = (TextEncodedStringSizeTerminated) getObject(DataTypes.OBJ_TEXT);
        return text.getValueAtIndex(index);
    }

    public List<String> getValues()
    {
        TextEncodedStringSizeTerminated text = (TextEncodedStringSizeTerminated) getObject(DataTypes.OBJ_TEXT);
        return text.getValues();
    }
    /**
     * Add additional value to value
     *
     * @param value at index
     */
    public void addTextValue(String value)
    {
        TextEncodedStringSizeTerminated text = (TextEncodedStringSizeTerminated) getObject(DataTypes.OBJ_TEXT);
        text.addValue(value);
    }

    /**
     * @return number of text values, usually one
     */
    public int getNumberOfValues()
    {
        TextEncodedStringSizeTerminated text = (TextEncodedStringSizeTerminated) getObject(DataTypes.OBJ_TEXT);
        return text.getNumberOfValues();
    }

    /**
     * Because Text frames have a text encoding we need to check the text
     * String does not contain characters that cannot be encoded in
     * current encoding before we write data. If there are change the text
     * encoding.
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        //Ensure valid for type
        setTextEncoding(ID3TextEncodingConversion.getTextEncoding(getHeader(), getTextEncoding()));

        //Ensure valid for data
        if (!((TextEncodedStringSizeTerminated) getObject(DataTypes.OBJ_TEXT)).canBeEncoded())
        {
            this.setTextEncoding(ID3TextEncodingConversion.getUnicodeTextEncoding(getHeader()));
        }
        super.write(tagBuffer);
    }

    /**
     * Setup the Object List. All text frames contain a text encoding
     * and then a text string.
     *
     * TODO:would like to make final but cannot because overridden by FrameBodyTXXX
     */
    protected void setupObjectList()
    {
        objectList.add(new NumberHashMap(DataTypes.OBJ_TEXT_ENCODING, this, TextEncoding.TEXT_ENCODING_FIELD_SIZE));
        objectList.add(new TextEncodedStringSizeTerminated(DataTypes.OBJ_TEXT, this));
    }
}
