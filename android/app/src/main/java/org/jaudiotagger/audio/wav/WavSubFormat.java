package org.jaudiotagger.audio.wav;

import java.util.HashMap;
import java.util.Map;

/**
 * Wav sub format stored as two byte le integer
 */
public enum WavSubFormat
{
    FORMAT_PCM(0x1,"WAV PCM"),
    FORMAT_FLOAT(0x3, "WAV IEEE_FLOAT"),
    FORMAT_ALAW(0x6, "WAV A-LAW"),
    FORMAT_MULAW(0x7, "WAV µ-LAW"),
    FORMAT_EXTENSIBLE(0xFFFE, "EXTENSIBLE"),
    FORMAT_GSM_COMPRESSED(0x31, "GSM_COMPRESSED"),
    ;

    private int code;
    private String description;

    WavSubFormat(int code, String description)
    {
        this.code=code;
        this.description=description;
    }

    public int getCode()
    {
        return code;
    }

    public String getDescription()
    {
        return description;
    }

    // Reverse-lookup map for getting a compression type from code
    private static final Map<Integer, WavSubFormat> lookup = new HashMap<Integer, WavSubFormat>();

    static
    {
        for (WavSubFormat next : WavSubFormat.values())
        {
            lookup.put(next.getCode(), next);
        }
    }

    public static WavSubFormat getByCode(Integer code)
    {
        return lookup.get(code);
    }
}
