package org.jaudiotagger.tag.id3.reference;

/**
 * Defines the how ratings are stored In Windows Media Player for ID3
 *
 * Rating=0 → POPM=0
 * Rating=1 → POPM=1
 * Rating=2 → POPM=64
 * Rating=3 → POPM=128
 * Rating=4 → POPM=196
 * Rating=5 → POPM=255
 */
public class MediaPlayerRating extends ID3Rating
{
    private static ID3Rating rating=null;
    private MediaPlayerRating()
    {
    }

    public int convertRatingFromFiveStarScale(int value)
    {
        if(value < 0 || value > 5)
        {
            throw new IllegalArgumentException("convert Ratings from Five Star Scale accepts values from 0 to 5 not:"+value);
        }
        int newValue=0;

        switch(value)
        {
            case 0:
                break;

            case 1:
                newValue=1;
                break;

            case 2:
                newValue=64;
                break;

            case 3:
                newValue=128;
                break;

            case 4:
                newValue=196;
                break;

            case 5:
                newValue=255;
                break;

        }
        return newValue;
    }
    
    public int convertRatingToFiveStarScale(int value)
    {
        int newValue=0;
        if (value<=0)
        {
             newValue = 0;
        }
        else if (value<=1)
        {
             newValue = 1;
        }
        else if (value<=64)
        {
             newValue = 2;
        }
        else if (value<=128)
        {
             newValue = 3;
        }
        else if (value<=196)
        {
             newValue = 4;
        }
        else
        {
             newValue = 5;
        }
        return  newValue;
    }

    public static ID3Rating getInstance()
    {
        if(rating==null)
        {
            rating=new MediaPlayerRating();
        }
        return rating;
    }
}
