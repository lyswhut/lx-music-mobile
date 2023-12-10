/*
 * Horizon Wimba Copyright (C)2006
 *
 * This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 * or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along with this library; if not,
 * you can get a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.datatype.NumberFixedLength;
import org.jaudiotagger.tag.datatype.StringNullTerminated;
import org.jaudiotagger.tag.id3.ID3v2ChapterFrames;

import java.nio.ByteBuffer;

/**
 * Chapter frame.
 *
 *
 * The purpose of this frame is to describe a single chapter within an
 * audio file. There may be more than one frame of this type in a tag
 * but each must have an Element ID that is unique with respect to any
 * other "CHAP" frame or "CTOC" frame in the tag.
 *
 * <table border="0" width="70%" align="center">
 * <tr><td nowrap="nowrap">&lt;ID3v2.3 or ID3v2.4 frame header, ID: "CHAP"&gt;</td><td rowspan="7">&nbsp;&nbsp;</td><td>(10 bytes)</td></tr>
 * <tr><td>Element ID</td><td width="70%">&lt;text string&gt; $00</td></tr>
 * <tr><td>Start time</td><td>$xx xx xx xx</td></tr>
 * <tr><td>End time</td><td>$xx xx xx xx</td></tr>
 * <tr><td>Start offset</td><td>$xx xx xx xx</td></tr>
 * <tr><td>End offset</td><td>$xx xx xx xx</td></tr>
 * <tr><td>&lt;Optional embedded sub-frames&gt;</td></tr>
 * </table>
 * <p>
 * The Element ID uniquely identifies the frame. It is not intended to
 * be human readable and should not be presented to the end user.
 * <p>
 * The Start and End times are a count in milliseconds from the
 * beginning of the file to the start and end of the chapter
 * respectively.
 * <p>
 * The Start offset is a zero-based count of bytes from the beginning
 * of the file to the first byte of the first audio frame in the
 * chapter. If these bytes are all set to 0xFF then the value should be
 * ignored and the start time value should be utilized.
 * <p>
 * The End offset is a zero-based count of bytes from the beginning of
 * the file to the first byte of the audio frame following the end of
 * the chapter. If these bytes are all set to 0xFF then the value should
 * be ignored and the end time value should be utilized.
 * <p>
 * There then follows a sequence of optional frames that are embedded
 * within the "CHAP" frame and which describe the content of the chapter
 * (e.g. a "TIT2" frame representing the chapter name) or provide
 * related material such as URLs and images. These sub-frames are
 * contained within the bounds of the "CHAP" frame as signalled by the
 * size field in the "CHAP" frame header. If a parser does not recognise
 * "CHAP" frames it can skip them using the size field in the frame
 * header. When it does this it will skip any embedded sub-frames
 * carried within the frame.
 *
 *
 * <p>For more details, please refer to the ID3 Chapter Frame specifications:
 * <ul>
 * <li><a href="http://www.id3.org/id3v2-chapters-1.0.txt">ID3 v2 Chapter Frame Spec</a>
 * </ul>
 *
 * @author Marc Gimpel, Horizon Wimba S.A.
 * @version $Id$
 */
public class FrameBodyCHAP extends AbstractID3v2FrameBody implements ID3v2ChapterFrameBody
{
    /**
     * Creates a new FrameBodyCHAP datatype.
     */
    public FrameBodyCHAP()
    {
    }

    /**
     * Creates a new FrameBodyCHAP datatype.
     *
     * @param body
     */
    public FrameBodyCHAP(FrameBodyCHAP body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyCHAP datatype.
     *
     * @param elementId
     * @param startTime
     * @param endTime
     * @param startOffset
     * @param endOffset
     */
    public FrameBodyCHAP(String elementId, int startTime, int endTime, int startOffset, int endOffset)
    {
        this.setObjectValue(DataTypes.OBJ_ELEMENT_ID, elementId);
        this.setObjectValue(DataTypes.OBJ_START_TIME, startTime);
        this.setObjectValue(DataTypes.OBJ_END_TIME, endTime);
        this.setObjectValue(DataTypes.OBJ_START_OFFSET, startOffset);
        this.setObjectValue(DataTypes.OBJ_END_OFFSET, endOffset);
    }

    /**
     * Creates a new FrameBodyAENC datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyCHAP(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public String getIdentifier()
    {
        return ID3v2ChapterFrames.FRAME_ID_CHAPTER;
    }

    /**
     *
     */
    protected void setupObjectList()
    {
        objectList.add(new StringNullTerminated(DataTypes.OBJ_ELEMENT_ID, this));
        objectList.add(new NumberFixedLength(DataTypes.OBJ_START_TIME, this, 4));
        objectList.add(new NumberFixedLength(DataTypes.OBJ_END_TIME, this, 4));
        objectList.add(new NumberFixedLength(DataTypes.OBJ_START_OFFSET, this, 4));
        objectList.add(new NumberFixedLength(DataTypes.OBJ_END_OFFSET, this, 4));
    }
}
