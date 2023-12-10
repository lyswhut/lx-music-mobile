/**
 *  @author : Paul Taylor
 *
 *  Version @version:$Id$
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
 *
 * Description:
 * People List
 *
 */
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.datatype.Pair;
import org.jaudiotagger.tag.datatype.PairedTextEncodedStringNullTerminated;
import org.jaudiotagger.tag.id3.ID3v24Frames;

import java.nio.ByteBuffer;
import java.util.List;


/**
 * The 'Musician credits list' is intended as a mapping between instruments and the musician that played it. Every odd field is an
 * instrument and every even is an artist or a comma delimited list of artists.
 *
 */
public class FrameBodyTMCL extends AbstractFrameBodyPairs implements ID3v24FrameBody
{
    /**
     * Creates a new FrameBodyTMCL datatype.
     */
    public FrameBodyTMCL()
    {
        super();
    }

    /**
     * Creates a new FrameBodyTMCL data type.
     *
     * @param textEncoding
     * @param text
     */
    public FrameBodyTMCL(byte textEncoding, String text)
    {
        super(textEncoding, text);
    }

    /**
     * Creates a new FrameBodyTMCL data type.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodyTMCL(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * Convert from V3 to V4 Frame
     *
     * @param body
     */
    public FrameBodyTMCL(FrameBodyIPLS body)
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, body.getTextEncoding());
        setObjectValue(DataTypes.OBJ_TEXT, body.getPairing());
    }

    /**
     * Construct from a set of pairs
     *
     * @param textEncoding
     * @param pairs
     */
    public FrameBodyTMCL(byte textEncoding, List<Pair> pairs)
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
        PairedTextEncodedStringNullTerminated.ValuePairs values = new PairedTextEncodedStringNullTerminated.ValuePairs();
        for(Pair next:pairs)
        {
            values.add(next);
        }
        setObjectValue(DataTypes.OBJ_TEXT, values);
    }

    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_MUSICIAN_CREDITS;
    }

}

