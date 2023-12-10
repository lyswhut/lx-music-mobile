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
 *  Represents a Unique File ID for the file which relates
 *  to an external database.
 *
 */
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.ByteArraySizeTerminated;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.datatype.StringNullTerminated;
import org.jaudiotagger.tag.id3.ID3v24Frames;

import java.nio.ByteBuffer;


/**
 * A UFID Framebody consists of an owner that identifies the server hosting the
 * unique identifier database, and the unique identifier itself which can be up to 64
 * bytes in length.
 */
public class FrameBodyUFID extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{
    public static final String UFID_MUSICBRAINZ = "http://musicbrainz.org";
    public static final String UFID_ID3TEST = "http://www.id3.org/dummy/ufid.html";

    /**
     * Creates a new FrameBodyUFID datatype.
     */
    public FrameBodyUFID()
    {
        setOwner("");
        setUniqueIdentifier(new byte[0]);
    }

    public FrameBodyUFID(FrameBodyUFID body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyUFID datatype.
     *
     * @param owner            url of the database
     * @param uniqueIdentifier unique identifier
     */
    public FrameBodyUFID(String owner, byte[] uniqueIdentifier)
    {
        setOwner(owner);
        setUniqueIdentifier(uniqueIdentifier);
    }

    /**
     * Creates FrameBodyUFID datatype from buffer
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodyUFID(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
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
        return ID3v24Frames.FRAME_ID_UNIQUE_FILE_ID;
    }

    /**
     * Set the owner of url of the the database that this ufid is stored in
     *
     * @param owner should be a valid url
     */
    public void setOwner(String owner)
    {
        setObjectValue(DataTypes.OBJ_OWNER, owner);
    }

    /**
     * @return the url of the the database that this ufid is stored in
     */
    public String getOwner()
    {
        return (String) getObjectValue(DataTypes.OBJ_OWNER);
    }

    /**
     * Set the unique identifier (within the owners domain)
     *
     * @param uniqueIdentifier
     */
    public void setUniqueIdentifier(byte[] uniqueIdentifier)
    {
        setObjectValue(DataTypes.OBJ_DATA, uniqueIdentifier);
    }

    /**
     * @return the unique identifier (within the owners domain)
     */
    public byte[] getUniqueIdentifier()
    {
        return (byte[]) getObjectValue(DataTypes.OBJ_DATA);
    }

    protected void setupObjectList()
    {
        objectList.add(new StringNullTerminated(DataTypes.OBJ_OWNER, this));
        objectList.add(new ByteArraySizeTerminated(DataTypes.OBJ_DATA, this));
    }
}
