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
import org.jaudiotagger.tag.id3.ID3v23Frames;

/**
 * Equalisation frame.
 *
 *
 * This is another subjective, alignment frame. It allows the user to
 * predefine an equalisation curve within the audio file. There may only
 * be one "EQUA" frame in each tag.
 * <p><table border=0 width="70%">
 * <tr><td colspan=2>&lt;Header of 'Equalisation', ID: "EQUA"&gt;</td></tr>
 * <tr><td>Adjustment bits</td><td width="80%">$xx</td></tr>
 * </table><p>
 * The 'adjustment bits' field defines the number of bits used for
 * representation of the adjustment. This is normally $10 (16 bits) for
 * MPEG 2 layer I, II and III and MPEG 2.5. This value may not be
 * $00.
 * <p>
 * This is followed by 2 bytes + ('adjustment bits' rounded up to the
 * nearest byte) for every equalisation band in the following format,
 * giving a frequency range of 0 - 32767Hz:
 * <p><table border=0 width="70%">
 * <tr><td>Increment/decrement</td><td width="80%">%x (MSB of the Frequency)</td></tr>
 * <tr><td>Frequency </td><td>(lower 15 bits)</td></tr>
 * <tr><td>Adjustment</td><td>$xx (xx ...)</td></tr>
 * </table><p>
 * The increment/decrement bit is 1 for increment and 0 for decrement.
 * The equalisation bands should be ordered increasingly with reference
 * to frequency. All frequencies don't have to be declared. The
 * equalisation curve in the reading software should be interpolated
 * between the values in this frame. Three equal adjustments for three
 * subsequent frequencies. A frequency should only be described once in
 * the frame.
 *
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
public class FrameBodyEQUA extends AbstractID3v2FrameBody implements ID3v23FrameBody
{
    /**
     * Creates a new FrameBodyEQUA dataType.
     */
    public FrameBodyEQUA()
    {
    }

    public FrameBodyEQUA(FrameBodyEQUA body)
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
        return ID3v23Frames.FRAME_ID_V3_EQUALISATION;
    }

    /**
     * TODO:proper mapping
     */
    protected void setupObjectList()
    {
        objectList.add(new ByteArraySizeTerminated(DataTypes.OBJ_DATA, this));
    }
}