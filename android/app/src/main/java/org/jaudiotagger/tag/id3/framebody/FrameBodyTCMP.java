package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.id3.ID3v24Frames;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;

import java.nio.ByteBuffer;

/**
 * Is part of a Compilation (iTunes frame)
 *
 * <p>determines whether or not track is part of compilation
 *
 * @author : Paul Taylor
 */
public class FrameBodyTCMP extends AbstractFrameBodyTextInfo implements ID3v24FrameBody, ID3v23FrameBody
{
    //TODO does iTunes have to have null terminator?
    static String IS_COMPILATION = "1\u0000";

    /**
     * Creates a new FrameBodyTCMP datatype, with compilation enabled
     *
     * This is the preferred constructor to use because TCMP frames should not exist
     * unless they are set to true
     */
    public FrameBodyTCMP()
    {
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
        setObjectValue(DataTypes.OBJ_TEXT, IS_COMPILATION);
    }

    public FrameBodyTCMP(FrameBodyTCMP body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyTCMP datatype.
     *
     * @param textEncoding
     * @param text
     */
    public FrameBodyTCMP(byte textEncoding, String text)
    {
        super(textEncoding, text);
    }

    public boolean isCompilation()
    {
        return this.getText().equals(IS_COMPILATION);
    }

    /**
     * Creates a new FrameBodyTIT1 datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodyTCMP(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_IS_COMPILATION;
    }
}
