package org.jaudiotagger.audio.wav.chunk;

import org.jaudiotagger.audio.iff.ChunkSummary;
import org.jaudiotagger.audio.wav.WavChunkType;
import org.jaudiotagger.tag.wav.WavTag;

import java.util.logging.Logger;

/**
 * AIFF Specific methods for ChunkSummarys
 */
public class WavChunkSummary
{
    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.wav.chunk");

    /**
     * Get start location in file of first metadata chunk (could be LIST or ID3)
     *
     * @param tag
     * @return
     */
    public static long getStartLocationOfFirstMetadataChunk(WavTag tag)
    {
        //Work out the location of the first metadata tag (could be id3 or LIST tag)
        long startLocationOfMetadatTag = -1;
        if(tag.getInfoTag()!=null)
        {
            startLocationOfMetadatTag = tag.getInfoTag().getStartLocationInFile();

            if(tag.getID3Tag()!=null)
            {
                if(tag.getStartLocationInFileOfId3Chunk() < startLocationOfMetadatTag)
                {
                    startLocationOfMetadatTag = tag.getStartLocationInFileOfId3Chunk();
                }
            }
        }
        else if(tag.getID3Tag()!=null)
        {
            startLocationOfMetadatTag = tag.getStartLocationInFileOfId3Chunk();
        }
        return startLocationOfMetadatTag;
    }

    /**
     * Checks that there are only id3 tags after the currently selected id3tag because this means its safe to truncate
     * the remainder of the file.
     *
     * @param tag
     * @return
     */
    public static boolean isOnlyMetadataTagsAfterStartingMetadataTag(WavTag tag)
    {
        long startLocationOfMetadatTag = getStartLocationOfFirstMetadataChunk(tag);
        if(startLocationOfMetadatTag==-1)
        {
            logger.severe("Unable to find any metadata tags !");
            return false;
        }

        boolean firstMetadataTag = false;
        for(ChunkSummary cs:tag.getChunkSummaryList())
        {
            if(firstMetadataTag)
            {
                if(
                        !cs.getChunkId().equals(WavChunkType.ID3.getCode()) &&
                        !cs.getChunkId().equals(WavChunkType.LIST.getCode()) &&
                        !cs.getChunkId().equals(WavChunkType.INFO.getCode())
                  )
                {
                    return false;
                }
            }
            else
            {
                if (cs.getFileStartLocation() == startLocationOfMetadatTag)
                {
                    //Found starting point
                    firstMetadataTag = true;
                }
            }
        }

        //Should always be true but this is to protect against something gone wrong
        if(firstMetadataTag==true)
        {
            return true;
        }
        return false;

    }


    /**
     * Get chunk before the first metadata tag
     *
     * @param tag
     * @return
     */
    public static ChunkSummary getChunkBeforeFirstMetadataTag(WavTag tag)
    {
        long startLocationOfMetadatTag = getStartLocationOfFirstMetadataChunk(tag);

        for(int i=0;i < tag.getChunkSummaryList().size(); i++)
        {
            ChunkSummary cs = tag.getChunkSummaryList().get(i);
            if (cs.getFileStartLocation() == startLocationOfMetadatTag)
            {
                return tag.getChunkSummaryList().get(i - 1);
            }
        }
        return null;
    }
}
