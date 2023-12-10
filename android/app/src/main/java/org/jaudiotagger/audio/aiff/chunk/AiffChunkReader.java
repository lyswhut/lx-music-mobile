package org.jaudiotagger.audio.aiff.chunk;

import org.jaudiotagger.audio.iff.ChunkHeader;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;

/**
 * Abstract class For reading Aiff Chunks used by both Audio and Tag Reader
 */
public abstract class AiffChunkReader
{
    /**
     * Read the next chunk into ByteBuffer as specified by ChunkHeader and moves raf file pointer
     * to start of next chunk/end of file.
     *
     * @param fc
     * @param chunkHeader
     * @return
     * @throws IOException
     */
    protected ByteBuffer readChunkDataIntoBuffer(FileChannel fc, final ChunkHeader chunkHeader) throws IOException
    {
        final ByteBuffer chunkData = ByteBuffer.allocateDirect((int)chunkHeader.getSize());
        chunkData.order(ByteOrder.BIG_ENDIAN);
        fc.read(chunkData);
        chunkData.position(0);
        return chunkData;
    }

}
