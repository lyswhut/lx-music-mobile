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

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;


/**
 * Application Block
 *
 * <p>This block is for use by third-party applications. The only mandatory field is a 32-bit identifier.
 * This ID is granted upon request to an application by the FLAC maintainers. The remainder is of the block is defined
 * by the registered application.
 */
public class MetadataBlockDataApplication implements MetadataBlockData
{
    private ByteBuffer data;

    public MetadataBlockDataApplication(MetadataBlockHeader header, FileChannel fc) throws IOException
    {
        data = ByteBuffer.allocate(header.getDataLength());
        fc.read(data);
        data.flip();
    }

    public ByteBuffer getBytes()
    {
        return data;
    }


    public int getLength()
    {
        return data.limit();
    }
}
