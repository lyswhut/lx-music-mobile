package org.jaudiotagger.audio.mp3;

import org.jaudiotagger.audio.exceptions.InvalidAudioFrameException;

import java.nio.ByteBuffer;
import java.util.Arrays;

/**
 * Xing Frame
 *
 * <p>In some MP3s which variable bit rate the first frame in the file contains a special frame called a Xing Frame,
 * instead of audio data. This is used to store additional information about the file. The most important aspect for
 * this library is details allowing us to determine the bitrate of a Variable Bit Rate VBR file without having
 * to process the whole file.
 *
 * Xing VBR Tag data format is 120 bytes long
 * 4 bytes for Header Tag
 * 4 bytes for Header Flags
 * 4 bytes for FRAME SIZE
 * 4 bytes for AUDIO_SIZE
 * 100 bytes for entry (NUMTOCENTRIES)
 * 4 bytes for VBR SCALE. a VBR quality indicator: 0=best 100=worst
 *
 * It my then contain a Lame Frame ( a Lame frame is in essence an extended Xing Frame
 */
public class XingFrame
{

    //The offset into first frame varies based on the MPEG frame properties
    private static final int MPEG_VERSION_1_MODE_MONO_OFFSET = 21;
    private static final int MPEG_VERSION_1_MODE_STEREO_OFFSET = 36;
    private static final int MPEG_VERSION_2_MODE_MONO_OFFSET = 13;
    private static final int MPEG_VERSION_2_MODE_STEREO_OFFSET = 21;

    private static final int XING_HEADER_BUFFER_SIZE = 120;
    private static final int XING_IDENTIFIER_BUFFER_SIZE = 4;
    private static final int XING_FLAG_BUFFER_SIZE = 4;
    private static final int XING_FRAMECOUNT_BUFFER_SIZE = 4;
    private static final int XING_AUDIOSIZE_BUFFER_SIZE = 4;

    public static final int MAX_BUFFER_SIZE_NEEDED_TO_READ_XING = MPEG_VERSION_1_MODE_STEREO_OFFSET + XING_HEADER_BUFFER_SIZE + LameFrame.LAME_HEADER_BUFFER_SIZE;


    private static final int BYTE_1 = 0;
    private static final int BYTE_2 = 1;
    private static final int BYTE_3 = 2;
    private static final int BYTE_4 = 3;

    /**
     * Use when it is a VBR (Variable Bitrate) file
     */
    private static final byte[] XING_VBR_ID = {'X', 'i', 'n', 'g'};

    /**
     * Use when it is a CBR (Constant Bitrate) file
     */
    private static final byte[] XING_CBR_ID = {'I', 'n', 'f', 'o'};


    private ByteBuffer header;

    private boolean vbr = false;
    private boolean isFrameCountEnabled = false;
    private int frameCount = -1;
    private boolean isAudioSizeEnabled = false;
    private int audioSize = -1;
    private LameFrame lameFrame;

    /**
     * Read the Xing Properties from the buffer
     */
    private XingFrame(ByteBuffer header)
    {
        this.header=header;

        //Go to start of Buffer
        header.rewind();

        //Set Vbr
        setVbr();

        //Read Flags, only the fourth byte of interest to us
        byte flagBuffer[] = new byte[XING_FLAG_BUFFER_SIZE];
        header.get(flagBuffer);

        //Read FrameCount if flag set
        if ((flagBuffer[BYTE_4] & (byte) (1)) != 0)
        {
            setFrameCount();
        }

        //Read Size if flag set
        if ((flagBuffer[BYTE_4] & (byte) (1 << 1)) != 0)
        {
            setAudioSize();
        }

        //TODO TOC
        //TODO VBR Quality

        //Look for LAME Header as long as we have enough bytes to do it properly
        if (header.limit() >= XING_HEADER_BUFFER_SIZE + LameFrame.LAME_HEADER_BUFFER_SIZE)
        {
            header.position(XING_HEADER_BUFFER_SIZE);
            lameFrame = LameFrame.parseLameFrame(header);
        }
    }

    public LameFrame getLameFrame()
    {
        return lameFrame;
    }

    /**
     * Set whether or not VBR, (Xing can also be used for CBR though this is less useful)
     */
    private void setVbr()
    {
        //Is it VBR or CBR
        byte[] identifier = new byte[XING_IDENTIFIER_BUFFER_SIZE];
        header.get(identifier);
        if (Arrays.equals(identifier, XING_VBR_ID))
        {
            MP3File.logger.finest("Is Vbr");
            vbr = true;
        }
    }

    /**
     * Set count of frames
     */
    private void setFrameCount()
    {
        byte frameCountBuffer[] = new byte[XING_FRAMECOUNT_BUFFER_SIZE];
        header.get(frameCountBuffer);
        isFrameCountEnabled = true;
        frameCount = (frameCountBuffer[BYTE_1] << 24) & 0xFF000000 | (frameCountBuffer[BYTE_2] << 16) & 0x00FF0000 | (frameCountBuffer[BYTE_3] << 8) & 0x0000FF00 | frameCountBuffer[BYTE_4] & 0x000000FF;
    }

    /**
     * @return true if frameCount has been specified in header
     */
    public final boolean isFrameCountEnabled()
    {
        return isFrameCountEnabled;
    }

    /**
     * @return count of frames
     */
    public final int getFrameCount()
    {
        return frameCount;
    }

    /**
     * Set size of AudioData
     */
    private void setAudioSize()
    {
        byte frameSizeBuffer[] = new byte[XING_AUDIOSIZE_BUFFER_SIZE];
        header.get(frameSizeBuffer);
        isAudioSizeEnabled = true;
        audioSize = (frameSizeBuffer[BYTE_1] << 24) & 0xFF000000 | (frameSizeBuffer[BYTE_2] << 16) & 0x00FF0000 | (frameSizeBuffer[BYTE_3] << 8) & 0x0000FF00 | frameSizeBuffer[BYTE_4] & 0x000000FF;
    }

    /**
     * @return true if audioSize has been specified in header
     */
    public final boolean isAudioSizeEnabled()
    {
        return isAudioSizeEnabled;
    }

    /**
     * @return size of audio data in bytes
     */
    public final int getAudioSize()
    {
        return audioSize;
    }

    /**
     * Parse the XingFrame of an MP3File, cannot be called until we have validated that
     * this is a XingFrame
     *
     * @return
     * @throws InvalidAudioFrameException
     */
    public static XingFrame parseXingFrame(ByteBuffer header) throws InvalidAudioFrameException
    {
        XingFrame xingFrame = new XingFrame(header);
        return xingFrame;
    }

    /**
     * IS this a Xing frame
     *
     * @param bb
     * @param mpegFrameHeader
     * @return true if this is a Xing frame
     */
    public static ByteBuffer isXingFrame(ByteBuffer bb, MPEGFrameHeader mpegFrameHeader)
    {
        //We store this so can return here after scanning through buffer
        int startPosition = bb.position();

        //Get to Start of where Xing Frame Should be ( we dont know if it is one at this point)
        if (mpegFrameHeader.getVersion() == MPEGFrameHeader.VERSION_1)
        {
            if (mpegFrameHeader.getChannelMode() == MPEGFrameHeader.MODE_MONO)
            {
                bb.position(startPosition + MPEG_VERSION_1_MODE_MONO_OFFSET);
            }
            else
            {
                bb.position(startPosition + MPEG_VERSION_1_MODE_STEREO_OFFSET);
            }
        }
        //MPEGVersion 2 and 2.5
        else
        {
            if (mpegFrameHeader.getChannelMode() == MPEGFrameHeader.MODE_MONO)
            {
                bb.position(startPosition + MPEG_VERSION_2_MODE_MONO_OFFSET);
            }
            else
            {
                bb.position(startPosition + MPEG_VERSION_2_MODE_STEREO_OFFSET);
            }
        }

        //Create header from here
        ByteBuffer header = bb.slice();

        // Return Buffer to start Point
        bb.position(startPosition);

        //Check Identifier
        byte[] identifier = new byte[XING_IDENTIFIER_BUFFER_SIZE];
        header.get(identifier);
        if ((!Arrays.equals(identifier, XING_VBR_ID)) && (!Arrays.equals(identifier, XING_CBR_ID)))
        {
            return null;
        }
        MP3File.logger.finest("Found Xing Frame");
        return header;
    }

    /**
     * Is this XingFrame detailing a variable bit rate MPEG
     *
     * @return
     */
    public final boolean isVbr()
    {
        return vbr;
    }

    /**
     * @return a string representation
     */
    public String toString()
    {
        return "xingheader" + " vbr:" + vbr + " frameCountEnabled:" + isFrameCountEnabled + " frameCount:" + frameCount + " audioSizeEnabled:" + isAudioSizeEnabled + " audioFileSize:" + audioSize;
    }
}
