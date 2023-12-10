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
package org.jaudiotagger.audio.flac.metadatablock;

import java.nio.ByteBuffer;

/**
 * Padding Block
 *
 * This block allows for an arbitrary amount of padding. The contents of a PADDING block have no meaning.
 *
 * This block is useful when it is known that metadata will be edited after encoding; the user can instruct the encoder
 * to reserve a PADDING block of sufficient size so that when metadata is added, it will simply overwrite the padding
 * (which is relatively quick) instead of having to insert it into the right place in the existing file
 * (which would normally require rewriting the entire file).
 */
public class MetadataBlockDataPadding implements MetadataBlockData
{
    private int length;

    public MetadataBlockDataPadding(int length)
    {
        this.length = length;
    }

    public ByteBuffer getBytes()
    {
        return ByteBuffer.allocate(length);
    }

    public int getLength()
    {
        return length;
    }
}
