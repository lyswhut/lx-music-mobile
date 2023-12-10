package org.jaudiotagger.audio.mp4.atom;

import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.mp4.Mp4AtomIdentifier;
import org.jaudiotagger.logging.ErrorMessage;

import java.nio.ByteBuffer;

/**
 * This MP4 MetaBox is the parent of metadata, it usually contains four bytes of data
 * that needs to be processed before we can examine the children. But I also have a file that contains
 * meta (and no udta) that does not have this children data.
 */
public class Mp4MetaBox extends AbstractMp4Box
{
    public static final int FLAGS_LENGTH = 4;

    /**
     * @param header     header info
     * @param dataBuffer data of box (doesn't include header data)
     */
    public Mp4MetaBox(Mp4BoxHeader header, ByteBuffer dataBuffer)
    {
        this.header = header;
        this.dataBuffer = dataBuffer;
    }

    public void processData() throws CannotReadException
    {
        //4-skip the meta flags and check they are the meta flags
        byte[] b = new byte[FLAGS_LENGTH];
        dataBuffer.get(b);
        if (b[0] != 0)
        {
            throw new CannotReadException(ErrorMessage.MP4_FILE_META_ATOM_CHILD_DATA_NOT_NULL.getMsg());
        }
    }

    /**
     * Create an iTunes style Meta box
     *
     * <p>Useful when writing to mp4 that previously didn't contain an mp4 meta atom
     *
     * @param childrenSize
     * @return
     */
    public static Mp4MetaBox createiTunesStyleMetaBox(int childrenSize)
    {
        Mp4BoxHeader metaHeader = new Mp4BoxHeader(Mp4AtomIdentifier.META.getFieldName());
        metaHeader.setLength(Mp4BoxHeader.HEADER_LENGTH + Mp4MetaBox.FLAGS_LENGTH + childrenSize);
        ByteBuffer metaData = ByteBuffer.allocate(Mp4MetaBox.FLAGS_LENGTH);     
        Mp4MetaBox metaBox = new Mp4MetaBox(metaHeader,metaData);
        return metaBox;
    }
}
