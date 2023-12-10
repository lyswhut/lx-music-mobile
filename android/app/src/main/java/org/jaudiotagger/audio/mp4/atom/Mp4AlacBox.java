package org.jaudiotagger.audio.mp4.atom;

import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.generic.Utils;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * AlacBox ( Apple Lossless Codec information description box),
 *
 * Normally occurs twice, the first ALAC contains the default  values, the second ALAC within contains the real
 * values for this audio.
 */
public class Mp4AlacBox extends AbstractMp4Box
{
    public static final int OTHER_FLAG_LENGTH = 4;

    private int maxSamplePerFrame; // 32bit
    private int unknown1; // 8bit
    private int sampleSize; // 8bit
    private int historyMult; // 8bit
    private int initialHistory; // 8bit
    private int kModifier; // 8bit
    private int channels; // 8bit
    private int unknown2; // 16bit
    private int maxCodedFrameSize; // 32bit
    private int bitRate; // 32bit
    private int sampleRate; // 32bit


    /**
     * DataBuffer must start from from the start of the body
     *
     * @param header     header info
     * @param dataBuffer data of box (doesnt include header data)
     */
    public Mp4AlacBox(Mp4BoxHeader header, ByteBuffer dataBuffer)
    {
        this.header     = header;
        this.dataBuffer = dataBuffer;
    }

    public void processData() throws CannotReadException
    {
        //Skip version/other flags
        dataBuffer.position(dataBuffer.position() + OTHER_FLAG_LENGTH);
        dataBuffer.order(ByteOrder.BIG_ENDIAN);

        maxSamplePerFrame   = dataBuffer.getInt();
        unknown1            = Utils.u(dataBuffer.get());
        sampleSize          = Utils.u(dataBuffer.get());
        historyMult         = Utils.u(dataBuffer.get());
        initialHistory      = Utils.u(dataBuffer.get());
        kModifier           = Utils.u(dataBuffer.get());
        channels            = Utils.u(dataBuffer.get());
        unknown2            = dataBuffer.getShort();
        maxCodedFrameSize   = dataBuffer.getInt();
        bitRate             = dataBuffer.getInt();
        sampleRate          = dataBuffer.getInt();
    }

    public int getMaxSamplePerFrame()
    {
        return maxSamplePerFrame;
    }

    public int getUnknown1()
    {
        return unknown1;
    }

    public int getSampleSize()
    {
        return sampleSize;
    }

    public int getHistoryMult()
    {
        return historyMult;
    }

    public int getInitialHistory()
    {
        return initialHistory;
    }

    public int getKModifier()
    {
        return kModifier;
    }

    public int getChannels()
    {
        return channels;
    }

    public int getUnknown2()
    {
        return unknown2;
    }

    public int getMaxCodedFrameSize()
    {
        return maxCodedFrameSize;
    }

    public int getBitRate()
    {
        return bitRate;
    }

    public int getSampleRate()
    {
        return sampleRate;
    }

    public String toString()
    {
        String s = "maxSamplePerFrame:" + maxSamplePerFrame
                    + "unknown1:"+ unknown1
                    + "sampleSize:"+sampleSize
                    + "historyMult:"+historyMult
                    + "initialHistory:"+initialHistory
                    + "kModifier:"+kModifier
                    + "channels:"+channels
                    + "unknown2 :"+unknown2
                    + "maxCodedFrameSize:"+maxCodedFrameSize
                    + "bitRate:"+bitRate
                    + "sampleRate:"+sampleRate;
        return s;
    }
}
