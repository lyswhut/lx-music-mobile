package org.jaudiotagger.tag.id3.reference;

import org.jaudiotagger.tag.reference.Tagger;

/** Factory class that can be used to convert ratings to suit your preferred tagger/player
 *
 */
//TODO Only the main ones done yet
public abstract class ID3Rating
{

    public static ID3Rating getInstance(Tagger tagger)
    {
        switch(tagger)
        {
            case ITUNES:
                return ITunesRating.getInstance();

            case MEDIA_MONKEY:
                return MediaMonkeyPlayerRating.getInstance();

            case MEDIAPLAYER:
                return MediaPlayerRating.getInstance();

            default:
                return MediaPlayerRating.getInstance();
        }
    }

    public abstract int convertRatingFromFiveStarScale(int value);
    public abstract int convertRatingToFiveStarScale(int value);
}
