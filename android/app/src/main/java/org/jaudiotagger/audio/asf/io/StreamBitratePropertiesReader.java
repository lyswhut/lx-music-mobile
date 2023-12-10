/*
 * Entagged Audio Tag library
 * Copyright (c) 2004-2005 Christian Laireiter <liree@web.de>
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
package org.jaudiotagger.audio.asf.io;

import org.jaudiotagger.audio.asf.data.Chunk;
import org.jaudiotagger.audio.asf.data.GUID;
import org.jaudiotagger.audio.asf.data.StreamBitratePropertiesChunk;
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;

/**
 * This class reads the chunk containing the stream bitrate properties.<br>
 *
 * @author Christian Laireiter
 */
public class StreamBitratePropertiesReader implements ChunkReader
{

    /**
     * The GUID this reader {@linkplain #getApplyingIds() applies to}
     */
    private final static GUID[] APPLYING = {GUID.GUID_STREAM_BITRATE_PROPERTIES};

    /**
     * Should not be used for now.
     */
    protected StreamBitratePropertiesReader()
    {
        // NOTHING toDo
    }

    /**
     * {@inheritDoc}
     */
    public boolean canFail()
    {
        return false;
    }

    /**
     * {@inheritDoc}
     */
    public GUID[] getApplyingIds()
    {
        return APPLYING.clone();
    }

    /**
     * {@inheritDoc}
     */
    public Chunk read(final GUID guid, final InputStream stream, final long chunkStart) throws IOException
    {
        final BigInteger chunkLen = Utils.readBig64(stream);
        final StreamBitratePropertiesChunk result = new StreamBitratePropertiesChunk(chunkLen);

        /*
         * Read the amount of bitrate records
         */
        final long recordCount = Utils.readUINT16(stream);
        for (int i = 0; i < recordCount; i++)
        {
            final int flags = Utils.readUINT16(stream);
            final long avgBitrate = Utils.readUINT32(stream);
            result.addBitrateRecord(flags & 0x00FF, avgBitrate);
        }

        result.setPosition(chunkStart);

        return result;
    }

}