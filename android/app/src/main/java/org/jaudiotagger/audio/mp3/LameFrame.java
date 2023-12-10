/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Raphaël Slinckx <raphael@slinckx.net>
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
package org.jaudiotagger.audio.mp3;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.generic.Utils;

import java.nio.ByteBuffer;

/**
 * The first frame can sometimes contain a LAME frame at the end of the Xing frame
 *
 * <p>This useful to the library because it allows the encoder to be identified, full specification
 * can be found at http://gabriel.mp3-tech.org/mp3infotag.html
 *
 * Summarized here:
 * 4 bytes:LAME
 * 5 bytes:LAME Encoder Version
 * 1 bytes:VNR Method
 * 1 bytes:Lowpass filter value
 * 8 bytes:Replay Gain
 * 1 byte:Encoding Flags
 * 1 byte:minimal byte rate
 * 3 bytes:extra samples
 * 1 byte:Stereo Mode
 * 1 byte:MP3 Gain
 * 2 bytes:Surround Dound
 * 4 bytes:MusicLength
 * 2 bytes:Music CRC
 * 2 bytes:CRC Tag
 */
public class LameFrame
{
    public static final int LAME_HEADER_BUFFER_SIZE = 36;
    public static final int ENCODER_SIZE = 9;   //Includes LAME ID
    public static final int LAME_ID_SIZE = 4;
    public static final String LAME_ID = "LAME";
    private String encoder;

    /**
     * Initilise a Lame Mpeg Frame
     * @param lameHeader
     */
    private LameFrame(ByteBuffer lameHeader)
    {
        encoder = Utils.getString(lameHeader, 0, ENCODER_SIZE, StandardCharsets.ISO_8859_1);
    }

    /**
     * Parse frame
     *
     * @param bb
     * @return frame or null if not exists
     */
    public static LameFrame parseLameFrame(ByteBuffer bb)
    {
        ByteBuffer lameHeader = bb.slice();
        String id = Utils.getString(lameHeader, 0, LAME_ID_SIZE, StandardCharsets.ISO_8859_1);
        lameHeader.rewind();
        if (id.equals(LAME_ID))
        {
            LameFrame lameFrame = new LameFrame(lameHeader);
            return lameFrame;
        }
        return null;
    }

    /**
     * @return encoder
     */
    public String getEncoder()
    {
        return encoder;
    }
}

