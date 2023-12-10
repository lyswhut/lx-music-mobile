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
import org.jaudiotagger.tag.datatype.ByteArraySizeTerminated;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.id3.ID3v2ChapterFrames;

import java.nio.ByteBuffer;

/**
 * Table of content frame.
 *
 *
 * The purpose of "CTOC" frames is to allow a table of contents to be
 * defined. In the simplest case, a single "CTOC" frame can be used to
 * provide a flat (single-level) table of contents. However, multiple
 * "CTOC" frames can also be used to define a hierarchical (multi-level)
 * table of contents.
 * <p>
 * There may be more than one frame of this type in a tag but each must
 * have an Element ID that is unique with respect to any other "CTOC" or
 * "CHAP" frame in the tag.
 * <p>
 * Each "CTOC" frame represents one level or element of a table of contents
 * by providing a list of Child Element IDs. These match the Element IDs of
 * other "CHAP" and "CTOC" frames in the tag.
 *
 * <table border="0" width="70%" align="center">
 * <tr><td nowrap="nowrap">&lt;ID3v2.3 or ID3v2.4 frame header, ID: "CTOC"&gt;</td><td rowspan="7">&nbsp;&nbsp;</td><td>(10 bytes)</td></tr>
 * <tr><td>Element ID</td><td width="70%">&lt;text string&gt; $00</td></tr>
 * <tr><td>Flags</td><td>%000000ab</td></tr>
 * <tr><td>Entry count</td><td>$xx&nbsp;&nbsp;(8-bit unsigned int)</td></tr>
 * <tr><td>&lt;Child Element ID list&gt;</td></tr>
 * <tr><td>&lt;Optional embedded sub-frames&gt;</td></tr>
 * </table>
 *
 * The Element ID uniquely identifies the frame. It is not intended to
 * be human readable and should not be presented to the end-user.
 * <p>
 * Flag a - Top-level bit<br>
 * This is set to 1 to identify the top-level "CTOC" frame. This frame
 * is the root of the Table of Contents tree and is not a child of any
 * other "CTOC" frame. Only one "CTOC" frame in an ID3v2 tag can have
 * this bit set to 1. In all other "CTOC" frames this bit shall be set
 * to 0.
 * <p>
 * Flag b - Ordered bit<br>
 * This should be set to 1 if the entries in the Child Element ID list
 * are ordered or set to 0 if they not are ordered. This provides a hint
 * as to whether the elements should be played as a continuous ordered
 * sequence or played individually.
 * <p>
 * The Entry count is the number of entries in the Child Element ID list
 * that follows and must be greater than zero. Each entry in the list
 * consists of:
 *
 * <table border="0" width="70%" align="center">
 * <tr><td nowrap="nowrap">Child Element ID</td><td>&nbsp;&nbsp;</td><td width="70%">&lt;text string&gt; $00</td></tr>
 * </table>
 *
 * The last entry in the child Element ID list is followed by a sequence
 * of optional frames that are embedded within the "CTOC" frame and which
 * describe this element of the table of contents (e.g. a "TIT2" frame
 * representing the name of the element) or provide related material such
 * as URLs and images. These sub-frames are contained within the bounds
 * of the "CTOC" frame as signalled by the size field in the "CTOC"
 * frame header.
 * <p>
 * If a parser does not recognise "CTOC" frames it can skip them using
 * the size field in the frame header. When it does this it will skip
 * any embedded sub-frames carried within the frame.
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
public class FrameBodyCTOC extends AbstractID3v2FrameBody implements ID3v2ChapterFrameBody
{
    /**
     * Creates a new FrameBodyCTOC datatype.
     */
    public FrameBodyCTOC()
    {
    }

    /**
     * Creates a new FrameBodyCTOC datatype.
     *
     * @param body
     */
    public FrameBodyCTOC(FrameBodyCTOC body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyCTOC datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyCTOC(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
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
        return ID3v2ChapterFrames.FRAME_ID_TABLE_OF_CONTENT;
    }

    /**
     * TODO:proper mapping
     */
    protected void setupObjectList()
    {
        objectList.add(new ByteArraySizeTerminated(DataTypes.OBJ_DATA, this));
    }
}
