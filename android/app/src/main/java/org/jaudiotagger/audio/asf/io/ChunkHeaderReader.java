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
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;

/**
 * Default reader, Reads GUID and size out of an input stream and creates a
 * {@link org.jaudiotagger.audio.asf.data.Chunk}object, finally skips the
 * remaining chunk bytes.
 *
 * @author Christian Laireiter
 */
final class ChunkHeaderReader implements ChunkReader
{

    /**
     * The GUID this reader {@linkplain #getApplyingIds() applies to}
     */
    private final static GUID[] APPLYING = {GUID.GUID_UNSPECIFIED};

    /**
     * Default instance.
     */
    private static final ChunkHeaderReader INSTANCE = new ChunkHeaderReader();

    /**
     * Returns an instance of the reader.
     *
     * @return instance.
     */
    public static ChunkHeaderReader getInstance()
    {
        return INSTANCE;
    }

    /**
     * Hidden Utility class constructor.
     */
    private ChunkHeaderReader()
    {
        // Hidden
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
        stream.skip(chunkLen.longValue() - 24);
        return new Chunk(guid, chunkStart, chunkLen);
    }

}