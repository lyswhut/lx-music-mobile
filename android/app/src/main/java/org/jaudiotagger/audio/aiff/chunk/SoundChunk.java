package org.jaudiotagger.audio.aiff.chunk;

import org.jaudiotagger.audio.iff.Chunk;
import org.jaudiotagger.audio.iff.ChunkHeader;

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * Sound chunk.
 * Doesn't actually read the content, but skips it.
 */
public class SoundChunk extends Chunk
{

    /**
     * @param chunkHeader  The header for this chunk
     * @param chunkData  The file from which the AIFF data are being read
     */
    public SoundChunk(final ChunkHeader chunkHeader, final ByteBuffer chunkData)
    {
        super(chunkData, chunkHeader);
    }

    /**
     * Reads a chunk and extracts information.
     *
     * @return <code>false</code> if the chunk is structurally
     * invalid, otherwise <code>true</code>
     */
    public boolean readChunk() throws IOException
    {
        return true;
    }

}
