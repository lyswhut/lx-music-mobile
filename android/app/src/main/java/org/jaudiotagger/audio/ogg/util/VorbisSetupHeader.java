package org.jaudiotagger.audio.ogg.util;

import org.jaudiotagger.StandardCharsets;

import java.util.logging.Logger;

/**
 * Vorbis Setup header
 *
 * We dont need to decode a vorbis setup header for metatagging, but we should be able to identify
 * it.
 *
 * @author Paul Taylor
 * @version 12th August 2007
 */
public class VorbisSetupHeader implements VorbisHeader
{
    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.ogg.atom");

    private boolean isValid = false;

    public VorbisSetupHeader(byte[] vorbisData)
    {
        decodeHeader(vorbisData);
    }

    public boolean isValid()
    {
        return isValid;
    }

    public void decodeHeader(byte[] b)
    {
        int packetType = b[FIELD_PACKET_TYPE_POS];
        logger.fine("packetType" + packetType);
        String vorbis = new String(b, FIELD_CAPTURE_PATTERN_POS, FIELD_CAPTURE_PATTERN_LENGTH, StandardCharsets.ISO_8859_1);
        if (packetType == VorbisPacketType.SETUP_HEADER.getType() && vorbis.equals(CAPTURE_PATTERN))
        {
            isValid = true;
        }
    }

}
