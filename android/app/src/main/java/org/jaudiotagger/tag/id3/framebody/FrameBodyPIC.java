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

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.*;
import org.jaudiotagger.tag.id3.ID3v22Frames;
import org.jaudiotagger.tag.id3.valuepair.ImageFormats;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;
import org.jaudiotagger.tag.reference.PictureTypes;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

/**
 * ID3v22 Attached Picture
 *
 * <p> This frame contains a picture directly related to the audio file.
 * Image format is preferably "PNG" [PNG] or "JPG" [JFIF]. Description
 * is a short description of the picture, represented as a terminated
 * textstring. The description has a maximum length of 64 characters,
 * but may be empty. There may be several pictures attached to one file,
 * each in their individual "PIC" frame, but only one with the same
 * ontent descriptor. There may only be one picture with the picture
 * type declared as picture type $01 and $02 respectively. There is a
 * possibility to put only a link to the image file by using the image
 * format' "--" and having a complete URL [URL] instead of picture data.
 * The use of linked files should however be used restrictively since
 * there is the risk of separation of files.
 *
 * Attached picture   "PIC"
 * Frame size         $xx xx xx
 * Text encoding      $xx
 * Image format       $xx xx xx
 * Picture type       $xx
 * Description        textstring $00 (00)
 * Picture data       binary data>
 *
 *
 * Picture type:  $00  Other
 * $01  32x32 pixels 'file icon' (PNG only)
 * $02  Other file icon
 * $03  Cover (front)
 * $04  Cover (back)
 * $05  Leaflet page
 * $06  Media (e.g. lable side of CD)
 * $07  Lead artist/lead performer/soloist
 * $08  Artist/performer
 * $09  Conductor
 * $0A  Band/Orchestra
 * $0B  Composer
 * $0C  Lyricist/text writer
 * $0D  Recording Location
 * $0E  During recording
 * $0F  During performance
 * $10  Movie/video screen capture
 * $11  A bright coloured fish
 * $12  Illustration
 * $13  Band/artist logotype
 * $14  Publisher/Studio logotype
 */
public class FrameBodyPIC extends AbstractID3v2FrameBody implements ID3v22FrameBody
{
    public static final String IMAGE_IS_URL = "-->";

    /**
     * Creates a new FrameBodyPIC datatype.
     */
    public FrameBodyPIC()
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
    }

    public FrameBodyPIC(FrameBodyPIC body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyPIC datatype.
     *
     * @param textEncoding
     * @param imageFormat
     * @param pictureType
     * @param description
     * @param data
     */
    public FrameBodyPIC(byte textEncoding, String imageFormat, byte pictureType, String description, byte[] data)
    {
        this.setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        this.setObjectValue(DataTypes.OBJ_IMAGE_FORMAT, imageFormat);
        this.setPictureType(pictureType);
        this.setDescription(description);
        this.setImageData(data);
    }

    /**
     * Conversion from v2 PIC to v3/v4 APIC
     * @param body
     */
    public FrameBodyPIC(FrameBodyAPIC body)
    {
        this.setObjectValue(DataTypes.OBJ_TEXT_ENCODING, body.getTextEncoding());
        this.setObjectValue(DataTypes.OBJ_IMAGE_FORMAT, ImageFormats.getFormatForMimeType((String) body.getObjectValue(DataTypes.OBJ_MIME_TYPE)));
        this.setObjectValue(DataTypes.OBJ_PICTURE_DATA, body.getObjectValue(DataTypes.OBJ_PICTURE_DATA));
        this.setDescription(body.getDescription());
        this.setImageData(body.getImageData());
    }

    /**
     * Creates a new FrameBodyPIC datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyPIC(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * Set a description of the image
     *
     * @param description of the image
     */
    public void setDescription(String description)
    {
        setObjectValue(DataTypes.OBJ_DESCRIPTION, description);
    }

    /**
     * Get a description of the image
     *
     * @return a description of the image
     */
    public String getDescription()
    {
        return (String) getObjectValue(DataTypes.OBJ_DESCRIPTION);
    }

    /**
     * Set imageData
     *
     * @param imageData
     */
    public void setImageData(byte[] imageData)
    {
        setObjectValue(DataTypes.OBJ_PICTURE_DATA, imageData);
    }

    /**
     * Get Image data
     *
     * @return
     */
    public byte[] getImageData()
    {
        return (byte[]) getObjectValue(DataTypes.OBJ_PICTURE_DATA);
    }

    /**
     * Set Picture Type
     *
     * @param pictureType
     */
    public void setPictureType(byte pictureType)
    {
        setObjectValue(DataTypes.OBJ_PICTURE_TYPE, pictureType);
    }

    /**
     * @return picturetype
     */
    public int getPictureType()
    {
        return ((Long) getObjectValue(DataTypes.OBJ_PICTURE_TYPE)).intValue();
    }


    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public String getIdentifier()
    {
        return ID3v22Frames.FRAME_ID_V2_ATTACHED_PICTURE;
    }


    /**
     * If the description cannot be encoded using current encoder, change the encoder
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        if (!((AbstractString) getObject(DataTypes.OBJ_DESCRIPTION)).canBeEncoded())
        {
            this.setTextEncoding(TextEncoding.UTF_16);
        }
        super.write(tagBuffer);
    }

    /**
     * Get a description of the image
     *
     * @return a description of the image
     */
    public String getFormatType()
    {
        return (String) getObjectValue(DataTypes.OBJ_IMAGE_FORMAT);
    }

    public boolean isImageUrl()
    {
        return getFormatType() != null && getFormatType().equals(IMAGE_IS_URL);
    }

    /**
     * Get mimetype
     *
     * @return a description of the image
     */
    public String getMimeType()
    {
        return (String) getObjectValue(DataTypes.OBJ_MIME_TYPE);
    }

    /**
     * @return the image url if there is otherwise return an empty String
     */
    public String getImageUrl()
    {
        if (isImageUrl())
        {
            return new String(((byte[]) getObjectValue(DataTypes.OBJ_PICTURE_DATA)), 0, ((byte[]) getObjectValue(DataTypes.OBJ_PICTURE_DATA)).length, StandardCharsets.ISO_8859_1);
        }
        else
        {
            return "";
        }
    }

    /**
     *
     */
    protected void setupObjectList()
    {
        objectList.add(new NumberHashMap(DataTypes.OBJ_TEXT_ENCODING, this, TextEncoding.TEXT_ENCODING_FIELD_SIZE));
        objectList.add(new StringFixedLength(DataTypes.OBJ_IMAGE_FORMAT, this, 3));
        objectList.add(new NumberHashMap(DataTypes.OBJ_PICTURE_TYPE, this, PictureTypes.PICTURE_TYPE_FIELD_SIZE));
        objectList.add(new StringNullTerminated(DataTypes.OBJ_DESCRIPTION, this));
        objectList.add(new ByteArraySizeTerminated(DataTypes.OBJ_PICTURE_DATA, this));
    }

}
