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
import org.jaudiotagger.audio.asf.data.EncodingChunk;
import org.jaudiotagger.audio.asf.data.GUID;
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;

/**
 * This class reads the chunk containing encoding data <br>
 * <b>Warning:<b><br>
 * Implementation is not completed. More analysis of this chunk is needed.
 *
 * @author Christian Laireiter
 */
class EncodingChunkReader implements ChunkReader
{
    /**
     * The GUID this reader {@linkplain #getApplyingIds() applies to}
     */
    private final static GUID[] APPLYING = {GUID.GUID_ENCODING};

    /**
     * Should not be used for now.
     */
    protected EncodingChunkReader()
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
        final EncodingChunk result = new EncodingChunk(chunkLen);
        int readBytes = 24;
        // Can't be interpreted
        /*
         * What do I think of this data, well it seems to be another GUID. Then
         * followed by a UINT16 indicating a length of data following (by half).
         * My test files just had the length of one and a two bytes zero.
         */
        stream.skip(20);
        readBytes += 20;

        /*
         * Read the number of strings which will follow
         */
        final int stringCount = Utils.readUINT16(stream);
        readBytes += 2;

        /*
         * Now reading the specified amount of strings.
         */
        for (int i = 0; i < stringCount; i++)
        {
            final String curr = Utils.readCharacterSizedString(stream);
            result.addString(curr);
            readBytes += 4 + 2 * curr.length();
        }
        stream.skip(chunkLen.longValue() - readBytes);
        result.setPosition(chunkStart);
        return result;
    }

}