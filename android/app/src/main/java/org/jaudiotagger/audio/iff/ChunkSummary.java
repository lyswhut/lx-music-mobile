package org.jaudiotagger.audio.iff;

import org.jaudiotagger.logging.Hex;

/**
 * Created by Paul on 22/01/2016.
 */
public class ChunkSummary
{
    private String chunkId;
    private long    fileStartLocation;
    private long chunkSize;

    public ChunkSummary(String chunkId, long fileStartLocation, long chunkSize)
    {
        this.chunkId=chunkId;
        this.fileStartLocation=fileStartLocation;
        this.chunkSize=chunkSize;
    }

    @Override
    public String toString()
    {
        long endLocation = fileStartLocation + chunkSize + ChunkHeader.CHUNK_HEADER_SIZE;
        return chunkId+":StartLocation:"
                + Hex.asDecAndHex(fileStartLocation)
                + ":SizeIncHeader:"
                + chunkSize + ChunkHeader.CHUNK_HEADER_SIZE
                + ":EndLocation:"
                + Hex.asDecAndHex(endLocation);
    }

    public long getEndLocation()
    {
        return fileStartLocation + chunkSize + ChunkHeader.CHUNK_HEADER_SIZE;
    }
    public String getChunkId()
    {
        return chunkId;
    }

    public void setChunkId(String chunkId)
    {
        this.chunkId = chunkId;
    }

    public long getFileStartLocation()
    {
        return fileStartLocation;
    }

    public void setFileStartLocation(long fileStartLocation)
    {
        this.fileStartLocation = fileStartLocation;
    }

    public long getChunkSize()
    {
        return chunkSize;
    }

    public void setChunkSize(long chunkSize)
    {
        this.chunkSize = chunkSize;
    }


}
