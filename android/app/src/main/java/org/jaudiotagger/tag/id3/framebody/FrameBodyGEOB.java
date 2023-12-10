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

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

/**
 * General encapsulated object frame.
 *
 *
 * In this frame any type of file can be encapsulated. After the header,
 * 'Frame size' and 'Encoding' follows 'MIME type' represented as
 * as a terminated string encoded with ISO-8859-1. The
 * filename is case sensitive and is encoded as 'Encoding'. Then follows
 * a content description as terminated string, encoded as 'Encoding'.
 * The last thing in the frame is the actual object. The first two
 * strings may be omitted, leaving only their terminations. There may be more than one "GEOB"
 * frame in each tag, but only one with the same content descriptor.
 * <p><table border=0 width="70%">
 * <tr><td colspan=2> &lt;Header for 'General encapsulated object', ID: "GEOB"&gt;</td></tr>
 * <tr><td>Text encoding       </td><td>$xx                     </td></tr>
 * <tr><td>MIME type           </td><td>&lt;text string&gt; $00 </td></tr>
 * <tr><td>Filename            </td><td>&lt;text string according to encoding&gt; $00 (00)</td></tr>
 * <tr><td>Content description </td><td><text string according to encoding> $00 (00)</td></tr>
 * <tr><td>Encapsulated object </td><td>&lt;binary data&gt;     </td></tr>
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
public class FrameBodyGEOB extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{

    /**
     * Creates a new FrameBodyGEOB datatype.
     */
    public FrameBodyGEOB()
    {
        this.setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
        this.setObjectValue(DataTypes.OBJ_MIME_TYPE, "");
        this.setObjectValue(DataTypes.OBJ_FILENAME, "");
        this.setObjectValue(DataTypes.OBJ_DESCRIPTION, "");
        this.setObjectValue(DataTypes.OBJ_DATA, new byte[0]);
    }

    public FrameBodyGEOB(FrameBodyGEOB body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyGEOB datatype.
     *
     * @param textEncoding
     * @param mimeType
     * @param filename
     * @param description
     * @param object
     */
    public FrameBodyGEOB(byte textEncoding, String mimeType, String filename, String description, byte[] object)
    {
        this.setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        this.setObjectValue(DataTypes.OBJ_MIME_TYPE, mimeType);
        this.setObjectValue(DataTypes.OBJ_FILENAME, filename);
        this.setObjectValue(DataTypes.OBJ_DESCRIPTION, description);
        this.setObjectValue(DataTypes.OBJ_DATA, object);
    }

    /**
     * Creates a new FrameBodyGEOB datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyGEOB(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * @param description
     */
    public void setDescription(String description)
    {
        setObjectValue(DataTypes.OBJ_DESCRIPTION, description);
    }

    /**
     * @return the description field
     */
    public String getDescription()
    {
        return (String) getObjectValue(DataTypes.OBJ_DESCRIPTION);
    }

    /**
     * @return
     */
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_GENERAL_ENCAPS_OBJECT;
    }


    /**
     * If the filename or description cannot be encoded using current encoder, change the encoder
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        if (!((AbstractString) getObject(DataTypes.OBJ_FILENAME)).canBeEncoded())
        {
            this.setTextEncoding(TextEncoding.UTF_16);
        }
        if (!((AbstractString) getObject(DataTypes.OBJ_DESCRIPTION)).canBeEncoded())
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
        objectList.add(new StringNullTerminated(DataTypes.OBJ_MIME_TYPE, this));
        objectList.add(new TextEncodedStringNullTerminated(DataTypes.OBJ_FILENAME, this));
        objectList.add(new TextEncodedStringNullTerminated(DataTypes.OBJ_DESCRIPTION, this));
        objectList.add(new ByteArraySizeTerminated(DataTypes.OBJ_DATA, this));
    }
}
