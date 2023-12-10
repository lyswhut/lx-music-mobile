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
 * People List
 *
 */
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.datatype.NumberHashMap;
import org.jaudiotagger.tag.datatype.Pair;
import org.jaudiotagger.tag.datatype.PairedTextEncodedStringNullTerminated;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.StringTokenizer;


/**
 * Used by frames that take a pair of values such as TIPL, IPLS and TMCL
 *
 */
public abstract class AbstractFrameBodyPairs extends AbstractID3v2FrameBody implements ID3v24FrameBody
{

    /**
     * Creates a new AbstractFrameBodyPairs datatype.
     */
    public AbstractFrameBodyPairs()
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
    }

    /**
     * Creates a new AbstractFrameBodyPairs data type.
     *
     * @param textEncoding
     * @param text
     */
    public AbstractFrameBodyPairs(byte textEncoding, String text)
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        setText(text);
    }

    /**
     * Creates a new AbstractFrameBodyPairs data type.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws org.jaudiotagger.tag.InvalidTagException
     */
    public AbstractFrameBodyPairs(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public abstract String getIdentifier();

    /**
     * Set the text, decoded as pairs of involvee - involvement
     *
     * @param text
     */
    public void setText(String text)
    {
        PairedTextEncodedStringNullTerminated.ValuePairs value = new PairedTextEncodedStringNullTerminated.ValuePairs();
        StringTokenizer stz = new StringTokenizer(text, "\0");

        while (stz.hasMoreTokens())
        {
            String key =stz.nextToken();
            if(stz.hasMoreTokens())
            {
                value.add(key, stz.nextToken());
            }
            
        }
        setObjectValue(DataTypes.OBJ_TEXT, value);
    }

    /**
     * Parse text as a null separated pairing of function and name
     *
     * @param text
     */
    public void addPair(String text)
    {
        StringTokenizer stz = new StringTokenizer(text, "\0");
        if (stz.countTokens()==2)
        {
            addPair(stz.nextToken(),stz.nextToken());
        }
        else
        {
            addPair("", text);
        }
    }

    /**
     * Add pair
     *
     * @param function
     * @param name
     */
    public void addPair(String function,String name)
    {
        PairedTextEncodedStringNullTerminated.ValuePairs value = ((PairedTextEncodedStringNullTerminated) getObject(DataTypes.OBJ_TEXT)).getValue();
        value.add(function, name);

    }

    /**
     * Remove all Pairs
     */
    public void resetPairs()
    {
        PairedTextEncodedStringNullTerminated.ValuePairs value = ((PairedTextEncodedStringNullTerminated) getObject(DataTypes.OBJ_TEXT)).getValue();
        value.getMapping().clear();
    }

    /**
     * Because have a text encoding we need to check the data values do not contain characters that cannot be encoded in
     * current encoding before we write data. If they do change the encoding.
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        if (!((PairedTextEncodedStringNullTerminated) getObject(DataTypes.OBJ_TEXT)).canBeEncoded())
        {
            this.setTextEncoding(TextEncoding.UTF_16);
        }
        super.write(tagBuffer);
    }

    /**
     * Consists of a text encoding , and then a series of null terminated Strings, there should be an even number
     * of Strings as they are paired as involvement/involvee
     */
    protected void setupObjectList()
    {
        objectList.add(new NumberHashMap(DataTypes.OBJ_TEXT_ENCODING, this, TextEncoding.TEXT_ENCODING_FIELD_SIZE));
        objectList.add(new PairedTextEncodedStringNullTerminated(DataTypes.OBJ_TEXT, this));
    }

    public PairedTextEncodedStringNullTerminated.ValuePairs getPairing()
    {
        return (PairedTextEncodedStringNullTerminated.ValuePairs) getObject(DataTypes.OBJ_TEXT).getValue();
    }

    /**
     * Get key at index
     *
     * @param index
     * @return value at index
     */
    public String getKeyAtIndex(int index)
    {
        PairedTextEncodedStringNullTerminated text = (PairedTextEncodedStringNullTerminated) getObject(DataTypes.OBJ_TEXT);
        return text.getValue().getMapping().get(index).getKey();
    }

    /**
     * Get value at index
     *
     * @param index
     * @return value at index
     */
    public String getValueAtIndex(int index)
    {
        PairedTextEncodedStringNullTerminated text = (PairedTextEncodedStringNullTerminated) getObject(DataTypes.OBJ_TEXT);
        return text.getValue().getMapping().get(index).getValue();
    }

    /**
     * @return number of text pairs
     */
    public int getNumberOfPairs()
    {
        PairedTextEncodedStringNullTerminated text = (PairedTextEncodedStringNullTerminated) getObject(DataTypes.OBJ_TEXT);
        return text.getValue().getNumberOfPairs();
    }

    public String getText()
    {
        PairedTextEncodedStringNullTerminated text = (PairedTextEncodedStringNullTerminated) getObject(DataTypes.OBJ_TEXT);
        StringBuilder sb = new StringBuilder();
        int count = 1;
        for (Pair entry : text.getValue().getMapping())
        {
            sb.append(entry.getKey() + '\0' + entry.getValue());
            if (count != getNumberOfPairs())
            {
                sb.append('\0');
            }
            count++;
        }
        return sb.toString();
    }

    public String getUserFriendlyValue()
    {
        return getText();
    }
}
