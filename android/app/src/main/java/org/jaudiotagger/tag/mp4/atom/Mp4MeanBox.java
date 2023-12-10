package org.jaudiotagger.tag.mp4.atom;

import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.mp4.atom.AbstractMp4Box;
import org.jaudiotagger.audio.mp4.atom.Mp4BoxHeader;

import java.nio.ByteBuffer;

/**
 * This box is used within ---- boxes to hold the issuer
 */
public class Mp4MeanBox extends AbstractMp4Box
{
    public static final String IDENTIFIER = "mean";

    private String issuer;

    //TODO Are these misnamed, are these version flag bytes or just null bytes
    public static final int VERSION_LENGTH = 1;
    public static final int FLAGS_LENGTH = 3;
    public static final int PRE_DATA_LENGTH = VERSION_LENGTH + FLAGS_LENGTH;

    /**
     * @param header     parentHeader info
     * @param dataBuffer data of box (doesnt include parentHeader data)
     */
    public Mp4MeanBox(Mp4BoxHeader header, ByteBuffer dataBuffer)
    {
        this.header = header;

        //Double check
        if (!header.getId().equals(IDENTIFIER))
        {
            throw new RuntimeException("Unable to process data box because identifier is:" + header.getId());
        }

        //Make slice so operations here don't effect position of main buffer
        this.dataBuffer = dataBuffer.slice();

        //issuer
        this.issuer = Utils.getString(this.dataBuffer, PRE_DATA_LENGTH, header.getDataLength() - PRE_DATA_LENGTH, header.getEncoding());

    }

    public String getIssuer()
    {
        return issuer;
    }
}
