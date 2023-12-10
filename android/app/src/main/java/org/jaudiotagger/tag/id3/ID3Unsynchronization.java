package org.jaudiotagger.tag.id3;

import org.jaudiotagger.audio.mp3.MPEGFrameHeader;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Performs unsynchronization and synchronization tasks on a buffer.
 *
 * Is currently required for V23Tags and V24Frames
 */
public class ID3Unsynchronization
{
    //Logger
    public static Logger logger = Logger.getLogger("org.jaudiotagger.tag.id3");


    /**
     * Check if a byte array will require unsynchronization before being written as a tag.
     * If the byte array contains any $FF $E0 bytes, then it will require unsynchronization.
     *
     * @param abySource the byte array to be examined
     * @return true if unsynchronization is required, false otherwise
     */
    public static boolean requiresUnsynchronization(byte[] abySource)
    {
        for (int i = 0; i < abySource.length - 1; i++)
        {
            if (((abySource[i] & MPEGFrameHeader.SYNC_BYTE1) == MPEGFrameHeader.SYNC_BYTE1) && ((abySource[i + 1] & MPEGFrameHeader.SYNC_BYTE2) == MPEGFrameHeader.SYNC_BYTE2))
            {
                if (logger.isLoggable(Level.FINEST))
                {
                    logger.finest("Unsynchronisation required found bit at:" + i);
                }
                return true;
            }
        }

        return false;
    }

    /**
     * Unsynchronize an array of bytes, this should only be called if the decision has already been made to
     * unsynchronize the byte array
     *
     * In order to prevent a media player from incorrectly interpreting the contents of a tag, all $FF bytes
     * followed by a byte with value >=224 must be followed by a $00 byte (thus, $FF $F0 sequences become $FF $00 $F0).
     * Additionally because unsynchronisation is being applied any existing $FF $00 have to be converted to
     * $FF $00 $00
     *
     * @param abySource a byte array to be unsynchronized
     * @return a unsynchronized representation of the source
     */
    public static byte[] unsynchronize(byte[] abySource)
    {
        ByteArrayInputStream input = new ByteArrayInputStream(abySource);
        ByteArrayOutputStream output = new ByteArrayOutputStream(abySource.length);

        int count = 0;
        while (input.available() > 0)
        {
            int firstByte = input.read();
            count++;
            output.write(firstByte);
            if ((firstByte & MPEGFrameHeader.SYNC_BYTE1) == MPEGFrameHeader.SYNC_BYTE1)
            {
                // if byte is $FF, we must check the following byte if there is one
                if (input.available() > 0)
                {
                    input.mark(1);  // remember where we were, if we don't need to unsynchronize
                    int secondByte = input.read();
                    if ((secondByte & MPEGFrameHeader.SYNC_BYTE2) == MPEGFrameHeader.SYNC_BYTE2)
                    {
                        // we need to unsynchronize here
                        if (logger.isLoggable(Level.FINEST))
                        {
                            logger.finest("Writing unsynchronisation bit at:" + count);
                        }
                        output.write(0);

                    }
                    else if (secondByte == 0)
                    {
                        // we need to unsynchronize here
                        if (logger.isLoggable(Level.FINEST))
                        {
                            logger.finest("Inserting zero unsynchronisation bit at:" + count);
                        }
                        output.write(0);
                    }
                    input.reset();
                }
            }
        }
        // if we needed to unsynchronize anything, and this tag ends with 0xff, we have to append a zero byte,
        // which will be removed on de-unsynchronization later
        if ((abySource[abySource.length - 1] & MPEGFrameHeader.SYNC_BYTE1) == MPEGFrameHeader.SYNC_BYTE1)
        {
            logger.finest("Adding unsynchronisation bit at end of stream");
            output.write(0);
        }
        return output.toByteArray();
    }


    /**
     * Synchronize an array of bytes, this should only be called if it has been determined the tag is unsynchronised
     *
     * Any patterns of the form $FF $00 should be replaced by $FF
     *
     * @param source a ByteBuffer to be unsynchronized
     * @return a synchronized representation of the source
     */
    /*
    public static ByteBuffer synchronize(ByteBuffer source)
    {
        long start = System.nanoTime();

        int bufferSize = source.limit();
        ByteArrayOutputStream oBAOS = new ByteArrayOutputStream(bufferSize);
        int position = 0;
        while (position < bufferSize)
        {
            int byteValue = source.get();
            position ++;
            oBAOS.write(byteValue);
            if ((byteValue & MPEGFrameHeader.SYNC_BYTE1) == MPEGFrameHeader.SYNC_BYTE1)
            {
                // we are skipping if $00 byte but check not an end of stream
                if (position < bufferSize)
                {
                    int unsyncByteValue = source.get();
                    position++;
                    //If its the null byte we just ignore it
                    if (unsyncByteValue != 0)
                    {
                        oBAOS.write(unsyncByteValue);
                    }
                }
            }
        }
        long time = System.nanoTime() - start;
        ByteBuffer bb = ByteBuffer.wrap(oBAOS.toByteArray());
        System.out.printf("Took %6.3f ms, was %d bytes, now %,d bytes%n", time/1e6, source.limit(), bb.limit());
        return bb;
    }
    */

    /**
     * Synchronize an array of bytes, this should only be called if it has been determined the tag is unsynchronised
     *
     * Any patterns of the form $FF $00 should be replaced by $FF
     *
     * @param source a ByteBuffer to be unsynchronized
     * @return a synchronized representation of the source
     */
    /*
    public static ByteBuffer synchronize(ByteBuffer source)
    {
        long start = System.nanoTime();

        int bufferSize = source.limit();
        ByteBuffer output = ByteBuffer.allocate(bufferSize);
        int position = 0;
        int offset = 0;
        int length = 0;
        while (position < bufferSize)
        {
            int byteValue = source.get();
            position++;
            length++;
            if ((byteValue & MPEGFrameHeader.SYNC_BYTE1) == MPEGFrameHeader.SYNC_BYTE1)
            {
                // we are skipping if $00 byte but check not an end of stream
                if (position < bufferSize)
                {
                    int unsyncByteValue = source.get();
                    position++;
                    //If this is null byte, then write upto this point
                    if (unsyncByteValue == 0)
                    {
                        output.put(source.array(), source.arrayOffset() + offset, length);
                        offset = position;
                        length = 0;
                    }
                    else
                    {
                        length++;
                    }
                }
            }
        }
        if (length > 0)
        {
            output.put(source.array(), source.arrayOffset() + offset, length);
        }
        output.flip();
        long time = System.nanoTime() - start;
        System.out.printf("Took %6.3f ms, was %d bytes, now %,d bytes%n", time/1e6, source.limit(), output.limit());
        return output;
    }
    */

    /**
     * Synchronize an array of bytes, this should only be called if it has been determined the tag is unsynchronised
     *
     * Any patterns of the form $FF $00 should be replaced by $FF
     *
     * @param source a ByteBuffer to be unsynchronized
     * @return a synchronized representation of the source
     */

    public static ByteBuffer synchronize(ByteBuffer source)
    {
        //long start = System.nanoTime();
        
        int len = source.remaining();
        byte[] bytes = new byte[len + 1]; // an extra byte saves a check later.
        source.get(bytes, 0, len);
        int from = 0, to = 0;
        boolean copy = true; // whether to copy the byte, if false, check the byte != 0.
        while (from < len)
        {
            byte byteValue = bytes[from++];
            if (copy || byteValue != 0) bytes[to++] = byteValue;
            copy = ((byteValue & MPEGFrameHeader.SYNC_BYTE1) != MPEGFrameHeader.SYNC_BYTE1);
        }

        ByteBuffer bb2 = ByteBuffer.wrap(bytes, 0, to);
        //long time = System.nanoTime() - start;
        //System.out.printf("Took %6.3f ms, was %d bytes, now %,d bytes%n", time/1e6, source.limit(), bb2.limit());
        return bb2;
    }

}
