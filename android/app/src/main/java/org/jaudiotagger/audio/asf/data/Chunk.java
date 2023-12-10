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
package org.jaudiotagger.audio.asf.data;

import org.jaudiotagger.audio.asf.util.Utils;

import java.math.BigInteger;

/**
 * This class represents a chunk within ASF streams. <br>
 * Each chunk starts with a 16byte {@linkplain GUID GUID} identifying the type.
 * After that a number (represented by 8 bytes) follows which shows the size in
 * bytes of the chunk. Finally there is the data of the chunk.
 *
 * @author Christian Laireiter
 */
public class Chunk
{

    /**
     * The length of current chunk. <br>
     */
    protected final BigInteger chunkLength;

    /**
     * The GUID of represented chunk header.
     */
    protected final GUID guid;

    /**
     * The position of current header object within file or stream.
     */
    protected long position;

    /**
     * Creates an instance
     *
     * @param headerGuid The GUID of header object.
     * @param chunkLen   Length of current chunk.
     */
    public Chunk(final GUID headerGuid, final BigInteger chunkLen)
    {
        if (headerGuid == null)
        {
            throw new IllegalArgumentException("GUID must not be null.");
        }
        if (chunkLen == null || chunkLen.compareTo(BigInteger.ZERO) < 0)
        {
            throw new IllegalArgumentException("chunkLen must not be null nor negative.");
        }
        this.guid = headerGuid;
        this.chunkLength = chunkLen;
    }

    /**
     * Creates an instance
     *
     * @param headerGuid The GUID of header object.
     * @param pos        Position of header object within stream or file.
     * @param chunkLen   Length of current chunk.
     */
    public Chunk(final GUID headerGuid, final long pos, final BigInteger chunkLen)
    {
        if (headerGuid == null)
        {
            throw new IllegalArgumentException("GUID must not be null");
        }
        if (pos < 0)
        {
            throw new IllegalArgumentException("Position of header can't be negative.");
        }
        if (chunkLen == null || chunkLen.compareTo(BigInteger.ZERO) < 0)
        {
            throw new IllegalArgumentException("chunkLen must not be null nor negative.");
        }
        this.guid = headerGuid;
        this.position = pos;
        this.chunkLength = chunkLen;
    }

    /**
     * This method returns the End of the current chunk introduced by current
     * header object.
     *
     * @return Position after current chunk.
     * @deprecated typo, use {@link #getChunkEnd()} instead.
     */
    @Deprecated
    public long getChunckEnd()
    {
        return this.position + this.chunkLength.longValue();
    }

    /**
     * This method returns the End of the current chunk introduced by current
     * header object.
     *
     * @return Position after current chunk.
     */
    public long getChunkEnd()
    {
        return this.position + this.chunkLength.longValue();
    }

    /**
     * @return Returns the chunkLength.
     */
    public BigInteger getChunkLength()
    {
        return this.chunkLength;
    }

    /**
     * @return Returns the guid.
     */
    public GUID getGuid()
    {
        return this.guid;
    }

    /**
     * @return Returns the position.
     */
    public long getPosition()
    {
        return this.position;
    }

    /**
     * This method creates a String containing useful information prepared to be
     * printed on STD-OUT. <br>
     * This method is intended to be overwritten by inheriting classes.
     *
     * @param prefix each line gets this string prepended.
     * @return Information of current Chunk Object.
     */
    public String prettyPrint(final String prefix)
    {
        final StringBuilder result = new StringBuilder();
        result.append(prefix).append("-> GUID: ").append(GUID.getGuidDescription(this.guid)).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  | : Starts at position: ").append(getPosition()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  | : Last byte at: ").append(getChunkEnd() - 1).append(Utils.LINE_SEPARATOR);
        return result.toString();
    }

    /**
     * Sets the position.
     *
     * @param pos position to set.
     */
    public void setPosition(final long pos)
    {
        this.position = pos;
    }

    /**
     * (overridden)
     *
     * @see Object#toString()
     */
    @Override
    public String toString()
    {
        return prettyPrint("");
    }

}