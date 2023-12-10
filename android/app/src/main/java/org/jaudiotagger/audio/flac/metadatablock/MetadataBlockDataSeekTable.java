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
 * SeekTable Block
 *
 * <p>This is an optional block for storing seek points. It is possible to seek to any given sample in a FLAC stream
 * without a seek table, but the delay can be unpredictable since the bitrate may vary widely within a stream.
 * By adding seek points to a stream, this delay can be significantly reduced. Each seek point takes 18 bytes, so 1%
 * resolution within a stream adds less than 2k. There can be only one SEEKTABLE in a stream, but the table can have
 * any number of seek points. There is also a special 'placeholder' seekpoint which will be ignored by decoders but
 * which can be used to reserve space for future seek point insertion.
 */
public class MetadataBlockDataSeekTable implements MetadataBlockData
{
    private ByteBuffer data;

    public MetadataBlockDataSeekTable(MetadataBlockHeader header, FileChannel fc) throws IOException
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
