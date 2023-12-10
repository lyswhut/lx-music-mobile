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
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.ByteArraySizeTerminated;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.datatype.StringNullTerminated;
import org.jaudiotagger.tag.id3.ID3v22Frames;

import java.nio.ByteBuffer;

/**
 * Encrypted meta frame
 *
 * This frame contains one or more encrypted frames. This enables
 * protection of copyrighted information such as pictures and text, that
 * people might want to pay extra for. Since standardisation of such an
 * encryption scheme is beyond this document, all "CRM" frames begin with
 * a terminated string with a URL [URL] containing an email address, or a
 * link to a location where an email adress can be found, that belongs to
 * the organisation responsible for this specific encrypted meta frame.
 *
 * Questions regarding the encrypted frame should be sent to the
 * indicated email address. If a $00 is found directly after the 'Frame
 * size', the whole frame should be ignored, and preferably be removed.
 * The 'Owner identifier' is then followed by a short content description
 * and explanation as to why it's encrypted. After the
 * 'content/explanation' description, the actual encrypted block follows.
 *
 * When an ID3v2 decoder encounters a "CRM" frame, it should send the
 * datablock to the 'plugin' with the corresponding 'owner identifier'
 * and expect to receive either a datablock with one or several ID3v2
 * frames after each other or an error. There may be more than one "CRM"
 * frames in a tag, but only one with the same 'owner identifier'.
 *
 * Encrypted meta frame  "CRM"
 * Frame size            $xx xx xx
 * Owner identifier      <textstring> $00 (00)
 * Content/explanation   <textstring> $00 (00)
 * Encrypted datablock   <binary data>
 */
public class FrameBodyCRM extends AbstractID3v2FrameBody implements ID3v22FrameBody
{
    /**
     * Creates a new FrameBodyCRM datatype.
     */
    public FrameBodyCRM()
    {
        //        this.setObject(ObjectTypes.OBJ_OWNER, "");
        //        this.setObject(ObjectTypes.OBJ_DESCRIPTION, "");
        //        this.setObject("Encrypted datablock", new byte[0]);
    }

    public FrameBodyCRM(FrameBodyCRM body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyCRM datatype.
     *
     * @param owner
     * @param description
     * @param data
     */
    public FrameBodyCRM(String owner, String description, byte[] data)
    {
        this.setObjectValue(DataTypes.OBJ_OWNER, owner);
        this.setObjectValue(DataTypes.OBJ_DESCRIPTION, description);
        this.setObjectValue(DataTypes.OBJ_ENCRYPTED_DATABLOCK, data);
    }

    /**
     * Creates a new FrameBodyCRM datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyCRM(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
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
        return ID3v22Frames.FRAME_ID_V2_ENCRYPTED_FRAME;
    }

    /**
     * @return
     */
    public String getOwner()
    {
        return (String) getObjectValue(DataTypes.OBJ_OWNER);
    }

    /**
     * @param description
     */
    public void getOwner(String description)
    {
        setObjectValue(DataTypes.OBJ_OWNER, description);
    }

    /**
     *
     */
    protected void setupObjectList()
    {
        objectList.add(new StringNullTerminated(DataTypes.OBJ_OWNER, this));
        objectList.add(new StringNullTerminated(DataTypes.OBJ_DESCRIPTION, this));
        objectList.add(new ByteArraySizeTerminated(DataTypes.OBJ_ENCRYPTED_DATABLOCK, this));
    }
}
