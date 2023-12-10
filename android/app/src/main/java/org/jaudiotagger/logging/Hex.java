package org.jaudiotagger.logging;

/**
 * Display as hex
 */
public class Hex
{
    /**
     * Display as hex
     *
     * @param value
     * @return
     */
    public static String asHex(long value)
    {
        String val = Long.toHexString(value);
        if(val.length()==1)
        {
            return "0x0" + val;
        }
        return "0x" + val;
    }

    public static String asHex(int value)
    {
        return "0x" + Integer.toHexString(value);
    }


    /**
     * Display as hex
     *
     * @param value
     * @return
     */
    public static String asHex(byte value)
    {
        return "0x" + Integer.toHexString(value);
    }

    /**
     * Display as integral and hex calue in brackets
     *
     * @param value
     * @return
     */
    public static String asDecAndHex(long value)
    {
        return value + " (" + Hex.asHex(value)+ ")";
    }
}
