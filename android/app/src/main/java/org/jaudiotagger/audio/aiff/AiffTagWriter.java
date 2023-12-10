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
package org.jaudiotagger.audio.aiff;

import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.aiff.chunk.AiffChunkSummary;
import org.jaudiotagger.audio.aiff.chunk.AiffChunkType;
import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.exceptions.CannotWriteException;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.iff.Chunk;
import org.jaudiotagger.audio.iff.ChunkHeader;
import org.jaudiotagger.audio.iff.ChunkSummary;
import org.jaudiotagger.audio.iff.IffHeaderChunk;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.TagOptionSingleton;
import org.jaudiotagger.tag.aiff.AiffTag;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.util.logging.Logger;

import static org.jaudiotagger.audio.iff.IffHeaderChunk.SIGNATURE_LENGTH;
import static org.jaudiotagger.audio.iff.IffHeaderChunk.SIZE_LENGTH;


/**
 * Write Aiff Tag.
 */
public class AiffTagWriter {
    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.aiff");

    /**
     * Read existing metadata
     *
     * @param file
     * @return tags within Tag wrapper
     * @throws IOException
     * @throws CannotWriteException
     */
    private AiffTag getExistingMetadata(File file) throws IOException, CannotWriteException {
        try {
            //Find AiffTag (if any)
            AiffTagReader im = new AiffTagReader();
            return im.read(file);
        } catch (CannotReadException ex) {
            throw new CannotWriteException(file + " Failed to read file");
        }
    }

    /**
     * Seek in file to start of LIST Metadata chunk
     *
     * @param fc
     * @param existingTag
     * @throws IOException
     * @throws CannotWriteException
     */
    private ChunkHeader seekToStartOfMetadata(FileChannel fc, AiffTag existingTag, String fileName) throws IOException, CannotWriteException {
        fc.position(existingTag.getStartLocationInFileOfId3Chunk());
        final ChunkHeader chunkHeader = new ChunkHeader(ByteOrder.BIG_ENDIAN);
        chunkHeader.readHeader(fc);
        fc.position(fc.position() - ChunkHeader.CHUNK_HEADER_SIZE);

        if (!AiffChunkType.TAG.getCode().equals(chunkHeader.getID())) {
            throw new CannotWriteException(fileName + " Unable to find ID3 chunk at expected location:" + existingTag.getStartLocationInFileOfId3Chunk());
        }
        return chunkHeader;
    }

    /**
     * @param existingTag
     * @param fc
     * @return true if at end of file (also take into account padding byte)
     * @throws IOException
     */
    private boolean isAtEndOfFileAllowingForPaddingByte(AiffTag existingTag, FileChannel fc) throws IOException {
        return (
                (
                        existingTag.getID3Tag().getEndLocationInFile() == fc.size()
                )
                        ||
                        (
                                Utils.isOddLength(existingTag.getID3Tag().getEndLocationInFile())
                                        &&
                                        existingTag.getID3Tag().getEndLocationInFile() + 1 == fc.size()
                        )
        );
    }

    /**
     * Delete given {@link Tag} from file.
     *
     * @param tag  tag, must be instance of {@link AiffTag}
     * @param file
     * @throws IOException
     * @throws org.jaudiotagger.audio.exceptions.CannotWriteException
     */
    public void delete(final Tag tag, File file) throws CannotWriteException {
        RandomAccessFile raf = null;
        try {
            raf = new RandomAccessFile(file, "rw");
            FileChannel fc = raf.getChannel();
            logger.severe(file + " Deleting tag from file");
            final AiffTag existingTag = getExistingMetadata(file);

            if (existingTag.isExistingId3Tag() && existingTag.getID3Tag().getStartLocationInFile() != null) {
                ChunkHeader chunkHeader = seekToStartOfMetadata(fc, existingTag, file.toString());
                if (isAtEndOfFileAllowingForPaddingByte(existingTag, fc)) {
                    logger.severe(file + " Setting new length to:" + (existingTag.getStartLocationInFileOfId3Chunk()));
                    fc.truncate(existingTag.getStartLocationInFileOfId3Chunk());
                } else {
                    logger.severe(file + " Deleting tag chunk");
                    deleteTagChunk(fc, existingTag, chunkHeader, file.toString());
                }
                rewriteRiffHeaderSize(fc);
            }
            logger.severe(file + " Deleted tag from file");
        } catch (IOException ioe) {
            throw new CannotWriteException(file + ":" + ioe.getMessage());
        } finally {
            AudioFileIO.closeQuietly(raf);
        }
    }

    /**
     * <p>Deletes the given ID3-{@link Tag}/{@link Chunk} from the file by moving all following chunks up.</p>
     * <pre>
     * [chunk][-id3-][chunk][chunk]
     * [chunk] &lt;&lt;--- [chunk][chunk]
     * [chunk][chunk][chunk]
     * </pre>
     *
     * @param fc,            filechannel
     * @param existingTag    existing tag
     * @param tagChunkHeader existing chunk header for the tag
     * @throws IOException if something goes wrong
     */
    private void deleteTagChunk(FileChannel fc, final AiffTag existingTag, final ChunkHeader tagChunkHeader, String fileName) throws IOException {
        int lengthTagChunk = (int) tagChunkHeader.getSize() + ChunkHeader.CHUNK_HEADER_SIZE;
        if (Utils.isOddLength(lengthTagChunk)) {
            if (existingTag.getStartLocationInFileOfId3Chunk() + lengthTagChunk < fc.size()) {
                lengthTagChunk++;
            }
        }
        final long newLength = fc.size() - lengthTagChunk;
        logger.severe(fileName + " Size of id3 chunk to delete is:" + lengthTagChunk + ":Location:" + existingTag.getStartLocationInFileOfId3Chunk());

        // position for reading after the id3 tag
        fc.position(existingTag.getStartLocationInFileOfId3Chunk() + lengthTagChunk);

        deleteTagChunkUsingSmallByteBufferSegments(existingTag, fc, newLength, lengthTagChunk);
        // truncate the file after the last chunk
        logger.severe(fileName + " Setting new length to:" + newLength);
        fc.truncate(newLength);
    }

    /**
     * If Metadata tags are corrupted and no other tags later in the file then just truncate ID3 tags and start again
     *
     * @param fc
     * @param existingTag
     * @throws IOException
     */
    private void deleteRemainderOfFile(FileChannel fc, final AiffTag existingTag, String fileName) throws IOException {
        ChunkSummary precedingChunk = AiffChunkSummary.getChunkBeforeStartingMetadataTag(existingTag);
        if (!Utils.isOddLength(precedingChunk.getEndLocation())) {
            logger.severe(fileName + " Truncating corrupted ID3 tags from:" + (existingTag.getStartLocationInFileOfId3Chunk() - 1));
            fc.truncate(existingTag.getStartLocationInFileOfId3Chunk() - 1);
        } else {
            logger.severe(fileName + " Truncating corrupted ID3 tags from:" + (existingTag.getStartLocationInFileOfId3Chunk()));
            fc.truncate(existingTag.getStartLocationInFileOfId3Chunk());
        }
    }

    /**
     * The following seems to work on Windows but hangs on OSX!
     * Bug is filed <a href="https://bugs.openjdk.java.net/browse/JDK-8140241">here</a>.
     *
     * @param existingTag existing tag
     * @param channel     channel
     * @param newLength   new length
     * @throws IOException if something goes wrong
     */
    private void deleteTagChunkUsingChannelTransfer(final AiffTag existingTag, final FileChannel channel, final long newLength)
            throws IOException {
        long read;
        //Read from just after the ID3Chunk into the channel at where the ID3 chunk started, should usually only require one transfer
        //but put into loop in case multiple calls are required
        for (long position = existingTag.getStartLocationInFileOfId3Chunk();
             (read = channel.transferFrom(channel, position, newLength - position)) < newLength - position;
             position += read)
            ;//is this problem if loop called more than once do we need to update position of channel to modify
        //where write to ?
    }

    /**
     * Use ByteBuffers to copy a 4mb chunk, write the chunk and repeat until the rest of the file after the ID3 tag
     * is rewritten
     *
     * @param existingTag    existing tag
     * @param channel        channel
     * @param newLength      new length
     * @param lengthTagChunk length tag chunk
     * @throws IOException if something goes wrong
     */
    // TODO: arguments are not used, position is implicit
    private void deleteTagChunkUsingSmallByteBufferSegments(final AiffTag existingTag, final FileChannel channel, final long newLength, final long lengthTagChunk)
            throws IOException {
        final ByteBuffer buffer = ByteBuffer.allocateDirect((int) TagOptionSingleton.getInstance().getWriteChunkSize());
        while (channel.read(buffer) >= 0 || buffer.position() != 0) {
            buffer.flip();
            final long readPosition = channel.position();
            channel.position(readPosition - lengthTagChunk - buffer.limit());
            channel.write(buffer);
            channel.position(readPosition);
            buffer.compact();
        }
    }

    /**
     * @param tag
     * @param file
     * @throws CannotWriteException
     * @throws IOException
     */
    public void write(final Tag tag, File file) throws CannotWriteException {
        logger.severe(file + " Writing Aiff tag to file");
        AiffTag existingTag = null;
        try {
            existingTag = getExistingMetadata(file);
        } catch (IOException ioe) {
            throw new CannotWriteException(file + ":" + ioe.getMessage());
        }

        RandomAccessFile raf = null;
        try {
            raf = new RandomAccessFile(file, "rw");
            FileChannel fc = raf.getChannel();
            long existingFileLength = fc.size();

            final AiffTag aiffTag = (AiffTag) tag;
            final ByteBuffer bb = convert(aiffTag, existingTag);

            //Replacing ID3 tag
            if (existingTag.isExistingId3Tag() && existingTag.getID3Tag().getStartLocationInFile() != null) {
                //Usual case
                if (!existingTag.isIncorrectlyAlignedTag()) {
                    final ChunkHeader chunkHeader = seekToStartOfMetadata(fc, existingTag, file.toString());
                    logger.info(file + "Current Space allocated:" + existingTag.getSizeOfID3TagOnly() + ":NewTagRequires:" + bb.limit());

                    //Usual case ID3 is last chunk
                    if (isAtEndOfFileAllowingForPaddingByte(existingTag, fc)) {
                        writeDataToFile(fc, bb);
                    }
                    //Unusual Case where ID3 is not last chunk
                    else {
                        deleteTagChunk(fc, existingTag, chunkHeader, file.toString());
                        fc.position(fc.size());
                        writeExtraByteIfChunkOddSize(fc, fc.size());
                        writeDataToFile(fc, bb);
                    }
                }
                //Existing ID3 tag is incorrectly aligned so if we can lets delete it and any subsequentially added
                //ID3 tags as we only want one ID3 tag.
                else if (AiffChunkSummary.isOnlyMetadataTagsAfterStartingMetadataTag(existingTag)) {
                    deleteRemainderOfFile(fc, existingTag, file.toString());
                    fc.position(fc.size());
                    writeExtraByteIfChunkOddSize(fc, fc.size());
                    writeDataToFile(fc, bb);
                } else {
                    throw new CannotWriteException(file + " Metadata tags are corrupted and not at end of file so cannot be fixed");
                }
            }
            //New Tag
            else {
                fc.position(fc.size());
                if (Utils.isOddLength(fc.size())) {
                    fc.write(ByteBuffer.allocateDirect(1));
                }
                writeDataToFile(fc, bb);
            }

            if (existingFileLength != fc.size()) {
                rewriteRiffHeaderSize(fc);
            }
        } catch (IOException ioe) {
            throw new CannotWriteException(file + ":" + ioe.getMessage());
        } finally {
            AudioFileIO.closeQuietly(raf);
        }
    }

    /**
     * Rewrite RAF header to reflect new file length
     *
     * @param fc
     * @throws IOException
     */
    private void rewriteRiffHeaderSize(FileChannel fc) throws IOException {

        fc.position(IffHeaderChunk.SIGNATURE_LENGTH);
        ByteBuffer bb = ByteBuffer.allocateDirect(IffHeaderChunk.SIZE_LENGTH);
        bb.order(ByteOrder.BIG_ENDIAN);
        int size = ((int) fc.size()) - SIGNATURE_LENGTH - SIZE_LENGTH;
        bb.putInt(size);
        bb.flip();
        fc.write(bb);
    }

    /**
     * Writes data as a {@link AiffChunkType#TAG} chunk to the file.
     *
     * @param fc filechannel
     * @param bb data to write
     * @throws IOException
     */
    private void writeDataToFile(FileChannel fc, final ByteBuffer bb)
            throws IOException {
        final ChunkHeader ch = new ChunkHeader(ByteOrder.BIG_ENDIAN);
        ch.setID(AiffChunkType.TAG.getCode());
        ch.setSize(bb.limit());
        fc.write(ch.writeHeader());
        fc.write(bb);
        writeExtraByteIfChunkOddSize(fc, bb.limit());
    }

    /**
     * Chunk must also start on an even byte so if our chunksize is odd we need
     * to write another byte. This should never happen as ID3Tag is now amended
     * to ensure always write padding byte if needed to stop it being odd sized
     * but we keep check in just incase.
     *
     * @param fc
     * @param size
     * @throws IOException
     */
    private void writeExtraByteIfChunkOddSize(FileChannel fc, long size)
            throws IOException {
        if (Utils.isOddLength(size)) {
            fc.write(ByteBuffer.allocateDirect(1));
        }
    }

    /**
     * Converts tag to {@link ByteBuffer}.
     *
     * @param tag         tag
     * @param existingTag
     * @return byte buffer containing the tag data
     * @throws UnsupportedEncodingException
     */
    public ByteBuffer convert(final AiffTag tag, AiffTag existingTag) throws UnsupportedEncodingException {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            long existingTagSize = existingTag.getSizeOfID3TagOnly();

            //If existingTag is uneven size lets make it even
            if (existingTagSize > 0) {
                if ((existingTagSize & 1) != 0) {
                    existingTagSize++;
                }
            }

            //Write Tag to buffer
            tag.getID3Tag().write(baos, (int) existingTagSize);

            //If the tag is now odd because we needed to increase size and the data made it odd sized
            //we redo adding a padding byte to make it even
            if ((baos.toByteArray().length & 1) != 0) {
                int newSize = baos.toByteArray().length + 1;
                baos = new ByteArrayOutputStream();
                tag.getID3Tag().write(baos, newSize);
            }
            final ByteBuffer buf = ByteBuffer.wrap(baos.toByteArray());
            buf.rewind();
            return buf;
        } catch (IOException ioe) {
            //Should never happen as not writing to file at this point
            throw new RuntimeException(ioe);
        }
    }
}

