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

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * Reads the fact header, this contains the information required for constructing Audio header
 *
 * 0 - 3   uint   totalNoSamples (Per channel ?)
*/
public class WavFactChunk extends Chunk
{
    private boolean isValid = false;

    private GenericAudioHeader info;

    public WavFactChunk(ByteBuffer chunkData, ChunkHeader hdr, GenericAudioHeader info) throws IOException
    {
        super(chunkData, hdr);
        this.info=info;
    }

    public boolean readChunk() throws IOException
    {
        info.setNoOfSamples(Utils.u(chunkData.getInt()));
        return true;
    }


    public String toString()
    {
        String out = "Fact Chunk:\n";
        out += "Is valid?: " + isValid;
        return out;
    }
}
