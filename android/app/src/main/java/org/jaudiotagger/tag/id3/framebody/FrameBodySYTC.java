/*
 *  MusicTag Copyright (C)2003,2004
 *
 *  This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 *  General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 *  or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 *  the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *  See the GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License along with this library; if not,
 *  you can get a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.*;
import org.jaudiotagger.tag.id3.ID3v24Frames;
import org.jaudiotagger.tag.id3.valuepair.EventTimingTimestampTypes;

import java.nio.ByteBuffer;
import java.util.*;

/**
 * Synchronised tempo codes frame.
 *
 *
 * For a more accurate description of the tempo of a musical piece this
 * frame might be used. After the header follows one byte describing
 * which time stamp format should be used. Then follows one or more
 * tempo codes. Each tempo code consists of one tempo part and one time
 * part. The tempo is in BPM described with one or two bytes. If the
 * first byte has the value $FF, one more byte follows, which is added
 * to the first giving a range from 2 - 510 BPM, since $00 and $01 is
 * reserved. $00 is used to describe a beat-free time period, which is
 * not the same as a music-free time period. $01 is used to indicate one
 * single beat-stroke followed by a beat-free period.
 * <p>
 * The tempo descriptor is followed by a time stamp. Every time the
 * tempo in the music changes, a tempo descriptor may indicate this for
 * the player. All tempo descriptors should be sorted in chronological
 * order. The first beat-stroke in a time-period is at the same time as
 * the beat description occurs. There may only be one "SYTC" frame in
 * each tag.
 * <p><table border=0 width="70%">
 * <tr><td colspan=2> &lt;Header for 'Synchronised tempo codes', ID: "SYTC"&gt;</td></tr>
 * <tr><td>Time stamp format</td><td width="80%">$xx</td></tr>
 * <tr><td>Tempo data </td><td>&lt;binary data&gt;</td></tr>
 * </table><p>
 * Where time stamp format is:
 * <p>
 * $01 Absolute time, 32 bit sized, using MPEG frames as unit<br>
 * $02 Absolute time, 32 bit sized, using milliseconds as unit
 * <p>
 * Abolute time means that every stamp contains the time from the
 * beginning of the file.
 *
 *
 * <p>For more details, please refer to the ID3 specifications:
 * <ul>
 * <li><a href="http://www.id3.org/id3v2.3.0.txt">ID3 v2.3.0 Spec</a>
 * </ul>
 *
 * @author : Paul Taylor
 * @author : Eric Farng
 * @author : Hendrik Schreiber
 * @version $Id$
 */
public class FrameBodySYTC extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{
    public static final int MPEG_FRAMES = 1;
    public static final int MILLISECONDS = 2;

    /**
     * Creates a new FrameBodySYTC datatype.
     */
    public FrameBodySYTC()
    {
        setObjectValue(DataTypes.OBJ_TIME_STAMP_FORMAT, MILLISECONDS);
    }

    /**
     * @param timestampFormat
     * @param tempo
     */
    public FrameBodySYTC(final int timestampFormat, final byte[] tempo)
    {
        setObjectValue(DataTypes.OBJ_TIME_STAMP_FORMAT, timestampFormat);
        setObjectValue(DataTypes.OBJ_SYNCHRONISED_TEMPO_LIST, tempo);
    }

    /**
     * Creates a new FrameBody from buffer
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodySYTC(final ByteBuffer byteBuffer, final int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * Copy constructor
     *
     * @param body
     */
    public FrameBodySYTC(final FrameBodySYTC body)
    {
        super(body);
    }

    /**
     * Timestamp format for all events in this frame.
     * A value of {@code 1} means absolute time (32 bit) using <a href="#MPEG">MPEG</a> frames as unit.
     * A value of {@code 2} means absolute time (32 bit) using milliseconds as unit.
     *
     * @return timestamp format
     * @see #MILLISECONDS
     * @see #MPEG_FRAMES
     */
    public int getTimestampFormat()
    {
        return ((Number) getObjectValue(DataTypes.OBJ_TIME_STAMP_FORMAT)).intValue();
    }

    /**
     * Sets the timestamp format.
     *
     * @param timestampFormat 1 for MPEG frames or 2 for milliseconds
     * @see #getTimestampFormat()
     */
    public void setTimestampFormat(final int timestampFormat)
    {
        if (EventTimingTimestampTypes.getInstanceOf().getValueForId(timestampFormat) == null)
        {
            throw new IllegalArgumentException("Timestamp format must be 1 or 2 (ID3v2.4, 4.7): " + timestampFormat);
        }
        setObjectValue(DataTypes.OBJ_TIME_STAMP_FORMAT, timestampFormat);
    }

    /**
     * Chronological map of tempi.
     *
     * @return map of tempi
     */
    public Map<Long, Integer> getTempi()
    {
        final Map<Long, Integer> map = new LinkedHashMap<Long, Integer>();
        final List<SynchronisedTempoCode> codes = (List<SynchronisedTempoCode>)getObjectValue(DataTypes.OBJ_SYNCHRONISED_TEMPO_LIST);
        for (final SynchronisedTempoCode code : codes)
        {
            map.put(code.getTimestamp(), code.getTempo());
        }
        return Collections.unmodifiableMap(map);
    }

    /**
     * Chronological list of timestamps.
     *
     * @return list of timestamps
     */
    public List<Long> getTimestamps()
    {
        final List<Long> list = new ArrayList<Long>();
        final List<SynchronisedTempoCode> codes = (List<SynchronisedTempoCode>)getObjectValue(DataTypes.OBJ_SYNCHRONISED_TEMPO_LIST);
        for (final SynchronisedTempoCode code : codes)
        {
            list.add(code.getTimestamp());
        }
        return Collections.unmodifiableList(list);
    }

    /**
     * Adds a tempo.
     *
     * @param timestamp timestamp
     * @param tempo tempo
     */
    public void addTempo(final long timestamp, final int tempo)
    {
        // make sure we don't have two tempi at the same time
        removeTempo(timestamp);
        final List<SynchronisedTempoCode> codes = (List<SynchronisedTempoCode>)getObjectValue(DataTypes.OBJ_SYNCHRONISED_TEMPO_LIST);
        int insertIndex = 0;
        if (!codes.isEmpty() && codes.get(0).getTimestamp() <= timestamp)
        {
            for (final SynchronisedTempoCode code : codes)
            {
                final long translatedTimestamp = code.getTimestamp();
                if (timestamp < translatedTimestamp)
                {
                    break;
                }
                insertIndex++;
            }
        }
        codes.add(insertIndex, new SynchronisedTempoCode(DataTypes.OBJ_SYNCHRONISED_TEMPO, this, tempo, timestamp));
    }

    /**
     * Removes a tempo at a given timestamp.
     *
     * @param timestamp timestamp
     * @return {@code true}, if any timestamps were removed
     */
    public boolean removeTempo(final long timestamp)
    {
        final List<SynchronisedTempoCode> codes = (List<SynchronisedTempoCode>)getObjectValue(DataTypes.OBJ_SYNCHRONISED_TEMPO_LIST);
        boolean removed = false;
        for (final ListIterator<SynchronisedTempoCode> iterator = codes.listIterator(); iterator.hasNext(); )
        {
            final SynchronisedTempoCode code = iterator.next();
            if (timestamp == code.getTimestamp())
            {
                iterator.remove();
                removed = true;
            }
            if (timestamp > code.getTimestamp())
            {
                break;
            }
        }
        return removed;
    }

    /**
     * Remove all timing codes.
     */
    public void clearTempi()
    {
        ((List<EventTimingCode>)getObjectValue(DataTypes.OBJ_SYNCHRONISED_TEMPO_LIST)).clear();
    }

    @Override
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_SYNC_TEMPO;
    }

    @Override
    public void read(final ByteBuffer byteBuffer) throws InvalidTagException
    {
        super.read(byteBuffer);

        // validate input
        final List<SynchronisedTempoCode> codes = (List<SynchronisedTempoCode>)getObjectValue(DataTypes.OBJ_SYNCHRONISED_TEMPO_LIST);
        long lastTimestamp = 0;
        for (final SynchronisedTempoCode code : codes)
        {
            if (code.getTimestamp() < lastTimestamp)
            {
                logger.warning("Synchronised tempo codes are not in chronological order. " + lastTimestamp + " is followed by " + code.getTimestamp() + ".");
                // throw exception???
            }
            lastTimestamp = code.getTimestamp();
        }
    }

    @Override
    protected void setupObjectList()
    {
        objectList.add(new NumberHashMap(DataTypes.OBJ_TIME_STAMP_FORMAT, this, EventTimingTimestampTypes.TIMESTAMP_KEY_FIELD_SIZE));
        objectList.add(new SynchronisedTempoCodeList(this));
    }
}