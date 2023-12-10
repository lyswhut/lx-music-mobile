package org.jaudiotagger.audio.aiff.chunk;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.iff.Chunk;
import org.jaudiotagger.audio.iff.ChunkHeader;
import org.jaudiotagger.tag.TagException;
import org.jaudiotagger.tag.aiff.AiffTag;
import org.jaudiotagger.tag.id3.AbstractID3v2Tag;
import org.jaudiotagger.tag.id3.ID3v22Tag;
import org.jaudiotagger.tag.id3.ID3v23Tag;
import org.jaudiotagger.tag.id3.ID3v24Tag;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.logging.Logger;

/**
 * Contains the ID3 tags.
 */
public class ID3Chunk extends Chunk
{
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.aiff.chunk");
    private AiffTag aiffTag;

    /**
     * Constructor.
     *
     * @param chunkHeader        The header for this chunk
     * @param chunkData  The content of this chunk
     * @param tag        The AiffTag into which information is stored
     */
    public ID3Chunk(final ChunkHeader chunkHeader, final ByteBuffer chunkData, final AiffTag tag)
    {
        super(chunkData, chunkHeader);
        aiffTag = tag;
    }

    @Override
    public boolean readChunk() throws IOException
    {
        AudioFile.logger.severe("Reading chunk");
        if (!isId3v2Tag(chunkData))
        {
            logger.severe("Invalid ID3 header for ID3 chunk");
            return false;
        }

        final int version = chunkData.get();
        final AbstractID3v2Tag id3Tag;
        switch (version)
        {
            case ID3v22Tag.MAJOR_VERSION:
                id3Tag = new ID3v22Tag();
                AudioFile.logger.severe("Reading ID3V2.2 tag");
                break;
            case ID3v23Tag.MAJOR_VERSION:
                id3Tag = new ID3v23Tag();
                AudioFile.logger.severe("Reading ID3V2.3 tag");
                break;
            case ID3v24Tag.MAJOR_VERSION:
                id3Tag = new ID3v24Tag();
                AudioFile.logger.severe("Reading ID3V2.4 tag");
                break;
            default:
                return false;     // bad or unknown version
        }

        aiffTag.setID3Tag(id3Tag);
        chunkData.position(0);
        try
        {
            id3Tag.read(chunkData);
        }
        catch (TagException e)
        {
            AudioFile.logger.info("Exception reading ID3 tag: " + e.getClass().getName() + ": " + e.getMessage());
            return false;
        }
        return true;
    }

    /**
     * Reads 3 bytes to determine if the tag really looks like ID3 data.
     */
    private boolean isId3v2Tag(final ByteBuffer headerData) throws IOException
    {
        for (int i = 0; i < AbstractID3v2Tag.FIELD_TAGID_LENGTH; i++)
        {
            if (headerData.get() != AbstractID3v2Tag.TAG_ID[i])
            {
                return false;
            }
        }
        return true;
    }

}
