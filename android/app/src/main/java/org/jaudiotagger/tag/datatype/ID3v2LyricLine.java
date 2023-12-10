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
package org.jaudiotagger.tag.datatype;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.tag.InvalidDataTypeException;
import org.jaudiotagger.tag.id3.AbstractTagFrameBody;

public class ID3v2LyricLine extends AbstractDataType
{
    /**
     *
     */
    String text = "";

    /**
     *
     */
    long timeStamp = 0;

    public ID3v2LyricLine(String identifier, AbstractTagFrameBody frameBody)
    {
        super(identifier, frameBody);
    }

    public ID3v2LyricLine(ID3v2LyricLine copy)
    {
        super(copy);
        this.text = copy.text;
        this.timeStamp = copy.timeStamp;
    }

    /**
     * @return
     */
    public int getSize()
    {
        return text.length() + 1 + 4;
    }

    public void setText(String text)
    {
        this.text = text;
    }

    /**
     * @return
     */
    public String getText()
    {
        return text;
    }

    public void setTimeStamp(long timeStamp)
    {
        this.timeStamp = timeStamp;
    }

    /**
     * @return
     */
    public long getTimeStamp()
    {
        return timeStamp;
    }

    /**
     * @param obj
     * @return
     */
    public boolean equals(Object obj)
    {
        if (!(obj instanceof ID3v2LyricLine))
        {
            return false;
        }

        ID3v2LyricLine object = (ID3v2LyricLine) obj;

        if (!this.text.equals(object.text))
        {
            return false;
        }

        return this.timeStamp == object.timeStamp && super.equals(obj);

    }

    /**
     * @param arr
     * @param offset
     * @throws NullPointerException
     * @throws IndexOutOfBoundsException
     */
    public void readByteArray(byte[] arr, int offset) throws InvalidDataTypeException
    {
        if (arr == null)
        {
            throw new NullPointerException("Byte array is null");
        }

        if ((offset < 0) || (offset >= arr.length))
        {
            throw new IndexOutOfBoundsException("Offset to byte array is out of bounds: offset = " + offset + ", array.length = " + arr.length);
        }

        //offset += ();
        text = new String(arr, offset, arr.length - offset - 4, StandardCharsets.ISO_8859_1);

        //text = text.substring(0, text.length() - 5);
        timeStamp = 0;

        for (int i = arr.length - 4; i < arr.length; i++)
        {
            timeStamp <<= 8;
            timeStamp += arr[i];
        }
    }

    /**
     * @return
     */
    public String toString()
    {
        return timeStamp + " " + text;
    }

    /**
     * @return
     */
    public byte[] writeByteArray()
    {
        int i;
        byte[] arr = new byte[getSize()];

        for (i = 0; i < text.length(); i++)
        {
            arr[i] = (byte) text.charAt(i);
        }

        arr[i++] = 0;
        arr[i++] = (byte) ((timeStamp & 0xFF000000) >> 24);
        arr[i++] = (byte) ((timeStamp & 0x00FF0000) >> 16);
        arr[i++] = (byte) ((timeStamp & 0x0000FF00) >> 8);
        arr[i++] = (byte) (timeStamp & 0x000000FF);

        return arr;
    }
}
