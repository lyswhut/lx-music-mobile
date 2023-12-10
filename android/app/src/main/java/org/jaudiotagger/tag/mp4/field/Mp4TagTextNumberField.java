/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Raphaël Slinckx <raphael@slinckx.net>
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *  
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
package org.jaudiotagger.tag.mp4.field;

import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.mp4.atom.Mp4BoxHeader;
import org.jaudiotagger.tag.TagField;
import org.jaudiotagger.tag.mp4.atom.Mp4DataBox;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.util.List;

/**
 * Represents simple text field that contains an array of number,
 *
 * <p>But reads the data content as an array of 16 bit unsigned numbers
 */
public class Mp4TagTextNumberField extends Mp4TagTextField
{
    public static final int NUMBER_LENGTH = 2;

    //Holds the numbers decoded
    protected List<Short> numbers;

    /**
     * Create a new number, already parsed in subclasses
     *
     * @param id
     * @param numberArray
     */
    public Mp4TagTextNumberField(String id, String numberArray)
    {
        super(id, numberArray);
    }

    public Mp4TagTextNumberField(String id, ByteBuffer data) throws UnsupportedEncodingException
    {
        super(id, data);
    }

    /**
     * Recreate the raw data content from the list of numbers
     *
     * @return
     */
    protected byte[] getDataBytes()
    {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        for (Short number : numbers)
        {
            try
            {
                baos.write(Utils.getSizeBEInt16(number));
            }
            catch (IOException e)
            {
                //This should never happen because we are not writing to file at this point.
                throw new RuntimeException(e);
            }
        }
        return baos.toByteArray();
    }

    public void copyContent(TagField field)
    {
        if (field instanceof Mp4TagTextNumberField)
        {
            this.content = ((Mp4TagTextNumberField) field).getContent();
            this.numbers = ((Mp4TagTextNumberField) field).getNumbers();
        }
    }

    /**
     * @return type numeric
     */
    public Mp4FieldType getFieldType()
    {
        return Mp4FieldType.IMPLICIT;
    }

    protected void build(ByteBuffer data) throws UnsupportedEncodingException
    {
        //Data actually contains a 'Data' Box so process data using this
        Mp4BoxHeader header = new Mp4BoxHeader(data);
        Mp4DataBox databox = new Mp4DataBox(header, data);
        dataSize = header.getDataLength();
        content = databox.getContent();
        numbers = databox.getNumbers();
    }

    /**
     * @return the individual numbers making up this field
     */
    public List<Short> getNumbers()
    {
        return numbers;
    }
}
