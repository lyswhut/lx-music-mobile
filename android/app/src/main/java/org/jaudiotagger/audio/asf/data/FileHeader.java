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
import java.util.Date;

/**
 * This class stores the information about the file, which is contained within a
 * special chunk of ASF files.<br>
 *
 * @author Christian Laireiter
 */
public class FileHeader extends Chunk
{

    /**
     * Duration of the media content in 100ns steps.
     */
    private final BigInteger duration;

    /**
     * The time the file was created.
     */
    private final Date fileCreationTime;

    /**
     * Size of the file or stream.
     */
    private final BigInteger fileSize;

    /**
     * Usually contains value of 2.
     */
    private final long flags;

    /**
     * Maximum size of stream packages. <br>
     * <b>Warning: </b> must be same size as {@link #minPackageSize}. Its not
     * known how to handle deviating values.
     */
    private final long maxPackageSize;

    /**
     * Minimun size of stream packages. <br>
     * <b>Warning: </b> must be same size as {@link #maxPackageSize}. Its not
     * known how to handle deviating values.
     */
    private final long minPackageSize;

    /**
     * Number of stream packages within the File.
     */
    private final BigInteger packageCount;

    /**
     * No Idea of the Meaning, but stored anyway. <br>
     * Source documentation says it is: "Timestamp of end position"
     */
    private final BigInteger timeEndPos;

    /**
     * Like {@link #timeEndPos}no Idea.
     */
    private final BigInteger timeStartPos;

    /**
     * Size of an uncompressed video frame.
     */
    private final long uncompressedFrameSize;

    /**
     * Creates an instance.
     *
     * @param chunckLen           Length of the file header (chunk)
     * @param size                Size of file or stream
     * @param fileTime            Time file or stream was created. Time is calculated since 1st
     *                            january of 1601 in 100ns steps.
     * @param pkgCount            Number of stream packages.
     * @param dur                 Duration of media clip in 100ns steps
     * @param timestampStart      Timestamp of start {@link #timeStartPos}
     * @param timestampEnd        Timestamp of end {@link #timeEndPos}
     * @param headerFlags         some stream related flags.
     * @param minPkgSize          minimum size of packages
     * @param maxPkgSize          maximum size of packages
     * @param uncmpVideoFrameSize Size of an uncompressed Video Frame.
     */
    public FileHeader(final BigInteger chunckLen, final BigInteger size, final BigInteger fileTime, final BigInteger pkgCount, final BigInteger dur, final BigInteger timestampStart, final BigInteger timestampEnd, final long headerFlags, final long minPkgSize, final long maxPkgSize, final long uncmpVideoFrameSize)
    {
        super(GUID.GUID_FILE, chunckLen);
        this.fileSize = size;
        this.packageCount = pkgCount;
        this.duration = dur;
        this.timeStartPos = timestampStart;
        this.timeEndPos = timestampEnd;
        this.flags = headerFlags;
        this.minPackageSize = minPkgSize;
        this.maxPackageSize = maxPkgSize;
        this.uncompressedFrameSize = uncmpVideoFrameSize;
        this.fileCreationTime = Utils.getDateOf(fileTime).getTime();
    }

    /**
     * @return Returns the duration.
     */
    public BigInteger getDuration()
    {
        return this.duration;
    }

    /**
     * This method converts {@link #getDuration()}from 100ns steps to normal
     * seconds.
     *
     * @return Duration of the media in seconds.
     */
    public int getDurationInSeconds()
    {
        return this.duration.divide(new BigInteger("10000000")).intValue();
    }

    /**
     * @return Returns the fileCreationTime.
     */
    public Date getFileCreationTime()
    {
        return new Date(this.fileCreationTime.getTime());
    }

    /**
     * @return Returns the fileSize.
     */
    public BigInteger getFileSize()
    {
        return this.fileSize;
    }

    /**
     * @return Returns the flags.
     */
    public long getFlags()
    {
        return this.flags;
    }

    /**
     * @return Returns the maxPackageSize.
     */
    public long getMaxPackageSize()
    {
        return this.maxPackageSize;
    }

    /**
     * @return Returns the minPackageSize.
     */
    public long getMinPackageSize()
    {
        return this.minPackageSize;
    }

    /**
     * @return Returns the packageCount.
     */
    public BigInteger getPackageCount()
    {
        return this.packageCount;
    }

    /**
     * This method converts {@link #getDuration()} from 100ns steps to normal
     * seconds with a fractional part taking milliseconds.<br>
     *
     * @return The duration of the media in seconds (with a precision of
     * milliseconds)
     */
    public float getPreciseDuration()
    {
        return (float) (getDuration().doubleValue() / 10000000d);
    }

    /**
     * @return Returns the timeEndPos.
     */
    public BigInteger getTimeEndPos()
    {
        return this.timeEndPos;
    }

    /**
     * @return Returns the timeStartPos.
     */
    public BigInteger getTimeStartPos()
    {
        return this.timeStartPos;
    }

    /**
     * @return Returns the uncompressedFrameSize.
     */
    public long getUncompressedFrameSize()
    {
        return this.uncompressedFrameSize;
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
        result.append(prefix).append("  |-> Filesize      = ").append(getFileSize().toString()).append(" Bytes").append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |-> Media duration= ").append(getDuration().divide(new BigInteger("10000")).toString()).append(" ms").append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |-> Created at    = ").append(getFileCreationTime()).append(Utils.LINE_SEPARATOR);
        return result.toString();
    }
}