package org.jaudiotagger.audio.mp3;

import org.jaudiotagger.audio.exceptions.InvalidAudioFrameException;

import java.nio.ByteBuffer;

public class ByteArrayMP3AudioHeader extends MP3AudioHeader
{

    public ByteArrayMP3AudioHeader(byte[] fileBytes)
    {
        //References to Xing Header
        ByteBuffer header;

        // This is substantially faster than updating the filechannels position
        long filePointerCount = 0;

        // Read into Byte Buffer in Chunks
        ByteBuffer bb = ByteBuffer.wrap(fileBytes);

        boolean syncFound = false;
        do
        {
            if (MPEGFrameHeader.isMPEGFrame(bb))
            {
                try
                {

                    mp3FrameHeader = MPEGFrameHeader.parseMPEGHeader(bb);
                    syncFound = true;
                    if ((header = XingFrame.isXingFrame(bb, mp3FrameHeader))!=null)
                    {
                        try
                        {
                            // Parses Xing frame without modifying position of main buffer
                            mp3XingFrame = XingFrame.parseXingFrame(header);
                        }
                        catch (InvalidAudioFrameException ex)
                        {
                            // We Ignore because even if Xing Header is corrupted
                            // doesn't mean file is corrupted
                        }
                        break;
                    }
                    // There is a small but real chance that an unsynchronised ID3 Frame could fool the MPEG
                    // Parser into thinking it was an MPEG Header. If this happens the chances of the next bytes
                    // forming a Xing frame header are very remote. On the basis that most files these days have
                    // Xing headers we do an additional check for when an apparent frame header has been found
                    // but is not followed by a Xing Header:We check the next header this wont impose a large
                    // overhead because wont apply to most Mpegs anyway ( Most likely to occur if audio
                    // has an APIC frame which should have been unsynchronised but has not been) , or if the frame
                    // has been encoded with as Unicode LE because these have a BOM of 0xFF 0xFE
                    else
                    {
                        syncFound = isNextFrameValid(bb);
                        if (syncFound)
                        {
                            break;
                        }
                    }

                }
                catch (InvalidAudioFrameException ex)
                {
                    // We Ignore because likely to be incorrect sync bits ,
                    // will just continue in loop
                }
            }
            bb.position(bb.position() + 1);
            filePointerCount++;
        }
        while (!syncFound);

        setFileSize(fileBytes.length);
        setMp3StartByte(filePointerCount);
        setTimePerFrame();
        setNumberOfFrames();
        setTrackLength();
        setBitRate();
        setEncoder();
    }

    private boolean isNextFrameValid(ByteBuffer bb)
    {
        boolean result = false;
        int currentPosition = bb.position();

        bb.position(bb.position() + mp3FrameHeader.getFrameLength());
        if (MPEGFrameHeader.isMPEGFrame(bb))
        {
            try
            {
                MPEGFrameHeader.parseMPEGHeader(bb);
                MP3AudioHeader.logger.finer("Check next frame confirms is an audio header ");
                result = true;
            }
            catch (InvalidAudioFrameException ex)
            {
                MP3AudioHeader.logger.finer("Check next frame has identified this is not an audio header");
                result = false;
            }
        }
        // Set back to the start of the previous frame
        bb.position(currentPosition);
        return result;
    }

}
