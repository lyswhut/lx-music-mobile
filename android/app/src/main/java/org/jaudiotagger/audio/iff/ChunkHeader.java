package org.jaudiotagger.audio.iff;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.generic.Utils;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;

/**
 * Each {@link Chunk} starts with a chunk header consisting of a 4 byte id and then a 4 byte size field, the size field
 * stores the size of the chunk itself excluding the size of the header.
 */
public class ChunkHeader
{
    public static final int  CHUNK_HEADER_SIZE = 8;

    private long        size;              // This does not include the 8 bytes of header itself
    private String      chunkId;           // Four character Id of the chunk
    private ByteOrder   byteOrder;
    private long        startLocationInFile;


    public ChunkHeader(ByteOrder byteOrder)
    {
        this.byteOrder=byteOrder;
    }
    /**
     * Reads the header of a chunk.
     *
     * @return {@code true}, if we were able to read a chunk header and believe we found a valid chunk id.
     */
    public boolean readHeader(final FileChannel fc) throws IOException
    {
        ByteBuffer header = ByteBuffer.allocate(CHUNK_HEADER_SIZE);
        startLocationInFile = fc.position();
        fc.read(header);
        header.order(byteOrder);
        header.position(0);
        this.chunkId  = Utils.readFourBytesAsChars(header);
        this.size = header.getInt();

        return true;
    }

    /**
     * Reads the header of a chunk.
     *
     * @return {@code true}, if we were able to read a chunk header and believe we found a valid chunk id.
     */
    public boolean readHeader(final RandomAccessFile raf) throws IOException
    {
        ByteBuffer header = ByteBuffer.allocate(CHUNK_HEADER_SIZE);
        startLocationInFile = raf.getFilePointer();
        raf.getChannel().read(header);
        header.order(byteOrder);
        header.position(0);
        this.chunkId  = Utils.readFourBytesAsChars(header);
        this.size = header.getInt();

        return true;
    }

    /**
     * Writes this chunk header to a {@link ByteBuffer}.
     *
     * @return the byte buffer containing the
     */
    public ByteBuffer writeHeader()
    {
        final ByteBuffer bb = ByteBuffer.allocate(CHUNK_HEADER_SIZE);
        bb.order(byteOrder);
        bb.put(chunkId.getBytes(StandardCharsets.US_ASCII));
        bb.putInt((int)size);
        bb.flip();
        return bb;
    }

    /**
     * Sets the chunk type, which is a 4-character code, directly.
     *
     * @param id 4-char id
     */
    public void setID(final String id)
    {
        this.chunkId = id;
    }

    /**
     * Returns the chunk type, which is a 4-character code.
     *
     * @return id
     */
    public String getID()
    {
        return this.chunkId;
    }

    /**
     * Returns the chunk size (excluding the first 8 bytes).
     *
     * @see #setSize(long)
     */
    public long getSize()
    {
        return size;
    }

    /**
     * Set chunk size.
     *
     * @param size chunk size without header
     * @see #getSize()
     */
    public void setSize(final long size)
    {
        this.size=size;
    }

    /** The start of this chunk(header) in the file */
    public long getStartLocationInFile()
    {
        return startLocationInFile;
    }

    public String toString()
    {
        return getID() +":Size:" + getSize() +"startLocation:"+getStartLocationInFile();
    }
}
