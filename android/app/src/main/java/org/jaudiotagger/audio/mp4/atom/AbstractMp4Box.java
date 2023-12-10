package org.jaudiotagger.audio.mp4.atom;

import java.nio.ByteBuffer;

/**
 * Abstract mp4 box, contain a header and then rawdata (which may include child boxes)
 */
public class AbstractMp4Box
{
    protected Mp4BoxHeader header;
    protected ByteBuffer dataBuffer;

    /**
     * @return the box header
     */
    public Mp4BoxHeader getHeader()
    {
        return header;
    }

    /**
     * @return rawdata of this box
     */
    public ByteBuffer getData()
    {
        return dataBuffer;
    }


}
