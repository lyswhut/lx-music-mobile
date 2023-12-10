package org.jaudiotagger.audio.dsf;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.iff.IffHeaderChunk;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * DSD Chunk
 */
public class DsdChunk
{
    private long chunkSizeLength;
    private long fileLength;
    private long metadataOffset;

    public static final int CHUNKSIZE_LENGTH = 8;
    public static final int FILESIZE_LENGTH = 8;
    public static final int METADATA_OFFSET_LENGTH = 8;
    public static final int FMT_CHUNK_MIN_DATA_SIZE_ = 40;

    public static final int DSD_HEADER_LENGTH =  IffHeaderChunk.SIGNATURE_LENGTH + CHUNKSIZE_LENGTH + FILESIZE_LENGTH + METADATA_OFFSET_LENGTH;

    public static DsdChunk readChunk(ByteBuffer dataBuffer)
    {
        String type = Utils.readFourBytesAsChars(dataBuffer);
        if (DsfChunkType.DSD.getCode().equals(type))
        {
            return new DsdChunk(dataBuffer);
        }
        return null;
    }

    private DsdChunk(ByteBuffer dataBuffer)
    {
        chunkSizeLength = dataBuffer.getLong();
        fileLength      = dataBuffer.getLong();
        metadataOffset  = dataBuffer.getLong();
    }

    public String toString()
    {

        return "ChunkSize:"+chunkSizeLength
                + ":fileLength:"+fileLength
                + ":metadata:"+metadataOffset;

    }

    public long getChunkSizeLength()
    {
        return chunkSizeLength;
    }

    public void setChunkSizeLength(long chunkSizeLength)
    {
        this.chunkSizeLength = chunkSizeLength;
    }

    public long getFileLength()
    {
        return fileLength;
    }

    public void setFileLength(long fileLength)
    {
        this.fileLength = fileLength;
    }

    public long getMetadataOffset()
    {
        return metadataOffset;
    }

    public void setMetadataOffset(long metadataOffset)
    {
        this.metadataOffset = metadataOffset;
    }

    /**
     * Write new DSDchunk to buffer
     *
     * @return
     */
    public ByteBuffer write()
    {
        ByteBuffer buffer = ByteBuffer.allocateDirect(DSD_HEADER_LENGTH);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        buffer.put(DsfChunkType.DSD.getCode().getBytes(StandardCharsets.US_ASCII));
        buffer.putLong(chunkSizeLength);
        buffer.putLong(fileLength);
        buffer.putLong(metadataOffset);
        buffer.flip();
        return buffer;
    }
}
