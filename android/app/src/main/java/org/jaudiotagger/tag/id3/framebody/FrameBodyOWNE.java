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

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

/**
 * Ownership frame.
 *
 *
 * The ownership frame might be used as a reminder of a made transaction
 * or, if signed, as proof. Note that the "USER" and "TOWN" frames are
 * good to use in conjunction with this one. The frame begins, after the
 * frame ID, size and encoding fields, with a 'price payed' field. The
 * first three characters of this field contains the currency used for
 * the transaction, encoded according to ISO-4217 alphabetic
 * currency code. Concatenated to this is the actual price payed, as a
 * numerical string using "." as the decimal separator. Next is an 8
 * character date string (YYYYMMDD) followed by a string with the name
 * of the seller as the last field in the frame. There may only be one
 * "OWNE" frame in a tag.
 * <p><table border=0 width="70%">
 * <tr><td>&lt;Header for 'Ownership frame', ID: "OWNE"&gt;</td></tr>
 * <tr><td>Text encoding  </td><td>$xx                     </td></tr>
 * <tr><td>Price payed    </td><td>&lt;text string&gt; $00 </td></tr>
 * <tr><td>Date of purch. </td><td>&lt;text string&gt;     </td></tr>
 * <tr><td>Seller</td><td>&lt;text string according to encoding&gt;</td></tr>
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
public class FrameBodyOWNE extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{
    /**
     * Creates a new FrameBodyOWNE datatype.
     */
    public FrameBodyOWNE()
    {
        //        this.setObject("Text Encoding", new Byte((byte) 0));
        //        this.setObject("Price Paid", "");
        //        this.setObject("Date Of Purchase", "");
        //        this.setObject("Seller", "");
    }

    public FrameBodyOWNE(FrameBodyOWNE body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyOWNE datatype.
     *
     * @param textEncoding
     * @param pricePaid
     * @param dateOfPurchase
     * @param seller
     */
    public FrameBodyOWNE(byte textEncoding, String pricePaid, String dateOfPurchase, String seller)
    {
        this.setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        this.setObjectValue(DataTypes.OBJ_PRICE_PAID, pricePaid);
        this.setObjectValue(DataTypes.OBJ_PURCHASE_DATE, dateOfPurchase);
        this.setObjectValue(DataTypes.OBJ_SELLER_NAME, seller);
    }

    /**
     * Creates a new FrameBodyOWNE datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyOWNE(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
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
        return ID3v24Frames.FRAME_ID_OWNERSHIP;
    }

    /**
     * If the seller name cannot be encoded using current encoder, change the encoder
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        //Ensure valid for type
        setTextEncoding(ID3TextEncodingConversion.getTextEncoding(getHeader(), getTextEncoding()));

        //Ensure valid for data
        if (!((AbstractString) getObject(DataTypes.OBJ_SELLER_NAME)).canBeEncoded())
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
        objectList.add(new StringNullTerminated(DataTypes.OBJ_PRICE_PAID, this));
        objectList.add(new StringDate(DataTypes.OBJ_PURCHASE_DATE, this));
        objectList.add(new TextEncodedStringSizeTerminated(DataTypes.OBJ_SELLER_NAME, this));
    }
}
