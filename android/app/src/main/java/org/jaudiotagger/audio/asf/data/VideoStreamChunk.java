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
 * @author Christian Laireiter
 */
public class VideoStreamChunk extends StreamChunk
{

    /**
     * Stores the codecs id. Normally the Four-CC (4-Bytes).
     */
    private byte[] codecId = new byte[0];

    /**
     * This field stores the height of the video stream.
     */
    private long pictureHeight;

    /**
     * This field stores the width of the video stream.
     */
    private long pictureWidth;

    /**
     * Creates an instance.
     *
     * @param chunkLen Length of the entire chunk (including guid and size)
     */
    public VideoStreamChunk(final BigInteger chunkLen)
    {
        super(GUID.GUID_VIDEOSTREAM, chunkLen);
    }

    /**
     * @return Returns the codecId.
     */
    public byte[] getCodecId()
    {
        return this.codecId.clone();
    }

    /**
     * Returns the {@link #getCodecId()}, as a String, where each byte has been
     * converted to a <code>char</code>.
     *
     * @return Codec Id as String.
     */
    public String getCodecIdAsString()
    {
        String result;
        if (this.codecId == null)
        {
            result = "Unknown";
        }
        else
        {
            result = new String(getCodecId());
        }
        return result;
    }

    /**
     * @return Returns the pictureHeight.
     */
    public long getPictureHeight()
    {
        return this.pictureHeight;
    }

    /**
     * @return Returns the pictureWidth.
     */
    public long getPictureWidth()
    {
        return this.pictureWidth;
    }

    /**
     * (overridden)
     *
     * @see StreamChunk#prettyPrint(String)
     */
    @Override
    public String prettyPrint(final String prefix)
    {
        final StringBuilder result = new StringBuilder(super.prettyPrint(prefix));
        result.insert(0, Utils.LINE_SEPARATOR + prefix + "|->VideoStream");
        result.append(prefix).append("Video info:").append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("      |->Width  : ").append(getPictureWidth()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("      |->Heigth : ").append(getPictureHeight()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("      |->Codec  : ").append(getCodecIdAsString()).append(Utils.LINE_SEPARATOR);
        return result.toString();
    }

    /**
     * @param codecIdentifier The codecId to set.
     */
    public void setCodecId(final byte[] codecIdentifier)
    {
        this.codecId = codecIdentifier.clone();
    }

    /**
     * @param picHeight
     */
    public void setPictureHeight(final long picHeight)
    {
        this.pictureHeight = picHeight;
    }

    /**
     * @param picWidth
     */
    public void setPictureWidth(final long picWidth)
    {
        this.pictureWidth = picWidth;
    }
}