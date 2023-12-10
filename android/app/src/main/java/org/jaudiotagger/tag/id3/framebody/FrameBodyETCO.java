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
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.datatype.EventTimingCode;
import org.jaudiotagger.tag.datatype.EventTimingCodeList;
import org.jaudiotagger.tag.datatype.NumberHashMap;
import org.jaudiotagger.tag.id3.ID3v24Frames;
import org.jaudiotagger.tag.id3.valuepair.EventTimingTimestampTypes;

import java.nio.ByteBuffer;
import java.util.*;

/**
 * Event timing codes frame.
 *
 *
 * This frame allows synchronisation with key events in a song or sound.
 * The header is:
 * <p><table border=0 width="70%">
 * <tr><td colspan=2> &lt;Header for 'Event timing codes', ID: "ETCO"&gt;</td></tr>
 * <tr><td>Time stamp format</td><td width="80%">$xx</td></tr>
 * </table><p>
 * Where time stamp format is:
 * <p>
 * $01 Absolute time, 32 bit sized, using <a href="#MPEG">MPEG</a> frames as unit<br>
 * $02 Absolute time, 32 bit sized, using milliseconds as unit
 * <p>
 * Absolute time means that every stamp contains the time from the
 * beginning of the file.
 * <p>
 * Followed by a list of key events in the following format:
 * <p><table border=0 width="70%">
 * <tr><td>Type of event</td><td width="80%">$xx</td></tr>
 * <tr><td>Time stamp</td><td>$xx (xx ...)</td></tr>
 * </table><p>
 * The 'Time stamp' is set to zero if directly at the beginning of the
 * sound or after the previous event. All events should be sorted in
 * chronological order. The type of event is as follows:
 * <p><table border=0 width="70%">
 * <tr><td>$00    </td><td width="80%">padding (has no meaning)</td></tr>
 * <tr><td>$01    </td><td>end of initial silence              </td></tr>
 * <tr><td>$02    </td><td>intro start                         </td></tr>
 * <tr><td>$03    </td><td>mainpart start                      </td></tr>
 * <tr><td>$04    </td><td>outro start                         </td></tr>
 * <tr><td>$05    </td><td>outro end                           </td></tr>
 * <tr><td>$06    </td><td>verse start                         </td></tr>
 * <tr><td>$07    </td><td>refrain start                       </td></tr>
 * <tr><td>$08    </td><td>interlude start                     </td></tr>
 * <tr><td>$09    </td><td>theme start                         </td></tr>
 * <tr><td>$0A    </td><td>variation start                     </td></tr>
 * <tr><td>$0B    </td><td>key change                          </td></tr>
 * <tr><td>$0C    </td><td>time change                         </td></tr>
 * <tr><td>$0D    </td><td>momentary unwanted noise (Snap, Crackle & Pop)</td></tr>
 * <tr><td>$0E    </td><td>sustained noise                     </td></tr>
 * <tr><td>$0F    </td><td>sustained noise end                 </td></tr>
 * <tr><td>$10    </td><td>intro end                           </td></tr>
 * <tr><td>$11    </td><td>mainpart end                        </td></tr>
 * <tr><td>$12    </td><td>verse end                           </td></tr>
 * <tr><td>$13    </td><td>refrain end                         </td></tr>
 * <tr><td>$14    </td><td>theme end                           </td></tr>
 * <tr><td>$15-$DF</td><td>reserved for future use             </td></tr>
 * <tr><td>$E0-$EF</td><td>not predefined sync 0-F             </td></tr>
 * <tr><td>$F0-$FC</td><td>reserved for future use             </td></tr>
 * <tr><td>$FD    </td><td>audio end (start of silence)        </td></tr>
 * <tr><td>$FE    </td><td>audio file ends                     </td></tr>
 * <tr><td>$FF</td><td>one more byte of events follows (all the following bytes with the value $FF have the same function)</td></tr>
 * </table></center>
 * <p>
 * Terminating the start events such as "intro start" is not required.
 * The 'Not predefined sync's ($E0-EF) are for user events. You might
 * want to synchronise your music to something, like setting of an
 * explosion on-stage, turning on your screensaver etc.
 * <p>
 * There may only be one "ETCO" frame in each tag.
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
public class FrameBodyETCO extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{

    public static final int MPEG_FRAMES = 1;
    public static final int MILLISECONDS = 2;

    /**
     * Creates a new FrameBodyETCO datatype.
     */
    public FrameBodyETCO()
    {
        setObjectValue(DataTypes.OBJ_TIME_STAMP_FORMAT, MILLISECONDS);
    }

    public FrameBodyETCO(final FrameBodyETCO body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyETCO datatype.
     *
     * @param byteBuffer buffer to read from
     * @param frameSize size of the frame
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyETCO(final ByteBuffer byteBuffer, final int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
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
            throw new IllegalArgumentException("Timestamp format must be 1 or 2 (ID3v2.4, 4.5): " + timestampFormat);
        }
        setObjectValue(DataTypes.OBJ_TIME_STAMP_FORMAT, timestampFormat);
    }

    /**
     * Chronological map of timing codes.
     *
     * @return map of timing codes
     */
    public Map<Long, int[]> getTimingCodes()
    {
        final Map<Long, int[]> map = new LinkedHashMap<Long, int[]>();
        final List<EventTimingCode> codes = (List<EventTimingCode>)getObjectValue(DataTypes.OBJ_TIMED_EVENT_LIST);
        long lastTimestamp = 0;
        for (final EventTimingCode code : codes)
        {
            final long translatedTimestamp = code.getTimestamp() == 0 ? lastTimestamp : code.getTimestamp();
            final int[] types = map.get(translatedTimestamp);
            if (types == null) {
                map.put(translatedTimestamp, new int[]{code.getType()});
            } else {
                final int[] newTypes = new int[types.length + 1];
                System.arraycopy(types, 0, newTypes, 0, types.length);
                newTypes[newTypes.length-1] = code.getType();
                map.put(translatedTimestamp, newTypes);
            }
            lastTimestamp = translatedTimestamp;
        }
        return Collections.unmodifiableMap(map);
    }

    /**
     * Chronological list of timestamps of a set of given types.
     *
     * @param type types
     * @return list of timestamps
     */
    public List<Long> getTimestamps(final int... type)
    {
        final Set<Integer> typeSet = toSet(type);
        final List<Long> list = new ArrayList<Long>();
        final List<EventTimingCode> codes = (List<EventTimingCode>)getObjectValue(DataTypes.OBJ_TIMED_EVENT_LIST);
        long lastTimestamp = 0;
        for (final EventTimingCode code : codes)
        {
            final long translatedTimestamp = code.getTimestamp() == 0 ? lastTimestamp : code.getTimestamp();
            if (typeSet.contains(code.getType()))
            {
                list.add(translatedTimestamp);
            }
            lastTimestamp = translatedTimestamp;
        }
        return Collections.unmodifiableList(list);
    }

    /**
     * Adds a timing code for each given type.
     *
     * @param timestamp timestamp
     * @param types types
     */
    public void addTimingCode(final long timestamp, final int... types)
    {
        final List<EventTimingCode> codes = (List<EventTimingCode>)getObjectValue(DataTypes.OBJ_TIMED_EVENT_LIST);
        long lastTimestamp = 0;
        int insertIndex = 0;
        if (!codes.isEmpty() && codes.get(0).getTimestamp() <= timestamp)
        {
            for (final EventTimingCode code : codes)
            {
                final long translatedTimestamp = code.getTimestamp() == 0 ? lastTimestamp : code.getTimestamp();
                if (timestamp < translatedTimestamp)
                {
                    break;
                }
                insertIndex++;
                lastTimestamp = translatedTimestamp;
            }
        }
        for (final int type : types) {
            codes.add(insertIndex, new EventTimingCode(DataTypes.OBJ_TIMED_EVENT, this, type, timestamp));
            insertIndex++; // preserve order of types
        }
    }

    /**
     * Removes timestamps at a given time with the given types.
     *
     * @param timestamp timestamp
     * @param types types
     * @return {@code true}, if any timestamps were removed
     */
    public boolean removeTimingCode(final long timestamp, final int... types)
    {
        // before we can remove anything, we have to resolve relative 0-timestamps
        // otherwise we might remove the anchor a relative timestamp relies on
        resolveRelativeTimestamps();
        final Set<Integer> typeSet = toSet(types);
        final List<EventTimingCode> codes = (List<EventTimingCode>)getObjectValue(DataTypes.OBJ_TIMED_EVENT_LIST);
        boolean removed = false;
        for (final ListIterator<EventTimingCode> iterator = codes.listIterator(); iterator.hasNext(); )
        {
            final EventTimingCode code = iterator.next();
            if (timestamp == code.getTimestamp() && typeSet.contains(code.getType()))
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
    public void clearTimingCodes()
    {
        ((List<EventTimingCode>)getObjectValue(DataTypes.OBJ_TIMED_EVENT_LIST)).clear();
    }

    /**
     * Resolve any relative timestamp (zero timestamp after a non-zero timestamp) to absolute timestamp.
     */
    private void resolveRelativeTimestamps()
    {
        final List<EventTimingCode> codes = (List<EventTimingCode>)getObjectValue(DataTypes.OBJ_TIMED_EVENT_LIST);
        long lastTimestamp = 0;
        for (final EventTimingCode code : codes)
        {
            final long translatedTimestamp = code.getTimestamp() == 0 ? lastTimestamp : code.getTimestamp();
            code.setTimestamp(translatedTimestamp);
            lastTimestamp = translatedTimestamp;
        }
    }

    @Override
    public void read(final ByteBuffer byteBuffer) throws InvalidTagException
    {
        super.read(byteBuffer);

        // validate input
        final List<EventTimingCode> codes = (List<EventTimingCode>)getObjectValue(DataTypes.OBJ_TIMED_EVENT_LIST);
        long lastTimestamp = 0;
        for (final EventTimingCode code : codes)
        {
            final long translatedTimestamp = code.getTimestamp() == 0 ? lastTimestamp : code.getTimestamp();
            if (code.getTimestamp() < lastTimestamp)
            {
                logger.warning("Event codes are not in chronological order. " + lastTimestamp + " is followed by " + code.getTimestamp() + ".");
                // throw exception???
            }
            lastTimestamp = translatedTimestamp;
        }
    }

    /**
     * @return identifier
     */
    @Override
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_EVENT_TIMING_CODES;
    }

    /**
     * Setup object list.
     */
    @Override
    protected void setupObjectList()
    {
        objectList.add(new NumberHashMap(DataTypes.OBJ_TIME_STAMP_FORMAT, this, EventTimingTimestampTypes.TIMESTAMP_KEY_FIELD_SIZE));
        objectList.add(new EventTimingCodeList(this));
    }

    private static Set<Integer> toSet(final int... types)
    {
        final Set<Integer> typeSet = new HashSet<Integer>();
        for (final int type : types)
        {
            typeSet.add(type);
        }
        return typeSet;
    }


}
