package org.jaudiotagger.audio.flac;

import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.id3.AbstractID3v2Tag;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.logging.Logger;

/**
 * Flac Stream
 *
 * Reader files and identifies if this is in fact a flac stream
 */
public class FlacStreamReader
{
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.flac");

    public static final int FLAC_STREAM_IDENTIFIER_LENGTH = 4;
    public static final String FLAC_STREAM_IDENTIFIER = "fLaC";

    private FileChannel fc;
    private String loggingName;
    private int startOfFlacInFile;

    /**
     * Create instance for holding stream info
     * @param fc
     * @param loggingName
     */
    public FlacStreamReader(FileChannel fc, String loggingName)
    {
        this.fc = fc;
        this.loggingName =loggingName;
    }

    /**
     * Reads the stream block to ensure it is a flac file
     *
     * @throws IOException
     * @throws CannotReadException
     */
    public void findStream() throws IOException, CannotReadException
    {
        //Begins tag parsing
        if (fc.size() == 0)
        {
            //Empty File
            throw new CannotReadException("Error: File empty"+ " " + loggingName);
        }
        fc.position(0);

        //FLAC Stream at start
        if (isFlacHeader())
        {
            startOfFlacInFile = 0;
            return;
        }

        //Ok maybe there is an ID3v24tag first
        if (isId3v2Tag())
        {
            startOfFlacInFile = (int) (fc.position() - FLAC_STREAM_IDENTIFIER_LENGTH);
            return;
        }
        throw new CannotReadException(loggingName + ErrorMessage.FLAC_NO_FLAC_HEADER_FOUND.getMsg());
    }

    private boolean isId3v2Tag() throws IOException
    {
        fc.position(0);
        if(AbstractID3v2Tag.isId3Tag(fc))
        {
            logger.warning(loggingName + ErrorMessage.FLAC_CONTAINS_ID3TAG.getMsg(fc.position()));
            //FLAC Stream immediately after end of id3 tag
            if (isFlacHeader())
            {
                return true;
            }
        }
        return false;
    }

    private boolean isFlacHeader() throws IOException
    {
        ByteBuffer headerBuffer = Utils.readFileDataIntoBufferBE(fc, FLAC_STREAM_IDENTIFIER_LENGTH);
        return Utils.readFourBytesAsChars(headerBuffer).equals(FLAC_STREAM_IDENTIFIER);
    }

    /**
     * Usually flac header is at start of file, but unofficially an ID3 tag is allowed at the start of the file.
     *
     * @return the start of the Flac within file
     */
    public int getStartOfFlacInFile()
    {
        return startOfFlacInFile;
    }
}
