/*
 * Entagged Audio Tag library
 * Copyright (c) 2004-2005 Christian Laireiter <liree@web.de>
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
package org.jaudiotagger.audio.asf.data;

import org.jaudiotagger.audio.asf.util.Utils;

import java.math.BigInteger;

/**
 * This class represents the stream chunk describing an audio stream. <br>
 *
 * @author Christian Laireiter
 */
public final class AudioStreamChunk extends StreamChunk
{
    /**
     * Stores the hex values of codec identifiers to their descriptions. <br>
     */
    public final static String[][] CODEC_DESCRIPTIONS = {{"161", " (Windows Media Audio (ver 7,8,9))"}, {"162", " (Windows Media Audio 9 series (Professional))"}, {"163", "(Windows Media Audio 9 series (Lossless))"}, {"7A21", " (GSM-AMR (CBR))"}, {"7A22", " (GSM-AMR (VBR))"}};
    /**
     * Stores the audio codec number for WMA
     */
    public final static long WMA = 0x161;
    /**
     * Stores the audio codec number for WMA (CBR)
     */
    public final static long WMA_CBR = 0x7A21;
    /**
     * Stores the audio codec number for WMA_LOSSLESS
     */
    public final static long WMA_LOSSLESS = 0x163;
    /**
     * Stores the audio codec number for WMA_PRO
     */
    public final static long WMA_PRO = 0x162;

    /**
     * Stores the audio codec number for WMA (VBR)
     */
    public final static long WMA_VBR = 0x7A22;

    /**
     * Stores the average amount of bytes used by audio stream. <br>
     * This value is a field within type specific data of audio stream. Maybe it
     * could be used to calculate the KBPs.
     */
    private long averageBytesPerSec;

    /**
     * Amount of bits used per sample. <br>
     */
    private int bitsPerSample;

    /**
     * The block alignment of the audio data.
     */
    private long blockAlignment;

    /**
     * Number of channels.
     */
    private long channelCount;

    /**
     * Some data which needs to be interpreted if the codec is handled.
     */
    private byte[] codecData = new byte[0];

    /**
     * The audio compression format code.
     */
    private long compressionFormat;

    /**
     * this field stores the error concealment type.
     */
    private GUID errorConcealment;

    /**
     * Sampling rate of audio stream.
     */
    private long samplingRate;

    /**
     * Creates an instance.
     *
     * @param chunkLen Length of the entire chunk (including guid and size)
     */
    public AudioStreamChunk(final BigInteger chunkLen)
    {
        super(GUID.GUID_AUDIOSTREAM, chunkLen);
    }

    /**
     * @return Returns the averageBytesPerSec.
     */
    public long getAverageBytesPerSec()
    {
        return this.averageBytesPerSec;
    }

    /**
     * @return Returns the bitsPerSample.
     */
    public int getBitsPerSample()
    {
        return this.bitsPerSample;
    }

    /**
     * @return Returns the blockAlignment.
     */
    public long getBlockAlignment()
    {
        return this.blockAlignment;
    }

    /**
     * @return Returns the channelCount.
     */
    public long getChannelCount()
    {
        return this.channelCount;
    }

    /**
     * @return Returns the codecData.
     */
    public byte[] getCodecData()
    {
        return this.codecData.clone();
    }

    /**
     * This method will take a look at {@link #compressionFormat}and returns a
     * String with its hex value and if known a textual note on what coded it
     * represents. <br>
     *
     * @return A description for the used codec.
     */
    public String getCodecDescription()
    {
        final StringBuilder result = new StringBuilder(Long.toHexString(getCompressionFormat()));
        String furtherDesc = " (Unknown)";
        for (final String[] aCODEC_DESCRIPTIONS : CODEC_DESCRIPTIONS)
        {
            if (aCODEC_DESCRIPTIONS[0].equalsIgnoreCase(result.toString()))
            {
                furtherDesc = aCODEC_DESCRIPTIONS[1];
                break;
            }
        }
        if (result.length() % 2 == 0)
        {
            result.insert(0, "0x");
        }
        else
        {
            result.insert(0, "0x0");
        }
        result.append(furtherDesc);
        return result.toString();
    }

    /**
     * @return Returns the compressionFormat.
     */
    public long getCompressionFormat()
    {
        return this.compressionFormat;
    }

    /**
     * @return Returns the errorConcealment.
     */
    public GUID getErrorConcealment()
    {
        return this.errorConcealment;
    }

    /**
     * This method takes the value of {@link #getAverageBytesPerSec()}and
     * calculates the kbps out of it, by simply multiplying by 8 and dividing by
     * 1000. <br>
     *
     * @return amount of bits per second in kilo bits.
     */
    public int getKbps()
    {
        return (int) getAverageBytesPerSec() * 8 / 1000;
    }

    /**
     * @return Returns the samplingRate.
     */
    public long getSamplingRate()
    {
        return this.samplingRate;
    }

    /**
     * This mehtod returns whether the audio stream data is error concealed. <br>
     * For now only interleaved concealment is known. <br>
     *
     * @return <code>true</code> if error concealment is used.
     */
    public boolean isErrorConcealed()
    {
        return getErrorConcealment().equals(GUID.GUID_AUDIO_ERROR_CONCEALEMENT_INTERLEAVED);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String prettyPrint(final String prefix)
    {
        final StringBuilder result = new StringBuilder(super.prettyPrint(prefix));
        result.append(prefix).append("  |-> Audio info:").append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |  : Bitrate : ").append(getKbps()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |  : Channels : ").append(getChannelCount()).append(" at ").append(getSamplingRate()).append(" Hz").append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |  : Bits per Sample: ").append(getBitsPerSample()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |  : Formatcode: ").append(getCodecDescription()).append(Utils.LINE_SEPARATOR);
        return result.toString();
    }

    /**
     * @param avgeBytesPerSec The averageBytesPerSec to set.
     */
    public void setAverageBytesPerSec(final long avgeBytesPerSec)
    {
        this.averageBytesPerSec = avgeBytesPerSec;
    }

    /**
     * Sets the bitsPerSample
     *
     * @param bps
     */
    public void setBitsPerSample(final int bps)
    {
        this.bitsPerSample = bps;
    }

    /**
     * Sets the blockAlignment.
     *
     * @param align
     */
    public void setBlockAlignment(final long align)
    {
        this.blockAlignment = align;
    }

    /**
     * @param channels The channelCount to set.
     */
    public void setChannelCount(final long channels)
    {
        this.channelCount = channels;
    }

    /**
     * Sets the codecData
     *
     * @param codecSpecificData
     */
    public void setCodecData(final byte[] codecSpecificData)
    {
        if (codecSpecificData == null)
        {
            throw new IllegalArgumentException();
        }
        this.codecData = codecSpecificData.clone();
    }

    /**
     * @param cFormatCode The compressionFormat to set.
     */
    public void setCompressionFormat(final long cFormatCode)
    {
        this.compressionFormat = cFormatCode;
    }

    /**
     * This method sets the error concealment type which is given by two GUIDs. <br>
     *
     * @param errConc the type of error concealment the audio stream is stored as.
     */
    public void setErrorConcealment(final GUID errConc)
    {
        this.errorConcealment = errConc;
    }

    /**
     * @param sampRate The samplingRate to set.
     */
    public void setSamplingRate(final long sampRate)
    {
        this.samplingRate = sampRate;
    }
}