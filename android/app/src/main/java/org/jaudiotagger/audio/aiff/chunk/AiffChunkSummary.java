package org.jaudiotagger.audio.aiff.chunk;

import org.jaudiotagger.audio.iff.ChunkSummary;
import org.jaudiotagger.tag.aiff.AiffTag;

/**
 * AIFF Specific methods for ChunkSummarys
 */
public class AiffChunkSummary
{
    /**
     * Checks that there are only id3 tags after the currently selected id3tag because this means its safe to truncate
     * the remainder of the file.
     *
     * @param tag
     * @return
     */
    public static boolean isOnlyMetadataTagsAfterStartingMetadataTag(AiffTag tag)
    {
        boolean firstId3Tag = false;
        for(ChunkSummary cs:tag.getChunkSummaryList())
        {
            if(firstId3Tag)
            {
                if(!cs.getChunkId().equals(AiffChunkType.TAG.getCode()))
                {
                    return false;
                }
            }
            else
            {
                if (cs.getFileStartLocation() == tag.getStartLocationInFileOfId3Chunk())
                {
                    //Found starting point
                    firstId3Tag = true;
                }
            }
        }

        //Should always be true but this is to protect against something gone wrong
        if(firstId3Tag==true)
        {
            return true;
        }
        return false;

    }

    /**
     * Get chunk before starting metadata tag
     *
     * @param tag
     * @return
     */
    public static ChunkSummary getChunkBeforeStartingMetadataTag(AiffTag tag)
    {
        for(int i=0;i < tag.getChunkSummaryList().size(); i++)
        {
            ChunkSummary cs = tag.getChunkSummaryList().get(i);
            if (cs.getFileStartLocation() == tag.getStartLocationInFileOfId3Chunk())
            {
                return tag.getChunkSummaryList().get(i - 1);
            }
        }
        return null;
    }
}
