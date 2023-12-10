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
package org.jaudiotagger.audio.flac;

import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.exceptions.CannotWriteException;
import org.jaudiotagger.audio.flac.metadatablock.*;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.TagOptionSingleton;
import org.jaudiotagger.tag.flac.FlacTag;
import org.jaudiotagger.utils.DirectByteBufferUtils;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileChannel.MapMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.logging.Level;
import java.util.logging.Logger;

import static org.jaudiotagger.utils.PrimitiveUtils.safeLongToInt;


/**
 * Write Flac Tag
 */
public class FlacTagWriter {
    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.flac");
    private FlacTagCreator tc = new FlacTagCreator();

    /**
     * @param tag
     * @param file
     * @throws IOException
     * @throws CannotWriteException
     */
    public void delete(Tag tag, File file) throws CannotWriteException {
        //This will save the file without any Comment or PictureData blocks  
        FlacTag emptyTag = new FlacTag(null, new ArrayList<MetadataBlockDataPicture>());
        write(emptyTag, file);
    }

    private static class MetadataBlockInfo {
        private MetadataBlock streamInfoBlock;
        private List<MetadataBlock> metadataBlockPadding = new ArrayList<MetadataBlock>(1);
        private List<MetadataBlock> metadataBlockApplication = new ArrayList<MetadataBlock>(1);
        private List<MetadataBlock> metadataBlockSeekTable = new ArrayList<MetadataBlock>(1);
        private List<MetadataBlock> metadataBlockCueSheet = new ArrayList<MetadataBlock>(1);
    }

    /**
     * @param tag
     * @param file
     * @throws CannotWriteException
     * @throws IOException
     */
    public void write(Tag tag, File file) throws CannotWriteException {
        logger.config(file + " Writing tag");
        RandomAccessFile raf = null;
        try {
            raf = new RandomAccessFile(file, "rw");
            FileChannel fc = raf.getChannel();
            MetadataBlockInfo blockInfo = new MetadataBlockInfo();

            //Read existing data
            FlacStreamReader flacStream = new FlacStreamReader(fc, file.toString() + " ");
            try {
                flacStream.findStream();
            } catch (CannotReadException cre) {
                throw new CannotWriteException(cre.getMessage());
            }

            boolean isLastBlock = false;
            while (!isLastBlock) {
                try {
                    MetadataBlockHeader mbh = MetadataBlockHeader.readHeader(fc);
                    if (mbh.getBlockType() != null) {
                        switch (mbh.getBlockType()) {
                            case STREAMINFO: {
                                blockInfo.streamInfoBlock = new MetadataBlock(mbh, new MetadataBlockDataStreamInfo(mbh, fc));
                                break;
                            }

                            case VORBIS_COMMENT:
                            case PADDING:
                            case PICTURE: {
                                //All these will be replaced by the new metadata so we just treat as padding in order
                                //to determine how much space is already allocated in the file
                                fc.position(fc.position() + mbh.getDataLength());
                                MetadataBlockData mbd = new MetadataBlockDataPadding(mbh.getDataLength());
                                blockInfo.metadataBlockPadding.add(new MetadataBlock(mbh, mbd));
                                break;
                            }
                            case APPLICATION: {
                                MetadataBlockData mbd = new MetadataBlockDataApplication(mbh, fc);
                                blockInfo.metadataBlockApplication.add(new MetadataBlock(mbh, mbd));
                                break;
                            }
                            case SEEKTABLE: {
                                MetadataBlockData mbd = new MetadataBlockDataSeekTable(mbh, fc);
                                blockInfo.metadataBlockSeekTable.add(new MetadataBlock(mbh, mbd));
                                break;
                            }
                            case CUESHEET: {
                                MetadataBlockData mbd = new MetadataBlockDataCueSheet(mbh, fc);
                                blockInfo.metadataBlockCueSheet.add(new MetadataBlock(mbh, mbd));
                                break;
                            }
                            default: {
                                //What are the consequences of doing this
                                fc.position(fc.position() + mbh.getDataLength());
                                break;
                            }
                        }
                    }
                    isLastBlock = mbh.isLastBlock();
                } catch (CannotReadException cre) {
                    throw new CannotWriteException(cre.getMessage());
                }
            }

            //Number of bytes in the existing file available before audio data
            int availableRoom = computeAvailableRoom(blockInfo);

            //Minimum Size of the New tag data without padding
            int newTagSize = tc.convert(tag).limit();

            //Other blocks required size
            int otherBlocksRequiredSize = computeNeededRoom(blockInfo);

            //Number of bytes required for new tagdata and other metadata blocks
            int neededRoom = newTagSize + otherBlocksRequiredSize;

            //Go to start of Flac within file
            fc.position(flacStream.getStartOfFlacInFile());

            logger.config(file + ":Writing tag available bytes:" + availableRoom + ":needed bytes:" + neededRoom);

            //There is enough room to fit the tag without moving the audio just need to
            //adjust padding accordingly need to allow space for padding header if padding required
            if ((availableRoom == neededRoom) || (availableRoom > neededRoom + MetadataBlockHeader.HEADER_LENGTH)) {
                logger.config(file + ":Room to Rewrite");
                //Jump over Id3 (if exists) and flac header
                fc.position(flacStream.getStartOfFlacInFile() + FlacStreamReader.FLAC_STREAM_IDENTIFIER_LENGTH);

                //Write stream info and other non metadata blocks
                writeOtherMetadataBlocks(fc, blockInfo);

                //Write tag (and padding)
                fc.write(tc.convert(tag, availableRoom - neededRoom));
            }
            //Need to move audio
            else {
                logger.config(file + ":Audio must be shifted " + "NewTagSize:" + newTagSize + ":AvailableRoom:" + availableRoom + ":MinimumAdditionalRoomRequired:" + (neededRoom - availableRoom));
                //As we are having to both anyway may as well put in the default padding
                insertUsingChunks(file, tag, fc, blockInfo, flacStream, neededRoom + FlacTagCreator.DEFAULT_PADDING, availableRoom);
            }
        } catch (IOException ioe) {
            logger.log(Level.SEVERE, ioe.getMessage(), ioe);
            throw new CannotWriteException(file + ":" + ioe.getMessage());
        } finally {
            AudioFileIO.closeQuietly(raf);
        }
    }

    /**
     * Insert metadata into space that is not large enough, so have to shift existing audio data by copying into buffer
     * and the reinserting after adding the metadata
     * <p>
     * However this method requires a contiguous amount of memory equal to the size of the audio to be available and this
     * can cause a failure on low memory systems, so no longer used.
     *
     * @param tag
     * @param fc
     * @param blockInfo
     * @param flacStream
     * @param availableRoom
     * @throws IOException
     * @throws UnsupportedEncodingException
     */
    private void insertUsingDirectBuffer(File file, Tag tag, FileChannel fc, MetadataBlockInfo blockInfo, FlacStreamReader flacStream, int availableRoom) throws IOException {
        //Find end of metadata blocks (start of Audio), i.e start of Flac + 4 bytes for 'fLaC', 4 bytes for streaminfo header and
        //34 bytes for streaminfo and then size of all the other existing blocks
        fc.position(flacStream.getStartOfFlacInFile()
                + FlacStreamReader.FLAC_STREAM_IDENTIFIER_LENGTH
                + MetadataBlockHeader.HEADER_LENGTH
                + MetadataBlockDataStreamInfo.STREAM_INFO_DATA_LENGTH
                + availableRoom);

        //And copy into Buffer, because direct buffer doesnt use heap
        ByteBuffer audioData = ByteBuffer.allocateDirect((int) (fc.size() - fc.position()));
        fc.read(audioData);
        audioData.flip();

        //Jump over Id3 (if exists) Flac Header
        fc.position(flacStream.getStartOfFlacInFile() + FlacStreamReader.FLAC_STREAM_IDENTIFIER_LENGTH);
        writeOtherMetadataBlocks(fc, blockInfo);

        //Write tag (and add some default padding)
        fc.write(tc.convert(tag, FlacTagCreator.DEFAULT_PADDING));

        //Write Audio
        fc.write(audioData);
    }


    /**
     * Insert metadata into space that is not large enough
     * <p>
     * We do this by reading/writing chunks of data allowing it to work on low memory systems
     * <p>
     * Chunk size defined by TagOptionSingleton.getInstance().getWriteChunkSize()
     *
     * @param tag
     * @param fc
     * @param blockInfo
     * @param flacStream
     * @param neededRoom
     * @param availableRoom
     * @throws IOException
     * @throws UnsupportedEncodingException
     */
    private void insertUsingChunks(File file, Tag tag, FileChannel fc, MetadataBlockInfo blockInfo, FlacStreamReader flacStream, int neededRoom, int availableRoom) throws IOException, UnsupportedEncodingException {
        long originalFileSize = fc.size();

        //Find end of metadata blocks (start of Audio), i.e start of Flac + 4 bytes for 'fLaC', 4 bytes for streaminfo header and
        //34 bytes for streaminfo and then size of all the other existing blocks
        long audioStart = flacStream.getStartOfFlacInFile()
                + FlacStreamReader.FLAC_STREAM_IDENTIFIER_LENGTH
                + MetadataBlockHeader.HEADER_LENGTH
                + MetadataBlockDataStreamInfo.STREAM_INFO_DATA_LENGTH
                + availableRoom;

        //Extra Space Required for larger metadata block
        int extraSpaceRequired = neededRoom - availableRoom;
        logger.config(file + " Audio needs shifting:" + extraSpaceRequired);

        //ChunkSize must be at least as large as the extra space required to write the metadata
        int chunkSize = (int) TagOptionSingleton.getInstance().getWriteChunkSize();
        if (chunkSize < extraSpaceRequired) {
            chunkSize = extraSpaceRequired;
        }

        Queue<ByteBuffer> queue = new LinkedBlockingQueue<ByteBuffer>();

        //Read first chunk of audio
        fc.position(audioStart);
        {
            ByteBuffer audioBuffer = ByteBuffer.allocateDirect(chunkSize);
            fc.read(audioBuffer);
            audioBuffer.flip();
            queue.add(audioBuffer);
        }
        long readPosition = fc.position();

        //Jump over Id3 (if exists) and Flac Header
        fc.position(flacStream.getStartOfFlacInFile() + FlacStreamReader.FLAC_STREAM_IDENTIFIER_LENGTH);
        writeOtherMetadataBlocks(fc, blockInfo);
        fc.write(tc.convert(tag, FlacTagCreator.DEFAULT_PADDING));
        long writePosition = fc.position();


        fc.position(readPosition);
        while (fc.position() < originalFileSize) {
            //Read next chunk
            ByteBuffer audioBuffer = ByteBuffer.allocateDirect(chunkSize);
            fc.read(audioBuffer);
            readPosition = fc.position();
            audioBuffer.flip();
            queue.add(audioBuffer);

            //Write previous chunk
            fc.position(writePosition);
            fc.write(queue.remove());
            writePosition = fc.position();

            fc.position(readPosition);
        }
        fc.position(writePosition);
        fc.write(queue.remove());
    }

    /**
     * Insert new metadata into file by using memory mapped file, and if fails write in chunks
     * <p>
     * But this is problematic on 32bit systems for large flac files may not be able to map a contiguous address space large enough
     * for a large audio size , so no longer used since better to go straight to using chunks
     *
     * @param tag
     * @param fc
     * @param blockInfo
     * @param flacStream
     * @param neededRoom
     * @param availableRoom
     * @throws IOException
     * @throws UnsupportedEncodingException
     */
    private void insertTagAndShift(File file, Tag tag, FileChannel fc, MetadataBlockInfo blockInfo, FlacStreamReader flacStream, int neededRoom, int availableRoom) throws IOException, UnsupportedEncodingException {
        int headerLength = flacStream.getStartOfFlacInFile() + FlacStreamReader.FLAC_STREAM_IDENTIFIER_LENGTH + MetadataBlockHeader.HEADER_LENGTH // this should be the length of the block header for the stream info
                + MetadataBlockDataStreamInfo.STREAM_INFO_DATA_LENGTH;
        long targetSizeBeforeAudioData = headerLength + neededRoom + FlacTagCreator.DEFAULT_PADDING;
        long remainderTargetSize = fc.size() - (headerLength + availableRoom);
        long totalTargetSize = targetSizeBeforeAudioData + remainderTargetSize;

        MappedByteBuffer mappedFile = null;
        try {
            //Use ByteBuffer
            mappedFile = fc.map(MapMode.READ_WRITE, 0, totalTargetSize);
            insertTagAndShiftViaMappedByteBuffer(tag, mappedFile, fc, targetSizeBeforeAudioData, totalTargetSize, blockInfo, flacStream, neededRoom, availableRoom);
        } catch (IOException ioe) {
            //#175: Flac Map error on write
            if (mappedFile == null) {
                insertUsingChunks(file, tag, fc, blockInfo, flacStream, neededRoom + FlacTagCreator.DEFAULT_PADDING, availableRoom);
            } else {
                logger.log(Level.SEVERE, ioe.getMessage(), ioe);
                throw ioe;
            }
        }
    }

    /**
     * Insert new metadata into file by using memory mapped file
     * <p>
     * But this is problematic on 32bit systems for large flac files may not be able to map a contiguous address space large enough
     * for a large audio size , so no longer used
     *
     * @param tag
     * @param mappedFile
     * @param fc
     * @param targetSizeBeforeAudioData
     * @param totalTargetSize
     * @param blockInfo
     * @param flacStream
     * @param neededRoom
     * @param availableRoom
     * @throws IOException
     * @throws UnsupportedEncodingException
     */
    private void insertTagAndShiftViaMappedByteBuffer(Tag tag, MappedByteBuffer mappedFile, FileChannel fc, long targetSizeBeforeAudioData, long totalTargetSize, MetadataBlockInfo blockInfo, FlacStreamReader flacStream, int neededRoom, int availableRoom) throws IOException, UnsupportedEncodingException {
        //Find end of metadata blacks (start of Audio)
        int currentEndOfFilePosition = safeLongToInt(fc.size());
        /*
         * First shift data to the 'right' of the tag to the end of the file, whose position is currentEndOfTagsPosition
         */
        int currentEndOfTagsPosition = safeLongToInt((targetSizeBeforeAudioData - FlacTagCreator.DEFAULT_PADDING) - neededRoom + availableRoom);
        int lengthDiff = safeLongToInt(totalTargetSize - currentEndOfFilePosition);
        final int BLOCK_SIZE = safeLongToInt(TagOptionSingleton.getInstance().getWriteChunkSize());
        int currentPos = currentEndOfFilePosition - BLOCK_SIZE;
        byte[] buffer = new byte[BLOCK_SIZE];
        for (; currentPos >= currentEndOfTagsPosition; currentPos -= BLOCK_SIZE) {
            mappedFile.position(currentPos);
            mappedFile.get(buffer, 0, BLOCK_SIZE);
            mappedFile.position(currentPos + lengthDiff);
            mappedFile.put(buffer, 0, BLOCK_SIZE);
        }

        /*
         * Final movement of start bytes. This also covers cases where BLOCK_SIZE is larger than the audio data
         */
        int remainder = (currentPos + BLOCK_SIZE) - currentEndOfTagsPosition;
        if (remainder > 0) {
            mappedFile.position(currentEndOfTagsPosition);
            mappedFile.get(buffer, 0, remainder);
            mappedFile.position(currentEndOfTagsPosition + lengthDiff);
            mappedFile.put(buffer, 0, remainder);
        }

        DirectByteBufferUtils.release(mappedFile);

        /* Now overwrite the tag */
        writeTags(tag, fc, blockInfo, flacStream);
    }

    private void writeTags(Tag tag, FileChannel fc, MetadataBlockInfo blockInfo, FlacStreamReader flacStream) throws IOException, UnsupportedEncodingException {
        //Jump over Id3 (if exists) Flac Header
        fc.position(flacStream.getStartOfFlacInFile() + FlacStreamReader.FLAC_STREAM_IDENTIFIER_LENGTH);
        writeOtherMetadataBlocks(fc, blockInfo);

        //Write tag (and add some default padding)
        fc.write(tc.convert(tag, FlacTagCreator.DEFAULT_PADDING));
    }

    /**
     * Write all metadata blocks except for the the actual tag metadata
     * <p/>
     * We always write blocks in this order
     *
     * @param fc
     * @param blockInfo
     * @throws IOException
     */
    private void writeOtherMetadataBlocks(FileChannel fc, MetadataBlockInfo blockInfo) throws IOException {
        //Write StreamInfo, we always write this first even if wasn't first in original spec
        fc.write(ByteBuffer.wrap(blockInfo.streamInfoBlock.getHeader().getBytesWithoutIsLastBlockFlag()));
        fc.write(blockInfo.streamInfoBlock.getData().getBytes());

        //Write Application Blocks
        for (MetadataBlock aMetadataBlockApplication : blockInfo.metadataBlockApplication) {
            fc.write(ByteBuffer.wrap(aMetadataBlockApplication.getHeader().getBytesWithoutIsLastBlockFlag()));
            fc.write(aMetadataBlockApplication.getData().getBytes());
        }

        //Write Seek Table Blocks
        for (MetadataBlock aMetadataBlockSeekTable : blockInfo.metadataBlockSeekTable) {
            fc.write(ByteBuffer.wrap(aMetadataBlockSeekTable.getHeader().getBytesWithoutIsLastBlockFlag()));
            fc.write(aMetadataBlockSeekTable.getData().getBytes());
        }

        //Write Cue sheet Blocks
        for (MetadataBlock aMetadataBlockCueSheet : blockInfo.metadataBlockCueSheet) {
            fc.write(ByteBuffer.wrap(aMetadataBlockCueSheet.getHeader().getBytesWithoutIsLastBlockFlag()));
            fc.write(aMetadataBlockCueSheet.getData().getBytes());
        }
    }

    /**
     * @param blockInfo
     * @return space currently available for writing all Flac metadatablocks except for StreamInfo which is fixed size
     */
    private int computeAvailableRoom(MetadataBlockInfo blockInfo) {
        int length = 0;

        for (MetadataBlock aMetadataBlockApplication : blockInfo.metadataBlockApplication) {
            length += aMetadataBlockApplication.getLength();
        }

        for (MetadataBlock aMetadataBlockSeekTable : blockInfo.metadataBlockSeekTable) {
            length += aMetadataBlockSeekTable.getLength();
        }

        for (MetadataBlock aMetadataBlockCueSheet : blockInfo.metadataBlockCueSheet) {
            length += aMetadataBlockCueSheet.getLength();
        }

        //Note when reading metadata has been put into padding as well for purposes of write
        for (MetadataBlock aMetadataBlockPadding : blockInfo.metadataBlockPadding) {
            length += aMetadataBlockPadding.getLength();
        }

        return length;
    }

    /**
     * @param blockInfo
     * @return space required to write the metadata blocks that are part of Flac but are not part of tagdata
     * in the normal sense.
     */
    private int computeNeededRoom(MetadataBlockInfo blockInfo) {
        int length = 0;

        for (MetadataBlock aMetadataBlockApplication : blockInfo.metadataBlockApplication) {
            length += aMetadataBlockApplication.getLength();
        }

        for (MetadataBlock aMetadataBlockSeekTable : blockInfo.metadataBlockSeekTable) {
            length += aMetadataBlockSeekTable.getLength();
        }

        for (MetadataBlock aMetadataBlockCueSheet : blockInfo.metadataBlockCueSheet) {
            length += aMetadataBlockCueSheet.getLength();
        }

        return length;
    }
}

