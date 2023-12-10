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
package org.jaudiotagger.audio.asf.io;

import org.jaudiotagger.audio.asf.data.*;
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;

/**
 * Reads and interprets the data of the audio or video stream information chunk. <br>
 *
 * @author Christian Laireiter
 */
public class StreamChunkReader implements ChunkReader
{

    /**
     * The GUID this reader {@linkplain #getApplyingIds() applies to}
     */
    private final static GUID[] APPLYING = {GUID.GUID_STREAM};

    /**
     * Shouldn't be used for now.
     */
    protected StreamChunkReader()
    {
        // Nothing to do
    }

    /**
     * {@inheritDoc}
     */
    public boolean canFail()
    {
        return true;
    }

    /**
     * {@inheritDoc}
     */
    public GUID[] getApplyingIds()
    {
        return APPLYING.clone();
    }

    /**
     * {@inheritDoc}
     */
    public Chunk read(final GUID guid, final InputStream stream, final long chunkStart) throws IOException
    {
        StreamChunk result = null;
        final BigInteger chunkLength = Utils.readBig64(stream);
        // Now comes GUID indicating whether stream content type is audio or
        // video
        final GUID streamTypeGUID = Utils.readGUID(stream);
        if (GUID.GUID_AUDIOSTREAM.equals(streamTypeGUID) || GUID.GUID_VIDEOSTREAM.equals(streamTypeGUID))
        {

            // A GUID is indicating whether the stream is error
            // concealed
            final GUID errorConcealment = Utils.readGUID(stream);
            /*
             * Read the Time Offset
             */
            final long timeOffset = Utils.readUINT64(stream);

            final long typeSpecificDataSize = Utils.readUINT32(stream);
            final long streamSpecificDataSize = Utils.readUINT32(stream);

            /*
             * Read a bit field. (Contains stream number, and whether the stream
             * content is encrypted.)
             */
            final int mask = Utils.readUINT16(stream);
            final int streamNumber = mask & 127;
            final boolean contentEncrypted = (mask & 0x8000) != 0;

            /*
             * Skip a reserved field
             */
            stream.skip(4);

            /*
             * very important to set for every stream type. The size of bytes
             * read by the specific stream type, in order to skip the remaining
             * unread bytes of the stream chunk.
             */
            long streamSpecificBytes;

            if (GUID.GUID_AUDIOSTREAM.equals(streamTypeGUID))
            {
                /*
                 * Reading audio specific information
                 */
                final AudioStreamChunk audioStreamChunk = new AudioStreamChunk(chunkLength);
                result = audioStreamChunk;

                /*
                 * read WAVEFORMATEX and format extension.
                 */
                final long compressionFormat = Utils.readUINT16(stream);
                final long channelCount = Utils.readUINT16(stream);
                final long samplingRate = Utils.readUINT32(stream);
                final long avgBytesPerSec = Utils.readUINT32(stream);
                final long blockAlignment = Utils.readUINT16(stream);
                final int bitsPerSample = Utils.readUINT16(stream);
                final int codecSpecificDataSize = Utils.readUINT16(stream);
                final byte[] codecSpecificData = new byte[codecSpecificDataSize];
                stream.read(codecSpecificData);

                audioStreamChunk.setCompressionFormat(compressionFormat);
                audioStreamChunk.setChannelCount(channelCount);
                audioStreamChunk.setSamplingRate(samplingRate);
                audioStreamChunk.setAverageBytesPerSec(avgBytesPerSec);
                audioStreamChunk.setErrorConcealment(errorConcealment);
                audioStreamChunk.setBlockAlignment(blockAlignment);
                audioStreamChunk.setBitsPerSample(bitsPerSample);
                audioStreamChunk.setCodecData(codecSpecificData);

                streamSpecificBytes = 18 + codecSpecificData.length;
            }
            else
            {
                /*
                 * Reading video specific information
                 */
                final VideoStreamChunk videoStreamChunk = new VideoStreamChunk(chunkLength);
                result = videoStreamChunk;

                final long pictureWidth = Utils.readUINT32(stream);
                final long pictureHeight = Utils.readUINT32(stream);

                // Skip unknown field
                stream.skip(1);

                /*
                 * Now read the format specific data
                 */
                // Size of the data section (formatDataSize)
                stream.skip(2);

                stream.skip(16);
                final byte[] fourCC = new byte[4];
                stream.read(fourCC);

                videoStreamChunk.setPictureWidth(pictureWidth);
                videoStreamChunk.setPictureHeight(pictureHeight);
                videoStreamChunk.setCodecId(fourCC);

                streamSpecificBytes = 31;
            }

            /*
             * Setting common values for audio and video
             */
            result.setStreamNumber(streamNumber);
            result.setStreamSpecificDataSize(streamSpecificDataSize);
            result.setTypeSpecificDataSize(typeSpecificDataSize);
            result.setTimeOffset(timeOffset);
            result.setContentEncrypted(contentEncrypted);
            result.setPosition(chunkStart);
            /*
             * Now skip remainder of chunks bytes. chunk-length - 24 (size of
             * GUID and chunklen) - streamSpecificBytes(stream type specific
             * data) - 54 (common data)
             */
            stream.skip(chunkLength.longValue() - 24 - streamSpecificBytes - 54);
        }
        return result;
    }

}