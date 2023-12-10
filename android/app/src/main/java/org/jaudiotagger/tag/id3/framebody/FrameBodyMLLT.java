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

import org.jaudiotagger.tag.datatype.ByteArraySizeTerminated;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.id3.ID3v24Frames;

/**
 * MPEG location lookup table frame.
 *
 *
 * To increase performance and accuracy of jumps within a MPEG
 * audio file, frames with timecodes in different locations in the file
 * might be useful. The ID3v2 frame includes references that the
 * software can use to calculate positions in the file. After the frame
 * header is a descriptor of how much the 'frame counter' should
 * increase for every reference. If this value is two then the first
 * reference points out the second frame, the 2nd reference the 4th
 * frame, the 3rd reference the 6th frame etc. In a similar way the
 * 'bytes between reference' and 'milliseconds between reference' points
 * out bytes and milliseconds respectively.
 * <p>
 * Each reference consists of two parts; a certain number of bits, as
 * defined in 'bits for bytes deviation', that describes the difference
 * between what is said in 'bytes between reference' and the reality and
 * a certain number of bits, as defined in 'bits for milliseconds
 * deviation', that describes the difference between what is said in
 * 'milliseconds between reference' and the reality. The number of bits
 * in every reference, i.e. 'bits for bytes deviation'+'bits for
 * milliseconds deviation', must be a multiple of four. There may only
 * be one "MLLT" frame in each tag.
 * <p><table border=0 width="70%">
 * <tr><td colspan=2> &lt;Header for 'Location lookup table', ID: "MLLT"&gt;</td></tr>
 * <tr><td nowrap>MPEG frames between reference</td><td width="80%">$xx xx</td></tr>
 * <tr><td>Bytes between reference</td><td>$xx xx xx</td></tr>
 * <tr><td>Milliseconds between reference</td><td>$xx xx xx</td></tr>
 * <tr><td>Bits for bytes deviation</td><td>$xx</td></tr>
 * <tr><td>Bits for milliseconds dev.</td><td>$xx</td></tr>
 * </table><p>
 * Then for every reference the following data is included;
 * <p><table border=0 width="70%">
 * <tr><td>Deviation in bytes</td><td width="80%">%xxx....</td></tr>
 * <tr><td>Deviation in milliseconds</td><td>%xxx....</td></tr>
 * </table>
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
public class FrameBodyMLLT extends AbstractID3v2FrameBody implements ID3v24FrameBody, ID3v23FrameBody
{
    /**
     * Creates a new FrameBodyMLLT datatype.
     */
    public FrameBodyMLLT()
    {
    }

    public FrameBodyMLLT(FrameBodyMLLT body)
    {
        super(body);
    }

    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_MPEG_LOCATION_LOOKUP_TABLE;
    }


    /**
     * TODO:proper mapping
     */
    protected void setupObjectList()
    {
        objectList.add(new ByteArraySizeTerminated(DataTypes.OBJ_DATA, this));
    }

}