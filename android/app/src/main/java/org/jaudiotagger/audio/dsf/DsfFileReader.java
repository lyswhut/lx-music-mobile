/*
 * Created on 03.05.2015
 * Author: Veselin Markov.
 */
package org.jaudiotagger.audio.dsf;

import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.generic.AudioFileReader2;
import org.jaudiotagger.audio.generic.GenericAudioHeader;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.iff.IffHeaderChunk;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.TagException;
import org.jaudiotagger.tag.id3.AbstractID3v2Tag;
import org.jaudiotagger.tag.id3.ID3v22Tag;
import org.jaudiotagger.tag.id3.ID3v23Tag;
import org.jaudiotagger.tag.id3.ID3v24Tag;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.logging.Level;

import static org.jaudiotagger.audio.dsf.DsdChunk.CHUNKSIZE_LENGTH;

/**
 * Reads the ID3 Tags as specified by <a href=
 * "http://dsd-guide.com/sites/default/files/white-papers/DSFFileFormatSpec_E.pdf"
 * /> DSFFileFormatSpec_E.pdf </a>.
 *
 * @author Veselin Markov (veselin_m84 a_t yahoo.com)
 */
public class DsfFileReader extends AudioFileReader2 {

    @Override
    protected GenericAudioHeader getEncodingInfo(File file) throws CannotReadException, IOException {
        RandomAccessFile raf = null;
        try {
            raf = new RandomAccessFile(file, "r");
            FileChannel fc = raf.getChannel();
            DsdChunk dsd = DsdChunk.readChunk(Utils.readFileDataIntoBufferLE(fc, DsdChunk.DSD_HEADER_LENGTH));
            if (dsd != null) {
                ByteBuffer fmtChunkBuffer = Utils.readFileDataIntoBufferLE(fc, IffHeaderChunk.SIGNATURE_LENGTH + CHUNKSIZE_LENGTH);
                FmtChunk fmt = FmtChunk.readChunkHeader(fmtChunkBuffer);
                if (fmt != null) {
                    return fmt.readChunkData(dsd, fc);
                } else {
                    throw new CannotReadException(file + " Not a valid dsf file. Content does not include 'fmt ' chunk");
                }
            } else {
                throw new CannotReadException(file + " Not a valid dsf file. Content does not start with 'DSD '");
            }
        } finally {
            AudioFileIO.closeQuietly(raf);
        }
    }

    @Override
    protected Tag getTag(File file) throws CannotReadException, IOException {
        RandomAccessFile raf = null;
        try {
            raf = new RandomAccessFile(file, "r");
            FileChannel fc = raf.getChannel();
            DsdChunk dsd = DsdChunk.readChunk(Utils.readFileDataIntoBufferLE(fc, DsdChunk.DSD_HEADER_LENGTH));
            if (dsd != null) {
                return readTag(fc, dsd, file.toString());
            } else {
                throw new CannotReadException(file + " Not a valid dsf file. Content does not start with 'DSD '.");
            }
        } finally {
            AudioFileIO.closeQuietly(raf);
        }
    }

    /**
     * Reads the ID3v2 tag starting at the {@code tagOffset} position in the
     * supplied file.
     *
     * @param fc       the filechannel from which to read
     * @param dsd      the dsd chunk
     * @param fileName
     * @return the read tag or an empty tag if something went wrong. Never
     * <code>null</code>.
     * @throws IOException if cannot read file.
     */
    private Tag readTag(FileChannel fc, DsdChunk dsd, String fileName) throws CannotReadException, IOException {
        if (dsd.getMetadataOffset() > 0) {
            fc.position(dsd.getMetadataOffset());
            ID3Chunk id3Chunk = ID3Chunk.readChunk(Utils.readFileDataIntoBufferLE(fc, (int) (fc.size() - fc.position())));
            if (id3Chunk != null) {
                int version = id3Chunk.getDataBuffer().get(AbstractID3v2Tag.FIELD_TAG_MAJOR_VERSION_POS);
                try {
                    switch (version) {
                        case ID3v22Tag.MAJOR_VERSION:
                            return new ID3v22Tag(id3Chunk.getDataBuffer(), "");
                        case ID3v23Tag.MAJOR_VERSION:
                            return new ID3v23Tag(id3Chunk.getDataBuffer(), "");
                        case ID3v24Tag.MAJOR_VERSION:
                            return new ID3v24Tag(id3Chunk.getDataBuffer(), "");
                        default:
                            logger.log(Level.WARNING, fileName + " Unknown ID3v2 version " + version + ". Returning an empty ID3v2 Tag.");
                            return null;
                    }
                } catch (TagException e) {
                    throw new CannotReadException(fileName + " Could not read ID3v2 tag:corruption");
                }
            } else {
                logger.log(Level.WARNING, fileName + " No existing ID3 tag(1)");
                return null;
            }
        } else {
            logger.log(Level.WARNING, fileName + " No existing ID3 tag(2)");
            return null;
        }
    }
}
