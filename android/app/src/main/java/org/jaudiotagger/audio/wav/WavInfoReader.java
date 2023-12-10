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
package org.jaudiotagger.audio.wav;

import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.generic.GenericAudioHeader;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.iff.Chunk;
import org.jaudiotagger.audio.iff.ChunkHeader;
import org.jaudiotagger.audio.iff.IffHeaderChunk;
import org.jaudiotagger.audio.wav.chunk.WavFactChunk;
import org.jaudiotagger.audio.wav.chunk.WavFormatChunk;
import org.jaudiotagger.logging.Hex;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.util.logging.Logger;

/**
 * Read the Wav file chunks, until finds WavFormatChunk and then generates AudioHeader from it
 */
public class WavInfoReader {
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.wav");


    private String loggingName;

    public WavInfoReader(String loggingName) {
        this.loggingName = loggingName;
    }

    public GenericAudioHeader read(File file) throws CannotReadException, IOException {
        GenericAudioHeader info = new GenericAudioHeader();
        RandomAccessFile raf = null;
        try {
            raf = new RandomAccessFile(file, "r");
            FileChannel fc = raf.getChannel();
            if (WavRIFFHeader.isValidHeader(fc)) {
                while (fc.position() < fc.size()) {
                    if (!readChunk(fc, info)) {
                        break;
                    }
                }
            } else {
                throw new CannotReadException(loggingName + " Wav RIFF Header not valid");
            }
        } finally {
            AudioFileIO.closeQuietly(raf);
        }
        calculateTrackLength(info);
        return info;
    }

    /**
     * Calculate track length, done it here because requires data from multiple chunks
     *
     * @param info
     * @throws CannotReadException
     */
    private void calculateTrackLength(GenericAudioHeader info) throws CannotReadException {
        //If we have fact chunk we can calculate accurately by taking total of samples (per channel) divided by the number
        //of samples taken per second (per channel)
        if (info.getNoOfSamples() != null) {
            if (info.getSampleRateAsNumber() > 0) {
                info.setPreciseLength((float) info.getNoOfSamples() / info.getSampleRateAsNumber());
            }
        }
        //Otherwise adequate to divide the total number of sampling bytes by the average byte rate
        else if (info.getAudioDataLength() > 0) {
            info.setPreciseLength((float) info.getAudioDataLength() / info.getByteRate());
        } else {
            throw new CannotReadException(loggingName + " Wav Data Header Missing");
        }
    }

    /**
     * Reads a Wav Chunk.
     */
    protected boolean readChunk(FileChannel fc, GenericAudioHeader info) throws IOException, CannotReadException {
        Chunk chunk;
        ChunkHeader chunkHeader = new ChunkHeader(ByteOrder.LITTLE_ENDIAN);
        if (!chunkHeader.readHeader(fc)) {
            return false;
        }

        String id = chunkHeader.getID();
        logger.fine(loggingName + " Reading Chunk:" + id
                + ":starting at:" + Hex.asDecAndHex(chunkHeader.getStartLocationInFile())
                + ":sizeIncHeader:" + (chunkHeader.getSize() + ChunkHeader.CHUNK_HEADER_SIZE));
        final WavChunkType chunkType = WavChunkType.get(id);

        //If known chunkType
        if (chunkType != null) {
            switch (chunkType) {
                case FACT: {
                    ByteBuffer fmtChunkData = Utils.readFileDataIntoBufferLE(fc, (int) chunkHeader.getSize());
                    chunk = new WavFactChunk(fmtChunkData, chunkHeader, info);
                    if (!chunk.readChunk()) {
                        return false;
                    }
                    break;
                }

                case DATA: {
                    //We just need this value from header dont actually need to read data itself
                    info.setAudioDataLength(chunkHeader.getSize());
                    info.setAudioDataStartPosition(fc.position());
                    info.setAudioDataEndPosition(fc.position() + chunkHeader.getSize());
                    fc.position(fc.position() + chunkHeader.getSize());
                    break;
                }

                case FORMAT: {
                    ByteBuffer fmtChunkData = Utils.readFileDataIntoBufferLE(fc, (int) chunkHeader.getSize());
                    chunk = new WavFormatChunk(fmtChunkData, chunkHeader, info);
                    if (!chunk.readChunk()) {
                        return false;
                    }
                    break;
                }

                case CORRUPT_LIST:
                    logger.severe(loggingName + " Found Corrupt LIST Chunk, starting at Odd Location:" + chunkHeader.getID() + ":" + chunkHeader.getSize());
                    fc.position(fc.position() - (ChunkHeader.CHUNK_HEADER_SIZE - 1));
                    return true;

                //Dont need to do anything with these just skip
                default:
                    logger.config(loggingName + " Skipping chunk bytes:" + chunkHeader.getSize());
                    fc.position(fc.position() + chunkHeader.getSize());
            }
        }
        //Unknown chunk type just skip
        else {
            if (chunkHeader.getSize() < 0) {
                String msg = loggingName + " Not a valid header, unable to read a sensible size:Header"
                        + chunkHeader.getID() + "Size:" + chunkHeader.getSize();
                logger.severe(msg);
                throw new CannotReadException(msg);
            }
            logger.config(loggingName + " Skipping chunk bytes:" + chunkHeader.getSize() + " for " + chunkHeader.getID());

            fc.position(fc.position() + chunkHeader.getSize());
            if (fc.position() > fc.size()) {
                String msg = loggingName + " Failed to move to invalid position to " + fc.position() + " because file length is only " + fc.size()
                        + " indicates invalid chunk";
                logger.severe(msg);
                throw new CannotReadException(msg);
            }
        }
        IffHeaderChunk.ensureOnEqualBoundary(fc, chunkHeader);
        return true;
    }


}
