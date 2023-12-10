/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Rapha�l Slinckx <raphael@slinckx.net>
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
package org.jaudiotagger.audio.generic;

import org.jaudiotagger.audio.AudioHeader;


/**
 * This class represents a structure for storing and retrieving information
 * about the codec respectively the encoding parameters.<br>
 * Most of the parameters are available for nearly each audio format. Some
 * others would result in standard values.<br>
 * <b>Consider:</b> None of the setter methods will actually affect the audio
 * file. This is just a structure for retrieving information, not manipulating
 * the audio file.<br>
 *
 * @author Raphael Slinckx
 */
public class GenericAudioHeader implements AudioHeader
{
    //Use objects so clearer wherher has been set or not
    private Long    audioDataLength;
    private Long    audioDataStartPosition;
    private Long    audioDataEndPosition;
    private Integer bitRate;
    private Integer noOfChannels;
    private Integer samplingRate;
    private Integer bitsPerSample;
    private String  encodingType;
    private Boolean isVbr = Boolean.TRUE; //TODO this is a weird default
    private Boolean isLossless;
    private Double  trackLength;
    private Long    noOfSamples;
    private Integer byteRate;



    /**
     * Creates an instance with emtpy values.<br>
     */
    public GenericAudioHeader()
    {

    }

    public String getBitRate()
    {
        return String.valueOf(bitRate);
    }


    /**
     * This method returns the bitRate of the represented audio clip in
     * &quot;Kbps&quot;.<br>
     *
     * @return The bitRate in Kbps.
     */
    public long getBitRateAsNumber()
    {
        return bitRate;
    }

    /**
     * This method returns the number of audio channels the clip contains.<br>
     * (The stereo, mono thing).
     *
     * @return The number of channels. (2 for stereo, 1 for mono)
     */
    public int getChannelNumber()
    {
        return noOfChannels;
    }

    /**
     * @return
     */
    public String getChannels()
    {
        return String.valueOf(getChannelNumber());
    }

    /**
     * Returns the encoding type.
     *
     * @return The encoding type
     */
    public String getEncodingType()
    {
        return encodingType;
    }

    /**
     * Returns the format, same as encoding type
     *
     * @return The encoding type
     */
    public String getFormat()
    {
        return encodingType;
    }



    /**
     * This method returns the duration of the represented audio clip in
     * seconds.<br>
     *
     * @return The duration to the nearest seconds.
     * @see #getPreciseTrackLength()
     */
    public int getTrackLength()
    {
        return (int) Math.round(getPreciseTrackLength());
    }

    /**
     * This method returns the duration of the represented audio clip in seconds
     * (single-precision).<br>
     *
     * @return The duration in seconds.
     * @see #getTrackLength()
     */
    public double getPreciseTrackLength()
    {
        return trackLength;
    }

    /**
     * This method returns the sample rate, the audio clip was encoded with.<br>
     *
     * @return Sample rate of the audio clip in &quot;Hz&quot;.
     */
    public String getSampleRate()
    {
        return String.valueOf(samplingRate);
    }

    public int getSampleRateAsNumber()
    {
        return samplingRate;
    }
    
    /**
     * @return The number of bits per sample
     */
    public int  getBitsPerSample()
    {
        //TODO remove bandaid
        if(bitsPerSample==null)
        {
            return -1;
        }
    	return bitsPerSample;
    }

    /**
     * This method returns <code>true</code>, if the audio file is encoded
     * with &quot;Variable Bitrate&quot;.<br>
     *
     * @return <code>true</code> if audio clip is encoded with VBR.
     */
    public boolean isVariableBitRate()
    {
        //TODO remove this bandaid
        if(isVbr==null)
        {
            return false;
        }
        return isVbr;
    }

    /**
     * This method returns <code>true</code>, if the audio file is encoded
     * with &quot;Lossless&quot;.<br>
     *
     * @return <code>true</code> if audio clip is encoded with VBR.
     */
    public boolean isLossless()
    {
        //TODO remove this bandaid
        if(isLossless==null)
        {
            return false;
        }
        return isLossless;
    }

    /**
     * This Method sets the bitRate in &quot;Kbps&quot;.<br>
     *
     * @param bitRate bitRate in kbps.
     */
    public void setBitRate(int bitRate)
    {
        this.bitRate = bitRate;
    }

    /**
     * Sets the number of channels.
     *
     * @param channelMode number of channels (2 for stereo, 1 for mono).
     */
    public void setChannelNumber(int channelMode)
    {
        this.noOfChannels = channelMode;
    }

    /**
     * Sets the type of the encoding.<br>
     * This is a bit format specific.<br>
     * eg:Layer I/II/III
     *
     * @param encodingType Encoding type.
     */
    public void setEncodingType(String encodingType)
    {
        this.encodingType=encodingType;
    }

    /**
     * This method sets the audio duration of the represented clip.<br>
     *
     * @param length The duration of the audio in seconds (single-precision).
     */
    public void setPreciseLength(double length)
    {
        this.trackLength = length;
    }

    /**
     * Sets the Sampling rate in &quot;Hz&quot;<br>
     *
     * @param samplingRate Sample rate.
     */
    public void setSamplingRate(int samplingRate)
    {
        this.samplingRate = samplingRate;
    }
    
    /*
     * Sets the Bits per Sample <br>
     * 
     * @params bitsPerSample Bits Per Sample
     */
    public void setBitsPerSample(int bitsPerSample)
    {
    	this.bitsPerSample = bitsPerSample;
    }

    /*
    * Sets the ByteRate (per second)
    *
    * @params ByteRate
    */
    public void setByteRate(int byteRate)
    {
        this.byteRate = byteRate;
    }


    /**
     * Sets the VBR flag for the represented audio clip.<br>
     *
     * @param isVbr <code>true</code> if VBR.
     */
    public void setVariableBitRate(boolean isVbr)
    {
        this.isVbr=isVbr;
    }

    /**
     * Sets the Lossless flag for the represented audio clip.<br>
     *
     * @param isLossless <code>true</code> if Lossless.
     */
    public void setLossless(boolean isLossless)
    {
        this.isLossless = isLossless;
    }



    /**
     * Pretty prints this encoding info
     *
     * @see Object#toString()
     */
    public String toString()
    {
        StringBuilder out = new StringBuilder();
        out.append("Audio Header content:\n");
        if(audioDataLength!=null)
        {
            out.append("\taudioDataLength:"+audioDataLength+"\n");
        }
        if(audioDataStartPosition!=null)
        {
            out.append("\taudioDataStartPosition:"+audioDataStartPosition+"\n");
        }
        if(audioDataEndPosition!=null)
        {
            out.append("\taudioDataEndPosition:"+audioDataEndPosition+"\n");
        }
        if(byteRate!=null)
        {
            out.append("\tbyteRate:"+byteRate+"\n");
        }
        if(bitRate!=null)
        {
            out.append("\tbitRate:"+bitRate+"\n");
        }
        if(samplingRate!=null)
        {
            out.append("\tsamplingRate:"+samplingRate+"\n");
        }
        if(bitsPerSample!=null)
        {
            out.append("\tbitsPerSample:"+bitsPerSample+"\n");
        }
        if(noOfSamples!=null)
        {
            out.append("\ttotalNoSamples:"+noOfSamples+"\n");
        }
        if(noOfChannels!=null)
        {
            out.append("\tnumberOfChannels:"+noOfChannels+"\n");
        }
        if(encodingType!=null)
        {
            out.append("\tencodingType:"+encodingType+"\n");
        }
        if(isVbr!=null)
        {
            out.append("\tisVbr:"+isVbr+"\n");
        }
        if(isLossless!=null)
        {
            out.append("\tisLossless:"+isLossless+"\n");
        }
        if(trackLength!=null)
        {
            out.append("\ttrackDuration:"+trackLength+"\n");
        }
        return out.toString();
    }

    public Long getAudioDataLength()
    {
        return audioDataLength;
    }

    public void setAudioDataLength(long audioDataLength)
    {
        this.audioDataLength = audioDataLength;
    }

    public Integer getByteRate()
    {
        return byteRate;
    }

    public Long getNoOfSamples()
    {
        return noOfSamples;
    }

    public void setNoOfSamples(Long noOfSamples)
    {
        this.noOfSamples = noOfSamples;
    }


    @Override
    public Long getAudioDataStartPosition()
    {
        return audioDataStartPosition;
    }

    public void setAudioDataStartPosition(Long audioDataStartPosition)
    {
        this.audioDataStartPosition = audioDataStartPosition;
    }

    @Override
    public Long getAudioDataEndPosition()
    {
        return audioDataEndPosition;
    }

    public void setAudioDataEndPosition(Long audioDataEndPosition)
    {
        this.audioDataEndPosition = audioDataEndPosition;
    }
}
