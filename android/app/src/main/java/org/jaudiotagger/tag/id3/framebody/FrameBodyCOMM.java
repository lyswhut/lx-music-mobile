/*
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
 */
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.*;
import org.jaudiotagger.tag.id3.ID3TextEncodingConversion;
import org.jaudiotagger.tag.id3.ID3v24Frames;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;
import org.jaudiotagger.tag.reference.Languages;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.List;

/**
 * Comments frame.
 *
 *
 * This frame is intended for any kind of full text information that does not fit in any other frame. It consists of a
 * frame header followed by encoding, language and content descriptors and is ended with the actual comment as a
 * text string. Newline characters are allowed in the comment text string. There may be more than one comment frame
 * in each tag, but only one with the same language and* content descriptor.
 * 
 * <p><table border=0 width="70%">
 * <tr><td colspan=2>&lt;Header for 'Comment', ID: "COMM"&gt;</td></tr>
 * <tr><td>Text encoding   </td><td width="80%">$xx          </td></tr>
 * <tr><td>Language        </td><td>$xx xx xx                </td></tr>
 * <tr><td>Short content descrip.</td><td>&lt;text string according to encoding&gt; $00 (00)</td></tr>
 * <tr><td>The actual text </td><td>&lt;full text string according to encoding&gt;</td></tr>
 * </table>
 *
 * <p>For more details, please refer to the ID3 specifications:
 * <ul>
 * <li><a href="http://www.id3.org/id3v2.3.0.txt">ID3 v2.3.0 Spec</a>
 * </ul>
 *
 * @author : Paul Taylor
 * @author : Eric Farng
 * @version $Id$
 */
public class FrameBodyCOMM extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{
    //Most players only read comment with description of blank
    public static final String DEFAULT = "";

    //used by iTunes for volume normalization, although uses the COMMENT field not usually displayed as a comment
    public static final String ITUNES_NORMALIZATION = "iTunNORM";

    //Various descriptions used by MediaMonkey, (note Media Monkey uses non-standard language field XXX)
    private static final String MM_PREFIX               = "Songs-DB";
    public static final String MM_CUSTOM1               = "Songs-DB_Custom1";
    public static final String MM_CUSTOM2               = "Songs-DB_Custom2";
    public static final String MM_CUSTOM3               = "Songs-DB_Custom3";
    public static final String MM_CUSTOM4               = "Songs-DB_Custom4";
    public static final String MM_CUSTOM5               = "Songs-DB_Custom5";
    public static final String MM_OCCASION              = "Songs-DB_Occasion";
    public static final String MM_QUALITY               = "Songs-DB_Preference";
    public static final String MM_TEMPO                 = "Songs-DB_Tempo";

    public boolean isMediaMonkeyFrame()
    {
        String desc = getDescription();
        if(desc!=null && !(desc.length()==0))
        {
            if(desc.startsWith(MM_PREFIX))
            {
                return true;
            }
        }
        return false;
    }

    public boolean isItunesFrame()
    {
        String desc = getDescription();
        if(desc!=null && !(desc.length()==0))
        {
            if(desc.equals(ITUNES_NORMALIZATION))
            {
                return true;
            }
        }
        return false;
    }

    
    /**
     * Creates a new FrameBodyCOMM datatype.
     */
    public FrameBodyCOMM()
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
        setObjectValue(DataTypes.OBJ_LANGUAGE, Languages.DEFAULT_ID);
        setObjectValue(DataTypes.OBJ_DESCRIPTION, "");
        setObjectValue(DataTypes.OBJ_TEXT, "");
    }

    public FrameBodyCOMM(FrameBodyCOMM body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyCOMM datatype.
     *
     * @param textEncoding
     * @param language
     * @param description
     * @param text
     */
    public FrameBodyCOMM(byte textEncoding, String language, String description, String text)
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        setObjectValue(DataTypes.OBJ_LANGUAGE, language);
        setObjectValue(DataTypes.OBJ_DESCRIPTION, description);
        setObjectValue(DataTypes.OBJ_TEXT, text);
    }

    /**
     * Construct a Comment frame body from the buffer
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyCOMM(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }


    /**
     * Set the description field, which describes the type of comment
     *
     * @param description
     */
    public void setDescription(String description)
    {
        if (description == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        setObjectValue(DataTypes.OBJ_DESCRIPTION, description);
    }

    /**
     * Get the description field, which describes the type of comment
     *
     * @return description field
     */
    public String getDescription()
    {
        return (String) getObjectValue(DataTypes.OBJ_DESCRIPTION);
    }

    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_COMMENT;
    }

    /**
     * Sets the language the comment is written in
     *
     * @param language
     */
    public void setLanguage(String language)
    {
        //TODO not sure if this might break existing code
        /*if(language==null)
        {
             throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        } */
        setObjectValue(DataTypes.OBJ_LANGUAGE, language);        
    }

    /**
     * Get the language the comment is written in
     *
     * @return the language
     */
    public String getLanguage()
    {
        return (String) getObjectValue(DataTypes.OBJ_LANGUAGE);
    }

    /**
     * @param text
     */
    public void setText(String text)
    {
        if (text == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        setObjectValue(DataTypes.OBJ_TEXT, text);
    }

    /**
     * Returns the the text field which holds the comment, adjusted to ensure does not return trailing null
     * which is due to a iTunes bug.
     *
     * @return the text field
     */
    public String getText()
    {
        TextEncodedStringSizeTerminated text = (TextEncodedStringSizeTerminated) getObject(DataTypes.OBJ_TEXT);
        return text.getValueAtIndex(0);
    }

    public String getUserFriendlyValue()
    {
        return getText();
    }


    /**
     *
     */
    protected void setupObjectList()
    {
        objectList.add(new NumberHashMap(DataTypes.OBJ_TEXT_ENCODING, this, TextEncoding.TEXT_ENCODING_FIELD_SIZE));
        objectList.add(new StringHashMap(DataTypes.OBJ_LANGUAGE, this, Languages.LANGUAGE_FIELD_SIZE));
        objectList.add(new TextEncodedStringNullTerminated(DataTypes.OBJ_DESCRIPTION, this));
        objectList.add(new TextEncodedStringSizeTerminated(DataTypes.OBJ_TEXT, this));
    }

    /**
     * Because COMM have a text encoding we need to check the text String does
     * not contain characters that cannot be encoded in current encoding before
     * we write data. If there are we change the encoding.
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        //Ensure valid for type
        setTextEncoding(ID3TextEncodingConversion.getTextEncoding(getHeader(), getTextEncoding()));

        //Ensure valid for data
        if (!((AbstractString) getObject(DataTypes.OBJ_TEXT)).canBeEncoded())
        {
            this.setTextEncoding(ID3TextEncodingConversion.getUnicodeTextEncoding(getHeader()));
        }
        if (!((AbstractString) getObject(DataTypes.OBJ_DESCRIPTION)).canBeEncoded())
        {
            this.setTextEncoding(ID3TextEncodingConversion.getUnicodeTextEncoding(getHeader()));
        }
        super.write(tagBuffer);
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

}
