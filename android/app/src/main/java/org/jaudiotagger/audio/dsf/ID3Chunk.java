package org.jaudiotagger.audio.dsf;

import org.jaudiotagger.audio.generic.Utils;

import java.nio.ByteBuffer;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by Paul on 28/01/2016.
 */
public class ID3Chunk
{
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.generic.ID3Chunk");

    private ByteBuffer dataBuffer;
    public static ID3Chunk readChunk(ByteBuffer dataBuffer)
    {
        String type = Utils.readThreeBytesAsChars(dataBuffer);
        if (DsfChunkType.ID3.getCode().equals(type))
        {
            return new ID3Chunk(dataBuffer);
        }
        logger.log(Level.WARNING,"Invalid type:"+type+" where expected ID3 tag");
        return null;
    }

    public ID3Chunk(ByteBuffer dataBuffer)
    {
        this.dataBuffer = dataBuffer;
    }

    public ByteBuffer getDataBuffer()
    {
        return dataBuffer;
    }
}
