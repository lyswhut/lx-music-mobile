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
package org.jaudiotagger.audio.generic;

import org.jaudiotagger.tag.Tag;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;

/**
 * Abstract class for creating the raw content that represents the tag so it can be written
 * to file.
 */
public abstract class AbstractTagCreator
{
    /**
     * Convert tagdata to rawdata ready for writing to file with no additional padding
     *
     * @param tag
     * @return
     * @throws UnsupportedEncodingException
     */
    public ByteBuffer convert(Tag tag) throws UnsupportedEncodingException
    {
        return convert(tag, 0);
    }

    /**
     * Convert tagdata to rawdata ready for writing to file
     *
     * @param tag
     * @param padding TODO is this padding or additional padding
     * @return
     * @throws UnsupportedEncodingException
     */
    public abstract ByteBuffer convert(Tag tag, int padding) throws UnsupportedEncodingException;
}
