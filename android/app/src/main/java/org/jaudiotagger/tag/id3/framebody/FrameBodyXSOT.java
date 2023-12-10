package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.id3.ID3v23Frames;

import java.nio.ByteBuffer;

/**
 * Title Sort name, this is what MusicBrainz uses in ID3v23 because TSOT not supported.
 *
 * However iTunes uses TSOT even in ID3v23, so we have two possible options
 */
public class FrameBodyXSOT extends AbstractFrameBodyTextInfo implements ID3v23FrameBody
{
    /**
     * Creates a new FrameBodyTSOT datatype.
     */
    public FrameBodyXSOT()
    {
    }

    public FrameBodyXSOT(FrameBodyXSOT body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyTSOT datatype.
     *
     * @param textEncoding
     * @param text
     */
    public FrameBodyXSOT(byte textEncoding, String text)
    {
        super(textEncoding, text);
    }

    /**
     * Creates a new FrameBodyTSOT datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodyXSOT(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
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
        return ID3v23Frames.FRAME_ID_V3_TITLE_SORT_ORDER_MUSICBRAINZ;
    }
}
