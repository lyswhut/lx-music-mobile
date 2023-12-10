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
import org.jaudiotagger.tag.id3.valuepair.SynchronisedLyricsContentType;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;
import org.jaudiotagger.tag.reference.Languages;

import java.nio.ByteBuffer;

/**
 * Synchronised lyrics/text frame.
 *
 *
 * This is another way of incorporating the words, said or sung lyrics,
 * in the audio file as text, this time, however, in sync with the
 * audio. It might also be used to describing events e.g. occurring on a
 * stage or on the screen in sync with the audio. The header includes a
 * content descriptor, represented with as terminated textstring. If no
 * descriptor is entered, 'Content descriptor' is $00 (00) only.
 * <p><center><table border=0 width="70%">
 * <tr><td colspan=2>&lt;Header for 'Synchronised lyrics/text', ID: "SYLT"&gt;</td></tr>
 * <tr><td>Text encoding</td><td width="80%">$xx</td></tr>
 * <tr><td>Language</td><td>$xx xx xx</td></tr>
 * <tr><td>Time stamp format</td><td>$xx</td></tr>
 * <tr><td>Content type</td><td>$xx</td></tr>
 * <tr><td>Content descriptor</td><td>&lt;text string according to encoding&gt; $00 (00)</td></tr>
 * </table></center>
 * <p><center><table border=0 width="70%">
 * <tr><td rowspan=2 valign=top>Encoding:</td><td>$00</td><td>ISO-8859-1 character set is used => $00 is sync identifier.</td></tr>
 * <tr><td>$01</td><td>Unicode character set is used => $00 00 is sync identifier.</td></tr>
 * </table></center>
 * <p><center><table border=0 width="70%">
 * <tr><td rowspan=7 valign=top>Content type:</td><td>$00</td><td width="80%">is other</td></tr>
 * <tr><td>$01</td><td>is lyrics</td></tr>
 * <tr><td>$02</td><td>is text transcription</td></tr>
 * <tr><td>$03</td><td>is movement/part name (e.g. "Adagio")</td></tr>
 * <tr><td>$04</td><td>is events (e.g. "Don Quijote enters the stage")</td></tr>
 * <tr><td>$05</td><td>is chord (e.g. "Bb F Fsus")</td></tr>
 * <tr><td>$06</td><td>is trivia/'pop up' information</td></tr>
 * </table></center>
 *
 * Time stamp format is:
 * <p>
 * $01 Absolute time, 32 bit sized, using MPEG frames as unit<br>
 * $02 Absolute time, 32 bit sized, using milliseconds as unit
 * <p>
 * Abolute time means that every stamp contains the time from the
 * beginning of the file.
 * <p>
 * The text that follows the frame header differs from that of the
 * unsynchronised lyrics/text transcription in one major way. Each
 * syllable (or whatever size of text is considered to be convenient by
 * the encoder) is a null terminated string followed by a time stamp
 * denoting where in the sound file it belongs. Each sync thus has the
 * following structure:
 * <p><table border=0 width="70%">
 * <tr><td colspan=2>Terminated text to be synced (typically a syllable)</td></tr>
 * <tr><td nowrap>Sync identifier (terminator to above string)</td><td width="80%">$00 (00)</td></tr>
 * <tr><td>Time stamp</td><td>$xx (xx ...)</td></tr>
 * </table>
 *
 * The 'time stamp' is set to zero or the whole sync is omitted if
 * located directly at the beginning of the sound. All time stamps
 * should be sorted in chronological order. The sync can be considered
 * as a validator of the subsequent string.
 * <p>
 * Newline ($0A) characters are allowed in all "SYLT" frames and should
 * be used after every entry (name, event etc.) in a frame with the
 * content type $03 - $04.
 * <p>
 * A few considerations regarding whitespace characters: Whitespace
 * separating words should mark the beginning of a new word, thus
 * occurring in front of the first syllable of a new word. This is also
 * valid for new line characters. A syllable followed by a comma should
 * not be broken apart with a sync (both the syllable and the comma
 * should be before the sync).
 * <p>
 * An example: The "USLT" passage
 * <p>
 * "Strangers in the night" $0A "Exchanging glances"
 * <p>would be "SYLT" encoded as:
 * <p>
 * "Strang" $00 xx xx "ers" $00 xx xx " in" $00 xx xx " the" $00 xx xx
 * " night" $00 xx xx 0A "Ex" $00 xx xx "chang" $00 xx xx "ing" $00 xx
 * xx "glan" $00 xx xx "ces" $00 xx xx
 * <p>There may be more than one "SYLT" frame in each tag, but only one
 * with the same language and content descriptor.
 *
 * <p>For more details, please refer to the ID3 specifications:
 * <ul>
 * <li><a href="http://www.id3.org/id3v2.3.0.txt">ID3 v2.3.0 Spec</a>
 * </ul>
 *
 * @author : Paul Taylor
 * @author : Eric Farng
 * @version $Id$
 */
public class FrameBodySYLT extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{
    /**
     * Creates a new FrameBodySYLT datatype.
     */
    public FrameBodySYLT()
    {

    }

    /**
     * Copy Constructor
     *
     * @param body
     */
    public FrameBodySYLT(FrameBodySYLT body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodySYLT datatype.
     *
     * @param textEncoding
     * @param language
     * @param timeStampFormat
     * @param contentType
     * @param description
     * @param lyrics
     */
    public FrameBodySYLT(int textEncoding, String language, int timeStampFormat, int contentType, String description, byte[] lyrics)
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        setObjectValue(DataTypes.OBJ_LANGUAGE, language);
        setObjectValue(DataTypes.OBJ_TIME_STAMP_FORMAT, timeStampFormat);
        setObjectValue(DataTypes.OBJ_CONTENT_TYPE, contentType);
        setObjectValue(DataTypes.OBJ_DESCRIPTION, description);
        setObjectValue(DataTypes.OBJ_DATA, lyrics);
    }

    /**
     * Creates a new FrameBodySYLT datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodySYLT(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * @return language code
     */
    public String getLanguage()
    {
        return (String) getObjectValue(DataTypes.OBJ_LANGUAGE);
    }

    /**
     * @return timestamp format key
     */
    public int getTimeStampFormat()
    {
        return ((Number) getObjectValue(DataTypes.OBJ_TIME_STAMP_FORMAT)).intValue();
    }

    /**
     * @return content type key
     */
    public int getContentType()
    {
        return ((Number) getObjectValue(DataTypes.OBJ_CONTENT_TYPE)).intValue();
    }

    /**
     * @return description
     */
    public String getDescription()
    {
        return (String) getObjectValue(DataTypes.OBJ_DESCRIPTION);
    }

    /**
     * @return frame identifier
     */
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_SYNC_LYRIC;
    }


    /**
     * Set lyrics
     *
     * TODO:provide a more user friendly way of adding lyrics
     *
     * @param data
     */
    public void setLyrics(byte[] data)
    {
        this.setObjectValue(DataTypes.OBJ_DATA, data);
    }

    /**
     * Get lyrics
     *
     * TODO:better format
     *
     * @return lyrics
     */
    public byte[] getLyrics()
    {
        return (byte[]) this.getObjectValue(DataTypes.OBJ_DATA);
    }

    /**
     * Setup Object List
     */
    protected void setupObjectList()
    {
        objectList.add(new NumberHashMap(DataTypes.OBJ_TEXT_ENCODING, this, TextEncoding.TEXT_ENCODING_FIELD_SIZE));
        objectList.add(new StringHashMap(DataTypes.OBJ_LANGUAGE, this, Languages.LANGUAGE_FIELD_SIZE));
        objectList.add(new NumberHashMap(DataTypes.OBJ_TIME_STAMP_FORMAT, this, EventTimingTimestampTypes.TIMESTAMP_KEY_FIELD_SIZE));
        objectList.add(new NumberHashMap(DataTypes.OBJ_CONTENT_TYPE, this, SynchronisedLyricsContentType.CONTENT_KEY_FIELD_SIZE));
        objectList.add(new StringNullTerminated(DataTypes.OBJ_DESCRIPTION, this));

        //TODO:This hold the actual lyrics
        objectList.add(new ByteArraySizeTerminated(DataTypes.OBJ_DATA, this));
    }
}
