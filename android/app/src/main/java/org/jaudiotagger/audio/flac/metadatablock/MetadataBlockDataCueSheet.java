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
 * Cuesheet Block
 *
 * <p>This block is for storing various information that can be used in a cue sheet. It supports track and index points,
 * compatible with Red Book CD digital audio discs, as well as other CD-DA metadata such as media catalog number and
 * track ISRCs. The CUESHEET block is especially useful for backing up CD-DA discs, but it can be used as a general
 * purpose cueing mechanism for playback
 */
public class MetadataBlockDataCueSheet implements MetadataBlockData
{
    private ByteBuffer data;

    public MetadataBlockDataCueSheet(MetadataBlockHeader header, FileChannel fc) throws IOException
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
