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
 * This class is the base for all handled stream contents. <br>
 * A Stream chunk delivers information about a audio or video stream. Because of
 * this the stream chunk identifies in one field what type of stream it is
 * describing and so other data is provided. However some information is common
 * to all stream chunks which are stored in this hierarchy of the class tree.
 *
 * @author Christian Laireiter
 */
public abstract class StreamChunk extends Chunk
{

    /**
     * If <code>true</code>, the stream data is encrypted.
     */
    private boolean contentEncrypted;

    /**
     * This field stores the number of the current stream. <br>
     */
    private int streamNumber;

    /**
     * @see #typeSpecificDataSize
     */
    private long streamSpecificDataSize;

    /**
     * Something technical. <br>
     * Format time in 100-ns steps.
     */
    private long timeOffset;

    /**
     * Stores the stream type.<br>
     *
     * @see GUID#GUID_AUDIOSTREAM
     * @see GUID#GUID_VIDEOSTREAM
     */
    private final GUID type;

    /**
     * Stores the size of type specific data structure within chunk.
     */
    private long typeSpecificDataSize;

    /**
     * Creates an instance
     *
     * @param streamType The GUID which tells the stream type represented (
     *                   {@link GUID#GUID_AUDIOSTREAM} or {@link GUID#GUID_VIDEOSTREAM}
     *                   ):
     * @param chunkLen   length of chunk
     */
    public StreamChunk(final GUID streamType, final BigInteger chunkLen)
    {
        super(GUID.GUID_STREAM, chunkLen);
        assert GUID.GUID_AUDIOSTREAM.equals(streamType) || GUID.GUID_VIDEOSTREAM.equals(streamType);
        this.type = streamType;
    }

    /**
     * @return Returns the streamNumber.
     */
    public int getStreamNumber()
    {
        return this.streamNumber;
    }

    /**
     * @return Returns the streamSpecificDataSize.
     */
    public long getStreamSpecificDataSize()
    {
        return this.streamSpecificDataSize;
    }

    /**
     * Returns the stream type of the stream chunk.<br>
     *
     * @return {@link GUID#GUID_AUDIOSTREAM} or {@link GUID#GUID_VIDEOSTREAM}.
     */
    public GUID getStreamType()
    {
        return this.type;
    }

    /**
     * @return Returns the timeOffset.
     */
    public long getTimeOffset()
    {
        return this.timeOffset;
    }

    /**
     * @return Returns the typeSpecificDataSize.
     */
    public long getTypeSpecificDataSize()
    {
        return this.typeSpecificDataSize;
    }

    /**
     * @return Returns the contentEncrypted.
     */
    public boolean isContentEncrypted()
    {
        return this.contentEncrypted;
    }

    /**
     * (overridden)
     *
     * @see Chunk#prettyPrint(String)
     */
    @Override
    public String prettyPrint(final String prefix)
    {
        final StringBuilder result = new StringBuilder(super.prettyPrint(prefix));
        result.append(prefix).append("  |-> Stream number: ").append(getStreamNumber()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |-> Type specific data size  : ").append(getTypeSpecificDataSize()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |-> Stream specific data size: ").append(getStreamSpecificDataSize()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |-> Time Offset              : ").append(getTimeOffset()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |-> Content Encryption       : ").append(isContentEncrypted()).append(Utils.LINE_SEPARATOR);
        return result.toString();
    }

    /**
     * @param cntEnc The contentEncrypted to set.
     */
    public void setContentEncrypted(final boolean cntEnc)
    {
        this.contentEncrypted = cntEnc;
    }

    /**
     * @param streamNum The streamNumber to set.
     */
    public void setStreamNumber(final int streamNum)
    {
        this.streamNumber = streamNum;
    }

    /**
     * @param strSpecDataSize The streamSpecificDataSize to set.
     */
    public void setStreamSpecificDataSize(final long strSpecDataSize)
    {
        this.streamSpecificDataSize = strSpecDataSize;
    }

    /**
     * @param timeOffs sets the time offset
     */
    public void setTimeOffset(final long timeOffs)
    {
        this.timeOffset = timeOffs;
    }

    /**
     * @param typeSpecDataSize The typeSpecificDataSize to set.
     */
    public void setTypeSpecificDataSize(final long typeSpecDataSize)
    {
        this.typeSpecificDataSize = typeSpecDataSize;
    }
}