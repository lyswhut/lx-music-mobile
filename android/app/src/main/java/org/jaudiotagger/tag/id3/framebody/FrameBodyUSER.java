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
import org.jaudiotagger.tag.id3.ID3v24Frames;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;
import org.jaudiotagger.tag.reference.Languages;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

/**
 * Terms of use frame.
 *
 *
 * This frame contains a brief description of the terms of use and
 * ownership of the file. More detailed information concerning the legal
 * terms might be available through the "WCOP" frame. Newlines are
 * allowed in the text. There may only be one "USER" frame in a tag.
 * <p><table border=0 width="70%">
 * <tr><td colspan=2>&lt;Header for 'Terms of use frame', ID: "USER"&gt;</td></tr>
 * <tr><td>Text encoding  </td><td>$xx</td></tr>
 * <tr><td>Language       </td><td>$xx xx xx</td></tr>
 * <tr><td>The actual text</td><td>&lt;text string according to encoding&gt;</td></tr>
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
public class FrameBodyUSER extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{
    /**
     * Creates a new FrameBodyUSER datatype.
     */
    public FrameBodyUSER()
    {
        //        setObject("Text Encoding", new Byte((byte) 0));
        //        setObject("Language", "");
        //        setObject("Text", "");
    }

    public FrameBodyUSER(FrameBodyUSER body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyUSER datatype.
     *
     * @param textEncoding
     * @param language
     * @param text
     */
    public FrameBodyUSER(byte textEncoding, String language, String text)
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        setObjectValue(DataTypes.OBJ_LANGUAGE, language);
        setObjectValue(DataTypes.OBJ_TEXT, text);
    }


    /**
     * Create a new FrameBodyUser by reading from byte buffer
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodyUSER(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_TERMS_OF_USE;
    }

    /**
     * @return lanaguage
     */
    public String getLanguage()
    {
        return (String) getObjectValue(DataTypes.OBJ_LANGUAGE);
    }

    /**
     * @param language
     */
    public void setOwner(String language)
    {
        setObjectValue(DataTypes.OBJ_LANGUAGE, language);
    }

    /**
     * If the text cannot be encoded using current encoder, change the encoder
     *
     * @param tagBuffer
     * @throws java.io.IOException
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        if (!((AbstractString) getObject(DataTypes.OBJ_TEXT)).canBeEncoded())
        {
            this.setTextEncoding(TextEncoding.UTF_16);
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
        objectList.add(new StringSizeTerminated(DataTypes.OBJ_TEXT, this));
    }
}
