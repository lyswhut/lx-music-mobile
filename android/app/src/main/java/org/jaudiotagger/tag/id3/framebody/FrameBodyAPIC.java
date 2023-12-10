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

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.TagOptionSingleton;
import org.jaudiotagger.tag.datatype.*;
import org.jaudiotagger.tag.id3.ID3v24Frames;
import org.jaudiotagger.tag.id3.valuepair.ImageFormats;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;
import org.jaudiotagger.tag.reference.PictureTypes;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

/**
 * Attached picture frame.
 *
 *
 * This frame contains a picture directly related to the audio file.
 * Image format is the MIME type and subtype for the image. In
 * the event that the MIME media type name is omitted, "image/" will be
 * implied. The "image/png" or "image/jpeg" picture format
 * should be used when interoperability is wanted. Description is a
 * short description of the picture, represented as a terminated
 * textstring. The description has a maximum length of 64 characters,
 * but may be empty. There may be several pictures attached to one file,
 * each in their individual "APIC" frame, but only one with the same
 * content descriptor. There may only be one picture with the picture
 * type declared as picture type $01 and $02 respectively. There is the
 * possibility to put only a link to the image file by using the 'MIME
 * type' "-->" and having a complete URL instead of picture data.
 * The use of linked files should however be used sparingly since there
 * is the risk of separation of files.
 * <p><table border=0 width="70%">
 * <tr><td colspan=2> &lt;Header for 'Attached picture', ID: "APIC"&gt;</td></tr>
 * <tr><td>Text encoding  </td><td>$xx                            </td></tr>
 * <tr><td>MIME type      </td><td>&lt;text string&gt; $00        </td></tr>
 * <tr><td>Picture type   </td><td>$xx                            </td></tr>
 * <tr><td>Description    </td><td>&lt;text string according to encoding&gt; $00 (00)</td></tr>
 * <tr><td>Picture data   </td><td>&lt;binary data&gt;            </td></tr>
 * </table>
 * <p><table border=0 width="70%">
 * <tr><td rowspan=21 valign=top>Picture type:</td>
 * <td>$00 </td><td>Other                                </td></tr>
 * <tr><td>$01 </td><td>32x32 pixels 'file icon' (PNG only)  </td></tr>
 * <tr><td>$02 </td><td>Other file icon                      </td></tr>
 * <tr><td>$03 </td><td>Cover (front)                        </td></tr>
 * <tr><td>$04 </td><td>Cover (back)                         </td></tr>
 * <tr><td>$05 </td><td>Leaflet page                         </td></tr>
 * <tr><td>$06 </td><td>Media (e.g. lable side of CD)        </td></tr>
 * <tr><td>$07 </td><td>Lead artist/lead performer/soloist   </td></tr>
 * <tr><td>$08 </td><td>Artist/performer                     </td></tr>
 * <tr><td>$09 </td><td>Conductor                            </td></tr>
 * <tr><td>$0A </td><td>Band/Orchestra                       </td></tr>
 * <tr><td>$0B </td><td>Composer                             </td></tr>
 * <tr><td>$0C </td><td>Lyricist/text writer                 </td></tr>
 * <tr><td>$0D </td><td>Recording Location                   </td></tr>
 * <tr><td>$0E </td><td>During recording                     </td></tr>
 * <tr><td>$0F </td><td>During performance                   </td></tr>
 * <tr><td>$10 </td><td>Movie/video screen capture           </td></tr>
 * <tr><td>$11 </td><td>A bright coloured fish               </td></tr>
 * <tr><td>$12 </td><td>Illustration                         </td></tr>
 * <tr><td>$13 </td><td>Band/artist logotype                 </td></tr>
 * <tr><td>$14 </td><td>Publisher/Studio logotype            </td></tr>
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
public class FrameBodyAPIC extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{
    public static final String IMAGE_IS_URL = "-->";

    /**
     * Creates a new FrameBodyAPIC datatype.
     */
    public FrameBodyAPIC()
    {
        //Initilise default text encoding
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
    }

    public FrameBodyAPIC(FrameBodyAPIC body)
    {
        super(body);
    }

    /**
     * Conversion from v2 PIC to v3/v4 APIC
     * @param body
     */
    public FrameBodyAPIC(FrameBodyPIC body)
    {
        this.setObjectValue(DataTypes.OBJ_TEXT_ENCODING, body.getTextEncoding());
        this.setObjectValue(DataTypes.OBJ_MIME_TYPE, ImageFormats.getMimeTypeForFormat((String) body.getObjectValue(DataTypes.OBJ_IMAGE_FORMAT)));
        this.setObjectValue(DataTypes.OBJ_PICTURE_TYPE, body.getObjectValue(DataTypes.OBJ_PICTURE_TYPE));
        this.setObjectValue(DataTypes.OBJ_DESCRIPTION, body.getDescription());
        this.setObjectValue(DataTypes.OBJ_PICTURE_DATA, body.getObjectValue(DataTypes.OBJ_PICTURE_DATA));

    }

    /**
     * Creates a new FrameBodyAPIC datatype.
     *
     * @param textEncoding
     * @param mimeType
     * @param pictureType
     * @param description
     * @param data
     */
    public FrameBodyAPIC(byte textEncoding, String mimeType, byte pictureType, String description, byte[] data)
    {
        this.setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        this.setMimeType(mimeType);
        this.setPictureType(pictureType);
        this.setDescription(description);
        this.setImageData(data);
    }

    /**
     * Creates a new FrameBodyAPIC datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyAPIC(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    public String getUserFriendlyValue()
    {
        if(getImageData()!=null)
        {
            return getMimeType() + ":" + getDescription() + ":" + getImageData().length;
        }
        else
        {
            return getMimeType() + ":" + getDescription() + ":0";
        }
    }


    /**
     * Set a description of the image
     *
     * @param description
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
     * Set mimeType
     *
     * @param mimeType
     */
    public void setMimeType(String mimeType)
    {
        setObjectValue(DataTypes.OBJ_MIME_TYPE, mimeType);
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
        return ID3v24Frames.FRAME_ID_ATTACHED_PICTURE;
    }


    /**
     * If the description cannot be encoded using current encoder, change the encoder
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        if(TagOptionSingleton.getInstance().isAPICDescriptionITunesCompatible())
        {
            this.setTextEncoding(TextEncoding.ISO_8859_1);
            if (!((AbstractString) getObject(DataTypes.OBJ_DESCRIPTION)).canBeEncoded())
            {
                setDescription("");
            }
        }
        else
        {
            if (!((AbstractString) getObject(DataTypes.OBJ_DESCRIPTION)).canBeEncoded())
            {
                this.setTextEncoding(TextEncoding.UTF_16);
            }
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
        objectList.add(new NumberHashMap(DataTypes.OBJ_PICTURE_TYPE, this, PictureTypes.PICTURE_TYPE_FIELD_SIZE));
        objectList.add(new TextEncodedStringNullTerminated(DataTypes.OBJ_DESCRIPTION, this));
        objectList.add(new ByteArraySizeTerminated(DataTypes.OBJ_PICTURE_DATA, this));
    }

    /**
     * @return true if imagedata  is held as a url rather than actually being imagedata
     */
    public boolean isImageUrl()
    {
        return getMimeType() != null && getMimeType().equals(IMAGE_IS_URL);
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

}
