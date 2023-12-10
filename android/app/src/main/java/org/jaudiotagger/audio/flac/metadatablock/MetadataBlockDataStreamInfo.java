/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Raphaël Slinckx <raphael@slinckx.net>
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
package org.jaudiotagger.audio.flac.metadatablock;

import org.jaudiotagger.audio.generic.Utils;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.util.logging.Logger;

/**
 * Stream Info
 *
 * This block has information about the whole stream, like sample rate, number of channels, total number of samples,
 * etc. It must be present as the first metadata block in the stream. Other metadata blocks may follow, and ones
 * that the decoder doesn't understand, it will skip.
 * Format:
 * Size in bits Info
 * 16 The minimum block size (in samples) used in the stream.
 * 16 The maximum block size (in samples) used in the stream. (Minimum blocksize == maximum blocksize) implies a fixed-blocksize stream.
 * 24 The minimum frame size (in bytes) used in the stream. May be 0 to imply the value is not known.
 * 24 The maximum frame size (in bytes) used in the stream. May be 0 to imply the value is not known.
 * 20 Sample rate in Hz. Though 20 bits are available, the maximum sample rate is limited by the structure of frame headers to 655350Hz. Also,
 * a value of 0 is invalid.
 * 3 	(number of channels)-1. FLAC supports from 1 to 8 channels
 * 5 	(bits per sample)-1. FLAC supports from 4 to 32 bits per sample. Currently the reference encoder and decoders only support up to 24 bits per sample.
 * 36 	Total samples in stream. 'Samples' means inter-channel sample,
 * i.e. one second of 44.1Khz audio will have 44100 samples regardless of the number of channels.
 * A value of zero here means the number of total samples is unknown.
 * 128 	MD5 signature of the unencoded audio data. This allows the decoder to determine if an error exists in the audio data
 * even when the error does not result in an invalid bitstream.
 * NOTES
 * * FLAC specifies a minimum block size of 16 and a maximum block size of 65535, meaning the bit patterns corresponding to the numbers 0-15 in the minimum blocksize and maximum blocksize fields are invalid.
 */
public class MetadataBlockDataStreamInfo  implements MetadataBlockData
{
    public static final int STREAM_INFO_DATA_LENGTH = 34;

    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.flac.MetadataBlockDataStreamInfo");

    private int minBlockSize, maxBlockSize, minFrameSize, maxFrameSize, samplingRate, samplingRatePerChannel, bitsPerSample, noOfChannels, noOfSamples;
    private float trackLength;
    private String md5;
    private boolean isValid = true;

    private ByteBuffer rawdata;

    public MetadataBlockDataStreamInfo(MetadataBlockHeader header, FileChannel fc) throws IOException
    {
        rawdata = ByteBuffer.allocate(header.getDataLength());
        rawdata.order(ByteOrder.BIG_ENDIAN);
        int bytesRead = fc.read(rawdata);
        if (bytesRead < header.getDataLength())
        {
            throw new IOException("Unable to read required number of bytes, read:" + bytesRead + ":required:" + header.getDataLength());
        }
        rawdata.flip();

        minBlockSize    = Utils.u(rawdata.getShort());
        maxBlockSize    = Utils.u(rawdata.getShort());
        minFrameSize    = readThreeByteInteger(rawdata.get(), rawdata.get(), rawdata.get());
        maxFrameSize    = readThreeByteInteger(rawdata.get(), rawdata.get(), rawdata.get());
        samplingRate    = readSamplingRate();
        noOfChannels    = readNoOfChannels();
        bitsPerSample   = readBitsPerSample();
        noOfSamples     = readTotalNumberOfSamples();
        md5             = readMd5();
        trackLength     = (float) ((double) noOfSamples / samplingRate);
        samplingRatePerChannel = samplingRate / noOfChannels;
        rawdata.rewind();
    }

    private final static char[] hexArray = "0123456789abcdef".toCharArray();

    private String readMd5()
    {
        char[] hexChars = new char[32]; // MD5 is always 32 characters

        if(rawdata.limit()>=34)
        {
            for (int i = 0; i < 16; i++)
            {
                int v = rawdata.get(i + 18) & 0xFF; // Offset 18
                hexChars[i * 2] = hexArray[v >>> 4];
                hexChars[i * 2 + 1] = hexArray[v & 0x0F];
            }
        }

        return new String(hexChars);
    }

    /**
     * @return the rawdata as it will be written to file
     */
    public ByteBuffer getBytes()
    {
        return rawdata;
    }

    public int getLength()
    {
        return rawdata.limit();
    }

    

    public String toString()
    {

        return "MinBlockSize:" + minBlockSize + "MaxBlockSize:" + maxBlockSize + "MinFrameSize:" + minFrameSize + "MaxFrameSize:" + maxFrameSize + "SampleRateTotal:" + samplingRate + "SampleRatePerChannel:" + samplingRatePerChannel + ":Channel number:" + noOfChannels + ":Bits per sample: " + bitsPerSample + ":TotalNumberOfSamples: " + noOfSamples + ":Length: " + trackLength;

    }

    public float getPreciseLength()
    {
        return trackLength;
    }

    public int getNoOfChannels()
    {
        return noOfChannels;
    }

    public int getSamplingRate()
    {
        return samplingRate;
    }

    public int getSamplingRatePerChannel()
    {
        return samplingRatePerChannel;
    }

    public String getEncodingType()
    {
        return "FLAC " + bitsPerSample + " bits";
    }
    
    public int getBitsPerSample()
    {
    	return bitsPerSample;
    }

    public long getNoOfSamples()
    {
        return noOfSamples;
    }

    public String getMD5Signature()
    {
        return md5;
    }

    public boolean isValid()
    {
        return isValid;
    }

    /**
     * SOme values are stored as 3 byte integrals (instead of the more usual 2 or 4)
     *
     * @param b1
     * @param b2
     * @param b3
     * @return
     */
    private int readThreeByteInteger(byte b1, byte b2, byte b3)
    {
        int rate = (Utils.u(b1) << 16) + (Utils.u(b2) << 8) + (Utils.u(b3));
        return rate;
    }

    /**
     * Sampling rate is stored over 20 bits bytes 10 and 11 and half of bytes 12 so have to mask third one
     *
     * @return
     */
    private int readSamplingRate()
    {
        int rate = (Utils.u(rawdata.get(10)) << 12) + (Utils.u(rawdata.get(11)) << 4) + ((Utils.u(rawdata.get(12)) & 0xF0) >>> 4);
        return rate;
    }

    /**
    Stored in 5th to 7th bits of byte 12
     */
    private int readNoOfChannels()
    {
        return ((Utils.u(rawdata.get(12)) & 0x0E) >>> 1) + 1;
    }

    /** Stored in last bit of byte 12 and first 4 bits of byte 13 */
    private int readBitsPerSample()
    {
        return ((Utils.u(rawdata.get(12)) & 0x01) << 4) + ((Utils.u(rawdata.get(13)) & 0xF0) >>> 4) + 1;
    }

    /** Stored in second half of byte 13 plus bytes 14 - 17
     *
     * @return
     */
    private int readTotalNumberOfSamples()
    {
        int nb = Utils.u(rawdata.get(17));
        nb += Utils.u(rawdata.get(16)) << 8;
        nb += Utils.u(rawdata.get(15)) << 16;
        nb += Utils.u(rawdata.get(14)) << 24;
        nb += (Utils.u(rawdata.get(13)) & 0x0F) << 32;
        return nb;
    }
}
