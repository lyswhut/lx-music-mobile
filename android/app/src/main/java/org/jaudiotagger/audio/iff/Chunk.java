package org.jaudiotagger.audio.iff;

import java.io.IOException;
import java.nio.ByteBuffer;


/**
 * Abstract superclass for IFF/AIFF chunks.
 *
 * @author Gary McGath
 */
public abstract class Chunk
{
    protected ByteBuffer chunkData;
    protected ChunkHeader chunkHeader;



    /**
     * Constructor used by Wav
     *
     * @param chunkData
     * @param chunkHeader
     */
    public Chunk(ByteBuffer chunkData, ChunkHeader chunkHeader)
    {
        this.chunkData   = chunkData;
        this.chunkHeader = chunkHeader;
    }

    /**
     * Reads a chunk and puts appropriate information into
     * the RepInfo object.
     *
     * @return <code>false</code> if the chunk is structurally
     * invalid, otherwise <code>true</code>
     */
    public abstract boolean readChunk() throws IOException;
}
