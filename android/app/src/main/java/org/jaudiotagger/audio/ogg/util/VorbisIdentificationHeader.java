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
package org.jaudiotagger.audio.ogg.util;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.ogg.VorbisVersion;

import java.util.logging.Logger;


/**
 * Vorbis Identification header
 *
 * From http://xiph.org/vorbis/doc/Vorbis_I_spec.html#id326710
 *
 * The identification header is a short header of only a few fields used to declare the stream definitively as Vorbis,
 * and provide a few externally relevant pieces of information about the audio stream. The identification header is
 * coded as follows:
 *
 * 1) [vorbis_version] = read 32 bits as unsigned integer
 * 2) [audio_channels] = read 8 bit integer as unsigned
 * 3) [audio_sample_rate] = read 32 bits as unsigned integer
 * 4) [bitrate_maximum] = read 32 bits as signed integer
 * 5) [bitrate_nominal] = read 32 bits as signed integer
 * 6) [bitrate_minimum] = read 32 bits as signed integer
 * 7) [blocksize_0] = 2 exponent (read 4 bits as unsigned integer)
 * 8) [blocksize_1] = 2 exponent (read 4 bits as unsigned integer)
 * 9) [framing_flag] = read one bit
 *
 * $Id$
 *
 * @author Raphael Slinckx (KiKiDonK)
 * @version 16 d�cembre 2003
 */
public class VorbisIdentificationHeader implements VorbisHeader
{
    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.ogg.atom");

    private int audioChannels;
    private boolean isValid = false;

    private int vorbisVersion, audioSampleRate;
    private int bitrateMinimal, bitrateNominal, bitrateMaximal;

    public static final int FIELD_VORBIS_VERSION_POS = 7;
    public static final int FIELD_AUDIO_CHANNELS_POS = 11;
    public static final int FIELD_AUDIO_SAMPLE_RATE_POS = 12;
    public static final int FIELD_BITRATE_MAX_POS = 16;
    public static final int FIELD_BITRATE_NOMAIML_POS = 20;
    public static final int FIELD_BITRATE_MIN_POS = 24;
    public static final int FIELD_BLOCKSIZE_POS = 28;
    public static final int FIELD_FRAMING_FLAG_POS = 29;

    public static final int FIELD_VORBIS_VERSION_LENGTH = 4;
    public static final int FIELD_AUDIO_CHANNELS_LENGTH = 1;
    public static final int FIELD_AUDIO_SAMPLE_RATE_LENGTH = 4;
    public static final int FIELD_BITRATE_MAX_LENGTH = 4;
    public static final int FIELD_BITRATE_NOMAIML_LENGTH = 4;
    public static final int FIELD_BITRATE_MIN_LENGTH = 4;
    public static final int FIELD_BLOCKSIZE_LENGTH = 1;
    public static final int FIELD_FRAMING_FLAG_LENGTH = 1;


    public VorbisIdentificationHeader(byte[] vorbisData)
    {
        decodeHeader(vorbisData);
    }


    public int getChannelNumber()
    {
        return audioChannels;
    }


    public String getEncodingType()
    {
        return VorbisVersion.values()[vorbisVersion].toString();
    }


    public int getSamplingRate()
    {
        return audioSampleRate;
    }

    public int getNominalBitrate()
    {
        return bitrateNominal;
    }

    public int getMaxBitrate()
    {
        return bitrateMaximal;
    }

    public int getMinBitrate()
    {
        return bitrateMinimal;
    }

    public boolean isValid()
    {
        return isValid;
    }


    public void decodeHeader(byte[] b)
    {
        int packetType = b[FIELD_PACKET_TYPE_POS];
        logger.fine("packetType" + packetType);
        String vorbis = new String(b, VorbisHeader.FIELD_CAPTURE_PATTERN_POS, VorbisHeader.FIELD_CAPTURE_PATTERN_LENGTH, StandardCharsets.ISO_8859_1);

        if (packetType == VorbisPacketType.IDENTIFICATION_HEADER.getType() && vorbis.equals(CAPTURE_PATTERN))
        {
            this.vorbisVersion = b[7] + (b[8] << 8) + (b[9] << 16) + (b[10] << 24);
            logger.fine("vorbisVersion" + vorbisVersion);
            this.audioChannels = u(b[FIELD_AUDIO_CHANNELS_POS]);
            logger.fine("audioChannels" + audioChannels);
            this.audioSampleRate = u(b[12]) + (u(b[13]) << 8) + (u(b[14]) << 16) + (u(b[15]) << 24);
            logger.fine("audioSampleRate" + audioSampleRate);
            logger.fine("audioSampleRate" + b[12] + " " + b[13] + " " + b[14]);

            //TODO is this right spec says signed
            this.bitrateMinimal = u(b[16]) + (u(b[17]) << 8) + (u(b[18]) << 16) + (u(b[19]) << 24);
            this.bitrateNominal = u(b[20]) + (u(b[21]) << 8) + (u(b[22]) << 16) + (u(b[23]) << 24);
            this.bitrateMaximal = u(b[24]) + (u(b[25]) << 8) + (u(b[26]) << 16) + (u(b[27]) << 24);
            //byte blockSize0 = (byte) ( b[28] & 240 );
            //byte blockSize1 = (byte) ( b[28] & 15 );

            int framingFlag = b[FIELD_FRAMING_FLAG_POS];
            logger.fine("framingFlag" + framingFlag);
            if (framingFlag != 0)
            {
                isValid = true;
            }

        }
    }

    private int u(int i)
    {
        return i & 0xFF;
    }
}

