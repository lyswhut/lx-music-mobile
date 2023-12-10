/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Rapha�l Slinckx <raphael@slinckx.net>
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
package org.jaudiotagger.audio.wav.chunk;

import org.jaudiotagger.audio.generic.GenericAudioHeader;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.iff.Chunk;
import org.jaudiotagger.audio.iff.ChunkHeader;
import org.jaudiotagger.audio.wav.WavSubFormat;
import org.jaudiotagger.logging.Hex;

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * Reads the fmt header, this contains the information required for constructing Audio header
 *
 * 0 - 1   ushort SubFormatIdentifier;
 * 2 - 3   ushort NoOfChannels;
 * 4 - 7   uint   NoOfSamplesPerSec;
 * 8 - 11  uint   AverageNoBytesPerSec;
 * 12 - 13 ushort BlockAlign;
 * 14 - 15 ushort NoofBitsPerSample;
 * //May be additional fields here, depending upon wFormatTag.
 * } FormatChunk
*/
public class WavFormatChunk extends Chunk
{
    private static final int   STANDARD_DATA_SIZE = 18;
    private static final int   EXTENSIBLE_DATA_SIZE = 22;
    private static final int   EXTENSIBLE_DATA_SIZE_WE_NEED = 10;

    private static final String WAV_RIFF_ENCODING_PREPEND = "WAV-RIFF ";


    private boolean isValid = false;

    private int blockAlign,  channelMask;
    private WavSubFormat wsf;
    private GenericAudioHeader info;

    public WavFormatChunk(ByteBuffer chunkData, ChunkHeader hdr, GenericAudioHeader info) throws IOException
    {
        super(chunkData, hdr);
        this.info=info;
    }

    public boolean readChunk() throws IOException
    {
        int subFormatCode = Utils.u(chunkData.getShort());
        wsf = WavSubFormat.getByCode(subFormatCode);
        info.setChannelNumber(Utils.u(chunkData.getShort()));
        info.setSamplingRate(chunkData.getInt());
        info.setByteRate(chunkData.getInt());
        info.setBitRate( info.getByteRate() * Utils.BITS_IN_BYTE_MULTIPLIER / Utils.KILOBYTE_MULTIPLIER); //AvgBytePerSec  converted to kb/sec
        info.setVariableBitRate(false);
        blockAlign      = Utils.u(chunkData.getShort());
        info.setBitsPerSample(Utils.u(chunkData.getShort()));
        if (wsf!=null && wsf == WavSubFormat.FORMAT_EXTENSIBLE)
        {
            int extensibleSize = Utils.u(chunkData.getShort());
            if(extensibleSize == EXTENSIBLE_DATA_SIZE)
            {
                info.setBitsPerSample(Utils.u(chunkData.getShort()));
                //We dont use this currently
                channelMask = chunkData.getInt();

                //If Extensible then the actual formatCode is held here
                wsf = WavSubFormat.getByCode(Utils.u(chunkData.getShort()));
            }
        }
        if(wsf!=null)
        {
            if(info.getBitsPerSample()>0)
            {
                info.setEncodingType(wsf.getDescription() + " " + info.getBitsPerSample() + " bits");
            }
            else
            {
                info.setEncodingType(wsf.getDescription());
            }
        }
        else
        {
            info.setEncodingType("Unknown Sub Format Code:"+ Hex.asHex(subFormatCode));
        }
        return true;
    }


    public String toString()
    {
        String out = "RIFF-WAVE Header:\n";
        out += "Is valid?: " + isValid;
        return out;
    }
}
