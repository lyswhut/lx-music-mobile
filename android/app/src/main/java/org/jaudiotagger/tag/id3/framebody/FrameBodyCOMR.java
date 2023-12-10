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
import org.jaudiotagger.tag.id3.valuepair.ReceivedAsTypes;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

/**
 * Commercial frame.
 *
 *
 * This frame enables several competing offers in the same tag by
 * bundling all needed information. That makes this frame rather complex
 * but it's an easier solution than if one tries to achieve the same
 * result with several frames. The frame begins, after the frame ID,
 * size and encoding fields, with a price string field. A price is
 * constructed by one three character currency code, encoded according
 * to ISO-4217 alphabetic currency code, followed by a
 * numerical value where "." is used as decimal seperator. In the price
 * string several prices may be concatenated, seperated by a "/"
 * character, but there may only be one currency of each type.
 * <p>
 * The price string is followed by an 8 character date string in the
 * format YYYYMMDD, describing for how long the price is valid. After
 * that is a contact URL, with which the user can contact the seller,
 * followed by a one byte 'received as' field. It describes how the
 * audio is delivered when bought according to the following list:
 * <p><table border=0 width="70%">
 * <tr><td>$00 </td><td>Other                                      </td></tr>
 * <tr><td>$01 </td><td>Standard CD album with other songs         </td></tr>
 * <tr><td>$02 </td><td>Compressed audio on CD                     </td></tr>
 * <tr><td>$03 </td><td>File over the Internet                     </td></tr>
 * <tr><td>$04 </td><td>Stream over the Internet                   </td></tr>
 * <tr><td>$05 </td><td>As note sheets                             </td></tr>
 * <tr><td>$06 </td><td>As note sheets in a book with other sheets </td></tr>
 * <tr><td>$07 </td><td>Music on other media                       </td></tr>
 * <tr><td>$08 </td><td>Non-musical merchandise                    </td></tr>
 * </table><p>
 * Next follows a terminated string with the name of the seller followed
 * by a terminated string with a short description of the product. The
 * last thing is the ability to include a company logotype. The first of
 * them is the 'Picture MIME type' field containing information about
 * which picture format is used. In the event that the MIME media type
 * name is omitted, "image/" will be implied. Currently only "image/png"
 * and "image/jpeg" are allowed. This format string is followed by the
 * binary picture data. This two last fields may be omitted if no
 * picture is to attach.
 * <p><table border=0 width="70%">
 * <tr><td colspan=2> &lt;Header for 'Commercial frame', ID: "COMR"&gt;</td></tr>
 * <tr><td>Text encoding </td><td>$xx                             </td></tr>
 * <tr><td>Price string  </td><td>&lt;text string&gt; $00         </td></tr>
 * <tr><td>Valid until   </td><td>&lt;text string&gt;             </td></tr>
 * <tr><td>Contact URL   </td><td>&lt;text string&gt; $00         </td></tr>
 * <tr><td>Received as   </td><td>$xx                             </td></tr>
 * <tr><td>Name of seller</td><td>&lt;text string according to encoding&gt; $00 (00)</td></tr>
 * <tr><td>Description   </td><td>&lt;text string according to encoding&gt; $00 (00)</td></tr>
 * <tr><td>Picture MIME type</td><td>&lt;string&gt; $00           </td></tr>
 * <tr><td>Seller logo   </td><td>&lt;binary data&gt;             </td></tr>
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
public class FrameBodyCOMR extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{
    /**
     * Creates a new FrameBodyCOMR datatype.
     */
    public FrameBodyCOMR()
    {
        //        this.setObject("Text Encoding", new Byte((byte) 0));
        //        this.setObject("Price String", "");
        //        this.setObject("Valid Until", "");
        //        this.setObject("Contact URL", "");
        //        this.setObject("Recieved As", new Byte((byte) 0));
        //        this.setObject("Name Of Seller", "");
        //        this.setObject(ObjectTypes.OBJ_DESCRIPTION, "");
        //        this.setObject("Picture MIME Type", "");
        //        this.setObject("Seller Logo", new byte[0]);
    }

    public FrameBodyCOMR(FrameBodyCOMR body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyCOMR datatype.
     *
     * @param textEncoding
     * @param priceString
     * @param validUntil
     * @param contactUrl
     * @param recievedAs
     * @param nameOfSeller
     * @param description
     * @param mimeType
     * @param sellerLogo
     */
    public FrameBodyCOMR(byte textEncoding, String priceString, String validUntil, String contactUrl, byte recievedAs, String nameOfSeller, String description, String mimeType, byte[] sellerLogo)
    {
        this.setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        this.setObjectValue(DataTypes.OBJ_PRICE_STRING, priceString);
        this.setObjectValue(DataTypes.OBJ_VALID_UNTIL, validUntil);
        this.setObjectValue(DataTypes.OBJ_CONTACT_URL, contactUrl);
        this.setObjectValue(DataTypes.OBJ_RECIEVED_AS, recievedAs);
        this.setObjectValue(DataTypes.OBJ_SELLER_NAME, nameOfSeller);
        this.setObjectValue(DataTypes.OBJ_DESCRIPTION, description);
        this.setObjectValue(DataTypes.OBJ_MIME_TYPE, mimeType);
        this.setObjectValue(DataTypes.OBJ_SELLER_LOGO, sellerLogo);
    }

    /**
     * Creates a new FrameBodyCOMR datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyCOMR(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
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
        return ID3v24Frames.FRAME_ID_COMMERCIAL_FRAME;
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
     * If the seller or description cannot be encoded using current encoder, change the encoder
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        if (!((AbstractString) getObject(DataTypes.OBJ_SELLER_NAME)).canBeEncoded())
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
        objectList.add(new StringNullTerminated(DataTypes.OBJ_PRICE_STRING, this));
        objectList.add(new StringDate(DataTypes.OBJ_VALID_UNTIL, this));
        objectList.add(new StringNullTerminated(DataTypes.OBJ_CONTACT_URL, this));
        objectList.add(new NumberHashMap(DataTypes.OBJ_RECIEVED_AS, this, ReceivedAsTypes.RECEIVED_AS_FIELD_SIZE));
        objectList.add(new TextEncodedStringNullTerminated(DataTypes.OBJ_SELLER_NAME, this));
        objectList.add(new TextEncodedStringNullTerminated(DataTypes.OBJ_DESCRIPTION, this));
        objectList.add(new StringNullTerminated(DataTypes.OBJ_MIME_TYPE, this));
        objectList.add(new ByteArraySizeTerminated(DataTypes.OBJ_SELLER_LOGO, this));
    }
}
