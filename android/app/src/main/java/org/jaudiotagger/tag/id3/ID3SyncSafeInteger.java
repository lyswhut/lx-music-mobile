package org.jaudiotagger.tag.id3;

import java.nio.ByteBuffer;

/**
 * Peforms encoding/decoding of an syncsafe integer
 *
 * <p>Syncsafe integers are used for the size in the tag header of v23 and v24 tags, and in the frame size in
 * the frame header of v24 frames.
 *
 * <p>In some parts of the tag it is inconvenient to use the
 * unsychronisation scheme because the size of unsynchronised data is
 * not known in advance, which is particularly problematic with size
 * descriptors. The solution in ID3v2 is to use synchsafe integers, in
 * which there can never be any false synchs. Synchsafe integers are
 * integers that keep its highest bit (bit 7) zeroed, making seven bits
 * out of eight available. Thus a 32 bit synchsafe integer can store 28
 * bits of information.
 *
 * Example:
 *
 * 255 (%11111111) encoded as a 16 bit synchsafe integer is 383
 * (%00000001 01111111).
 */
public class ID3SyncSafeInteger
{
    public static final int INTEGRAL_SIZE = 4;

    /**
     * Sizes equal or smaller than this are the same whether held as sync safe integer or normal integer so
     * it doesnt matter.
     */
    public static final int MAX_SAFE_SIZE = 127;

    /**
     * Read syncsafe value from byteArray in format specified in spec and convert to int.
     *
     * @param buffer syncsafe integer
     * @return decoded int
     */
    public static int bufferToValue(byte[] buffer)
    {
        //Note Need to && with 0xff otherwise if value is greater than 128 we get a negative number
        //when cast byte to int
        return ((buffer[0] & 0xff) << 21) + ((buffer[1] & 0xff) << 14) + ((buffer[2] & 0xff) << 7) + ((buffer[3]) & 0xff);
    }

    /**
     * Read syncsafe value from buffer in format specified in spec and convert to int.
     *
     * The buffers position is moved to just after the location of the syncsafe integer
     *
     * @param buffer syncsafe integer
     * @return decoded int
     */
    public static int bufferToValue(ByteBuffer buffer)
    {
        byte byteBuffer[] = new byte[INTEGRAL_SIZE];
        buffer.get(byteBuffer, 0, INTEGRAL_SIZE);
        return bufferToValue(byteBuffer);
    }

    /**
     * Is buffer holding a value that is definently not syncsafe
     *
     * We cannot guarantee a buffer is holding a syncsafe integer but there are some checks
     * we can do to show that it definently is not.
     *
     * The buffer is NOT moved after reading.
     *
     * This function is useful for reading ID3v24 frames created in iTunes because iTunes does not use syncsafe
     * integers in  its frames.
     *
     * @param buffer
     * @return true if this buffer is definently not holding a syncsafe integer
     */
    protected static boolean isBufferNotSyncSafe(ByteBuffer buffer)
    {
        int position = buffer.position();

        //Check Bit7 not set
        for (int i = 0; i < INTEGRAL_SIZE; i++)
        {
            byte nextByte = buffer.get(position + i);
            if ((nextByte & 0x80) > 0)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if the buffer just contains zeros
     *
     * This can be used to identify when accessing padding of a tag
     *
     * @param buffer
     * @return true if buffer only contains zeros
     */
    protected static boolean isBufferEmpty(byte[] buffer)
    {
        for (byte aBuffer : buffer)
        {
            if (aBuffer != 0)
            {
                return false;
            }
        }
        return true;
    }

    /**
     * Convert int value to syncsafe value held in bytearray
     *
     * @param size
     * @return buffer syncsafe integer
     */
    protected static byte[] valueToBuffer(int size)
    {
        byte[] buffer = new byte[4];
        buffer[0] = (byte) ((size & 0x0FE00000) >> 21);
        buffer[1] = (byte) ((size & 0x001FC000) >> 14);
        buffer[2] = (byte) ((size & 0x00003F80) >> 7);
        buffer[3] = (byte) (size & 0x0000007F);
        return buffer;
    }
}
