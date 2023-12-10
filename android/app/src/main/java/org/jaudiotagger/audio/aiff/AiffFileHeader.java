package org.jaudiotagger.audio.aiff;

import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.logging.Hex;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.logging.Logger;

import static java.nio.ByteOrder.BIG_ENDIAN;
import static org.jaudiotagger.audio.aiff.AiffType.AIFC;
import static org.jaudiotagger.audio.aiff.AiffType.AIFF;
import static org.jaudiotagger.audio.iff.IffHeaderChunk.HEADER_LENGTH;
import static org.jaudiotagger.audio.iff.IffHeaderChunk.TYPE_LENGTH;

/**
 * <p>
 *     Aiff File Header always consists of
 * </p>
 * <ul>
 *     <li>ckID - always FORM</li>
 *     <li>chSize - size in 4 bytes</li>
 *     <li>formType - currently either AIFF or AIFC, see {@link AiffType}</li>
 *     <li>chunks[] - an array of chunks</li>
 * </ul>
 */
public class AiffFileHeader
{
    private static final String FORM = "FORM";
    private static Logger logger = Logger.getLogger("org.jaudiotagger.audio.aiff.AudioFileHeader");

    /**
     * Reads the file header and registers the data (file type) with the given header.
     *
     * @param fc random access file
     * @param aiffAudioHeader the {@link org.jaudiotagger.audio.AudioHeader} we set the read data to
     * @param fileName
     * @return the number of bytes in the FORM chunk, i.e. the size of the payload
     * @throws IOException
     * @throws CannotReadException if the file is not a valid AIFF file
     */
    public long readHeader(FileChannel fc, final AiffAudioHeader aiffAudioHeader, String fileName) throws IOException, CannotReadException
    {
        final ByteBuffer headerData = ByteBuffer.allocateDirect(HEADER_LENGTH);
        headerData.order(BIG_ENDIAN);
        final int bytesRead = fc.read(headerData);
        headerData.position(0);

        if (bytesRead < HEADER_LENGTH)
        {
            throw new IOException(fileName + " AIFF:Unable to read required number of databytes read:" + bytesRead + ":required:" + HEADER_LENGTH);
        }

        final String signature = Utils.readFourBytesAsChars(headerData);
        if(FORM.equals(signature))
        {
            // read chunk size
            final long chunkSize  = headerData.getInt();
            logger.severe(fileName + " Reading AIFF header size:" + Hex.asDecAndHex(chunkSize));

            readFileType(headerData, aiffAudioHeader);
            // subtract the file type length from the chunk size to get remaining number of bytes
            return chunkSize - TYPE_LENGTH;
        }
        else
        {
            throw new CannotReadException(fileName + "Not an AIFF file: incorrect signature " + signature);
        }
    }

    /**
     * Reads the file type ({@link AiffType}).
     *
     * @throws CannotReadException if the file type is not supported
     */
    private void readFileType(final ByteBuffer bytes, final AiffAudioHeader aiffAudioHeader) throws IOException, CannotReadException {
        final String type = Utils.readFourBytesAsChars(bytes);
        if (AIFF.getCode().equals(type))
        {
            aiffAudioHeader.setFileType(AIFF);
        }
        else if (AIFC.getCode().equals(type))
        {
            aiffAudioHeader.setFileType(AIFC);
        }
        else
        {
            throw new CannotReadException("Invalid AIFF file: Incorrect file type info " + type);
        }
    }
}
