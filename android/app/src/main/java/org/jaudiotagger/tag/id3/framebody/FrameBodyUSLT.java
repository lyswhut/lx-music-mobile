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

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.*;
import org.jaudiotagger.tag.id3.ID3TextEncodingConversion;
import org.jaudiotagger.tag.id3.ID3v24Frames;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;
import org.jaudiotagger.tag.reference.Languages;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

/**
 * Unsychronised lyrics/text transcription frame.
 *
 *
 * This frame contains the lyrics of the song or a text transcription of other vocal activities. The head includes an
 * encoding descriptor and a content descriptor. The body consists of the actual text. The 'Content descriptor' is a
 * terminated string. If no descriptor is entered, 'Content descriptor' is $00 (00) only. Newline characters are
 * allowed in the text. There may be more than one 'Unsynchronised lyrics/text transcription' frame in each tag, but
 * only one with the same language and content descriptor.
 *
 * <p><table border=0 width="70%">
 * <tr><td colspan=2>&lt;Header for 'Unsynchronised lyrics/text transcription', ID: "USLT"&gt;</td></tr>
 * <tr><td>Text encoding     </td><td width="80%">$xx</td></tr>
 * <tr><td>Language          </td><td>$xx xx xx</td></tr>
 * <tr><td>Content descriptor</td><td>&lt;text string according to encoding&gt; $00 (00)</td></tr>
 * <tr><td>Lyrics/text       </td><td>&lt;full text string according to encoding&gt;</td></tr>
 * </table>
 *
 * You can retrieve the first value without the null terminator using {@link #getFirstTextValue}
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
public class FrameBodyUSLT extends AbstractID3v2FrameBody implements ID3v23FrameBody, ID3v24FrameBody
{
    /**
     * Creates a new FrameBodyUSLT dataType.
     */
    public FrameBodyUSLT()
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
        setObjectValue(DataTypes.OBJ_LANGUAGE, "");
        setObjectValue(DataTypes.OBJ_DESCRIPTION, "");
        setObjectValue(DataTypes.OBJ_LYRICS, "");
    }

    /**
     * Copy constructor
     *
     * @param body
     */
    public FrameBodyUSLT(FrameBodyUSLT body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyUSLT datatype.
     *
     * @param textEncoding
     * @param language
     * @param description
     * @param text
     */
    public FrameBodyUSLT(byte textEncoding, String language, String description, String text)
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        setObjectValue(DataTypes.OBJ_LANGUAGE, language);
        setObjectValue(DataTypes.OBJ_DESCRIPTION, description);
        setObjectValue(DataTypes.OBJ_LYRICS, text);
    }

    /**
     * Creates a new FrameBodyUSLT datatype, populated from buffer
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     * @throws InvalidTagException
     */
    public FrameBodyUSLT(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    public String getUserFriendlyValue()
    {
        return getFirstTextValue();
    }


    /**
     * Set a description field
     *
     * @param description
     */
    public void setDescription(String description)
    {
        setObjectValue(DataTypes.OBJ_DESCRIPTION, description);
    }

    /**
     * Get a description field
     *
     * @return description
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
        return ID3v24Frames.FRAME_ID_UNSYNC_LYRICS;
    }

    /**
     * Set the language field
     *
     * @param language
     */
    public void setLanguage(String language)
    {
        setObjectValue(DataTypes.OBJ_LANGUAGE, language);
    }

    /**
     * Get the language field
     *
     * @return language
     */
    public String getLanguage()
    {
        return (String) getObjectValue(DataTypes.OBJ_LANGUAGE);
    }

    /**
     * Set the lyric field
     *
     * @param lyric
     */
    public void setLyric(String lyric)
    {
        setObjectValue(DataTypes.OBJ_LYRICS, lyric);
    }

    /**
     * Get the lyric field
     *
     * @return lyrics
     */
    public String getLyric()
    {
        return (String) getObjectValue(DataTypes.OBJ_LYRICS);
    }

    /**
     * Get first value
     *
     * @return value at index 0
     */
    public String getFirstTextValue()
    {
        TextEncodedStringSizeTerminated text = (TextEncodedStringSizeTerminated) getObject(DataTypes.OBJ_LYRICS);
        return text.getValueAtIndex(0);
    }

    /**
     * Add additional lyric to the lyric field
     *
     * @param text
     */
    public void addLyric(String text)
    {
        setLyric(getLyric() + text);
        }

    /**
     * @param line
     */
    public void addLyric(Lyrics3Line line)
    {
        setLyric(getLyric() + line.writeString());
    }


    public void write(ByteArrayOutputStream tagBuffer)
    {

        //Ensure valid for type
        this.setTextEncoding(ID3TextEncodingConversion.getTextEncoding(getHeader(), getTextEncoding()));

        //Ensure valid for data                    
        if (!((AbstractString) getObject(DataTypes.OBJ_DESCRIPTION)).canBeEncoded())
        {
            this.setTextEncoding(ID3TextEncodingConversion.getUnicodeTextEncoding(getHeader()));
        }
        if (!((AbstractString) getObject(DataTypes.OBJ_LYRICS)).canBeEncoded())
        {
            this.setTextEncoding(ID3TextEncodingConversion.getUnicodeTextEncoding(getHeader()));
        }
        super.write(tagBuffer);
    }

    /**
     *
     */
    protected void setupObjectList()
    {
        objectList.add(new NumberHashMap(DataTypes.OBJ_TEXT_ENCODING, this, TextEncoding.TEXT_ENCODING_FIELD_SIZE));
        objectList.add(new StringHashMap(DataTypes.OBJ_LANGUAGE, this, Languages.LANGUAGE_FIELD_SIZE));
        objectList.add(new TextEncodedStringNullTerminated(DataTypes.OBJ_DESCRIPTION, this));
        objectList.add(new TextEncodedStringSizeTerminated(DataTypes.OBJ_LYRICS, this));
    }

}
