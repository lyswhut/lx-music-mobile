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
 */
package org.jaudiotagger.tag.lyrics3;

import org.jaudiotagger.tag.InvalidTagException;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;


public class FieldFrameBodyUnsupported extends AbstractLyrics3v2FieldFrameBody
{
    /**
     *
     */
    private byte[] value = null;

    /**
     * Creates a new FieldBodyUnsupported datatype.
     */
    public FieldFrameBodyUnsupported()
    {
        //        this.value = new byte[0];
    }

    public FieldFrameBodyUnsupported(FieldFrameBodyUnsupported copyObject)
    {
        super(copyObject);
        this.value = copyObject.value.clone();
    }

    /**
     * Creates a new FieldBodyUnsupported datatype.
     *
     * @param value
     */
    public FieldFrameBodyUnsupported(byte[] value)
    {
        this.value = value;
    }

    /**
     * Creates a new FieldBodyUnsupported datatype.
     * @param byteBuffer
     * @throws org.jaudiotagger.tag.InvalidTagException
     */
    public FieldFrameBodyUnsupported(ByteBuffer byteBuffer) throws InvalidTagException
    {

        this.read(byteBuffer);

    }

    /**
     * @return
     */
    public String getIdentifier()
    {
        return "ZZZ";
    }

    /**
     * @param obj
     * @return
     */
    public boolean isSubsetOf(Object obj)
    {
        if (!(obj instanceof FieldFrameBodyUnsupported))
        {
            return false;
        }

        FieldFrameBodyUnsupported object = (FieldFrameBodyUnsupported) obj;

        String subset = new String(this.value);
        String superset = new String(object.value);

        return superset.contains(subset) && super.isSubsetOf(obj);

    }

    /**
     * @param obj
     * @return
     */
    public boolean equals(Object obj)
    {
        if (!(obj instanceof FieldFrameBodyUnsupported))
        {
            return false;
        }

        FieldFrameBodyUnsupported object = (FieldFrameBodyUnsupported) obj;

        return java.util.Arrays.equals(this.value, object.value) && super.equals(obj);

    }

    /**
     * @param byteBuffer
     * @throws IOException
     */
    public void read(ByteBuffer byteBuffer) throws InvalidTagException
    {
        int size;
        byte[] buffer = new byte[5];

        // read the 5 character size
        byteBuffer.get(buffer, 0, 5);
        size = Integer.parseInt(new String(buffer, 0, 5));

        value = new byte[size];

        // read the SIZE length description
        byteBuffer.get(value);
    }

    /**
     * @return
     */
    public String toString()
    {
        return getIdentifier() + " : " + (new String(value));
    }

    /**
     * @param file
     * @throws IOException
     */
    public void write(RandomAccessFile file) throws IOException
    {
        int offset = 0;
        String str;
        byte[] buffer = new byte[5];

        str = Integer.toString(value.length);

        for (int i = 0; i < (5 - str.length()); i++)
        {
            buffer[i] = (byte) '0';
        }

        offset += (5 - str.length());

        for (int i = 0; i < str.length(); i++)
        {
            buffer[i + offset] = (byte) str.charAt(i);
        }

        file.write(buffer);

        file.write(value);
    }

    /**
     * TODO
     */
    protected void setupObjectList()
    {

    }
}