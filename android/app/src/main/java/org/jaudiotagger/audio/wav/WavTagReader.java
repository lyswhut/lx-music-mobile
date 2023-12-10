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
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.iff.Chunk;
import org.jaudiotagger.audio.iff.ChunkHeader;
import org.jaudiotagger.audio.iff.ChunkSummary;
import org.jaudiotagger.audio.iff.IffHeaderChunk;
import org.jaudiotagger.audio.wav.chunk.WavId3Chunk;
import org.jaudiotagger.audio.wav.chunk.WavListChunk;
import org.jaudiotagger.logging.Hex;
import org.jaudiotagger.tag.TagOptionSingleton;
import org.jaudiotagger.tag.wav.WavInfoTag;
import org.jaudiotagger.tag.wav.WavTag;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.util.logging.Logger;

/**
 * Read the Wav file chunks, until finds WavFormatChunk and then generates AudioHeader from it
 */
public class WavTagReader {
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.wav");

    private String loggingName;

    public WavTagReader(String loggingName) {
        this.loggingName = loggingName;
    }


    /**
     * Read file and return tag metadata
     *
     * @param file
     * @return
     * @throws CannotReadException
     * @throws IOException
     */
    public WavTag read(File file) throws CannotReadException, IOException {
        logger.config(loggingName + " Read Tag:start");
        WavTag tag = new WavTag(TagOptionSingleton.getInstance().getWavOptions());
        RandomAccessFile raf = null;
        try {
            raf = new RandomAccessFile(file, "r");
            FileChannel fc = raf.getChannel();
            if (WavRIFFHeader.isValidHeader(fc)) {
                while (fc.position() < fc.size()) {
                    if (!readChunk(fc, tag)) {
                        break;
                    }
                }
            } else {
                throw new CannotReadException(loggingName + " Wav RIFF Header not valid");
            }
        } finally {
            AudioFileIO.closeQuietly(raf);
        }
        createDefaultMetadataTagsIfMissing(tag);
        logger.config(loggingName + " Read Tag:end");
        return tag;
    }

    /**
     * So if the file doesn't contain (both) types of metadata we construct them so data can be
     * added and written back to file on save
     *
     * @param tag
     */
    private void createDefaultMetadataTagsIfMissing(WavTag tag) {
        if (!tag.isExistingId3Tag()) {
            tag.setID3Tag(WavTag.createDefaultID3Tag());
        }
        if (!tag.isExistingInfoTag()) {
            tag.setInfoTag(new WavInfoTag());
        }
    }

    /**
     * Reads Wavs Chunk that contain tag metadata
     * <p>
     * If the same chunk exists more than once in the file we would just use the last occurence
     *
     * @param tag
     * @return
     * @throws IOException
     */
    protected boolean readChunk(FileChannel fc, WavTag tag) throws IOException, CannotReadException {
        Chunk chunk;
        ChunkHeader chunkHeader = new ChunkHeader(ByteOrder.LITTLE_ENDIAN);
        if (!chunkHeader.readHeader(fc)) {
            return false;
        }

        String id = chunkHeader.getID();
        logger.config(loggingName + " Next Id is:" + id + ":FileLocation:" + fc.position() + ":Size:" + chunkHeader.getSize());
        final WavChunkType chunkType = WavChunkType.get(id);
        if (chunkType != null) {
            switch (chunkType) {
                case LIST:
                    tag.addChunkSummary(new ChunkSummary(chunkHeader.getID(), chunkHeader.getStartLocationInFile(), chunkHeader.getSize()));
                    if (tag.getInfoTag() == null) {
                        chunk = new WavListChunk(loggingName, Utils.readFileDataIntoBufferLE(fc, (int) chunkHeader.getSize()), chunkHeader, tag);
                        if (!chunk.readChunk()) {
                            return false;
                        }
                    } else {
                        logger.warning(loggingName + " Ignoring LIST chunk because already have one:" + chunkHeader.getID()
                                + ":" + Hex.asDecAndHex(chunkHeader.getStartLocationInFile() - 1)
                                + ":sizeIncHeader:" + (chunkHeader.getSize() + ChunkHeader.CHUNK_HEADER_SIZE));
                    }
                    break;

                case CORRUPT_LIST:
                    logger.severe(loggingName + " Found Corrupt LIST Chunk, starting at Odd Location:" + chunkHeader.getID() + ":" + chunkHeader.getSize());

                    if (tag.getInfoTag() == null && tag.getID3Tag() == null) {
                        tag.setIncorrectlyAlignedTag(true);
                    }
                    fc.position(fc.position() - (ChunkHeader.CHUNK_HEADER_SIZE - 1));
                    return true;

                case ID3:
                    tag.addChunkSummary(new ChunkSummary(chunkHeader.getID(), chunkHeader.getStartLocationInFile(), chunkHeader.getSize()));
                    if (tag.getID3Tag() == null) {
                        chunk = new WavId3Chunk(Utils.readFileDataIntoBufferLE(fc, (int) chunkHeader.getSize()), chunkHeader, tag);
                        if (!chunk.readChunk()) {
                            return false;
                        }
                    } else {
                        logger.warning(loggingName + " Ignoring id3 chunk because already have one:" + chunkHeader.getID() + ":"
                                + Hex.asDecAndHex(chunkHeader.getStartLocationInFile())
                                + ":sizeIncHeader:" + (chunkHeader.getSize() + ChunkHeader.CHUNK_HEADER_SIZE));
                    }
                    break;

                case CORRUPT_ID3_EARLY:
                    logger.severe(loggingName + " Found Corrupt id3 chunk, starting at Odd Location:" + chunkHeader.getID() + ":" + chunkHeader.getSize());
                    if (tag.getInfoTag() == null && tag.getID3Tag() == null) {
                        tag.setIncorrectlyAlignedTag(true);
                    }
                    fc.position(fc.position() - (ChunkHeader.CHUNK_HEADER_SIZE - 1));
                    return true;

                case CORRUPT_ID3_LATE:
                    logger.severe(loggingName + " Found Corrupt id3 chunk, starting at Odd Location:" + chunkHeader.getID() + ":" + chunkHeader.getSize());
                    if (tag.getInfoTag() == null && tag.getID3Tag() == null) {
                        tag.setIncorrectlyAlignedTag(true);
                    }
                    fc.position(fc.position() - (ChunkHeader.CHUNK_HEADER_SIZE - 1));
                    return true;

                default:
                    tag.addChunkSummary(new ChunkSummary(chunkHeader.getID(), chunkHeader.getStartLocationInFile(), chunkHeader.getSize()));
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
            logger.config(loggingName + " Skipping chunk bytes:" + chunkHeader.getSize() + "for" + chunkHeader.getID());
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
