/**
 *  @author : Paul Taylor
 *  @author : Eric Farng
 *
 *  Version @version:$Id$
 *
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
import org.jaudiotagger.tag.id3.valuepair.StandardIPLSKey;

import java.nio.ByteBuffer;
import java.util.List;


/**
 * The 'Involved people list' is intended as a mapping between functions like producer and names. Every odd field is a
 * function and every even is an name or a comma delimited list of names.
 *
 */
public class FrameBodyTIPL extends AbstractFrameBodyPairs implements ID3v24FrameBody
{
    //Standard function names, code now uses StandardIPLSKey but kept for backwards compatability
    public static final String ENGINEER = StandardIPLSKey.ENGINEER.getKey();
    public static final String MIXER    = StandardIPLSKey.MIXER.getKey();
    public static final String DJMIXER  = StandardIPLSKey.DJMIXER.getKey();
    public static final String PRODUCER = StandardIPLSKey.PRODUCER.getKey();
    public static final String ARRANGER = StandardIPLSKey.ARRANGER.getKey();

    /**
     * Creates a new FrameBodyTIPL datatype.
     */
    public FrameBodyTIPL()
    {
        super();
    }

    /**
     * Creates a new FrameBodyTIPL data type.
     *
     * @param textEncoding
     * @param text
     */
    public FrameBodyTIPL(byte textEncoding, String text)
    {
        super(textEncoding, text);
    }

    /**
     * Creates a new FrameBodyTIPL data type.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodyTIPL(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * Convert from V3 to V4 Frame
     *
     * @param body
     */
    public FrameBodyTIPL(FrameBodyIPLS body)
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
    public FrameBodyTIPL(byte textEncoding, List<Pair> pairs)
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
        return ID3v24Frames.FRAME_ID_INVOLVED_PEOPLE;
    }

}
