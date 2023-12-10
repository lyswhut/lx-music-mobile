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

import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.iff.Chunk;
import org.jaudiotagger.audio.iff.ChunkHeader;
import org.jaudiotagger.audio.wav.WavChunkType;
import org.jaudiotagger.tag.wav.WavTag;

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * Reads a list chunk, only interested in it if contains INFO chunk as this contains basic metadata
 */
public class WavListChunk extends Chunk
{

    private boolean isValid = false;

    private WavTag tag;
    private String loggingName;

    public WavListChunk(String loggingName, ByteBuffer chunkData, ChunkHeader chunkHeader, WavTag tag) throws IOException
    {
        super(chunkData, chunkHeader);
        this.tag=tag;
        this.loggingName = loggingName;
    }

    /**
     *
     * @return true if successfully read chunks
     *
     * @throws IOException
     */
    public boolean readChunk() throws IOException
    {
        boolean result = false;
        String subIdentifier = Utils.readFourBytesAsChars(chunkData);
        if(subIdentifier.equals(WavChunkType.INFO.getCode()))
        {
            WavInfoChunk chunk = new WavInfoChunk(tag, loggingName);
            result = chunk.readChunks(chunkData);
            //This is the start of the enclosing LIST element
            tag.getInfoTag().setStartLocationInFile(chunkHeader.getStartLocationInFile());
            tag.getInfoTag().setEndLocationInFile(chunkHeader.getStartLocationInFile() + ChunkHeader.CHUNK_HEADER_SIZE + chunkHeader.getSize());
            tag.setExistingInfoTag(true);
        }
        return result;
    }


    public String toString()
    {
        String out = "RIFF-WAVE Header:\n";
        out += "Is valid?: " + isValid;
        return out;
    }
}
