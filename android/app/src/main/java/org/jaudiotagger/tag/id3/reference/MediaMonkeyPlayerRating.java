package org.jaudiotagger.tag.id3.reference;

/**
 * Defines the how ratings are stored In Media Monkey for ID3
 *
 * POPM=0 → Rating=0
 * POPM=1 → Rating=1
 * POPM=2-8 → Rating=0
 * POPM=9-18 → Rating=0.5
 * POPM=19-28 → Rating=1 (MM2.5:Rating=0.5 → POPM=28) (MM3.0:Rating=0.5 → POPM=26)
 * POPM=29 → Rating=1.5
 * POPM=30-39 → Rating=0.5
 * POPM=40-49 → Rating=1
 * POPM=50-59 → Rating=1.5 (MM2.5:Rating=1 → POPM=53) (MM3.0:Rating=1 → POPM=51)
 * POPM=60-69 → Rating=2
 * POPM=70-90 → Rating=1.5
 * POPM=91-113 → Rating=2
 * POPM=114-123 → Rating=2.5
 * POPM=124-133 → Rating=3 (MM2.5:Rating=2.5 → POPM=129) (MM3.0:Rating=2.5 → POPM=128)
 * POPM=134-141 → Rating=2.5
 * POPM=142-167 → Rating=3
 * POPM=168-191 → Rating=3.5
 * POPM=192-218 → Rating=4
 * POPM=219-247 → Rating=4.5
 * POPM=248-255 → Rating=5
 *
 *
 * TODO Media Monkey includes half stars so essentially a 10 star scale but not used by anything else much
 */
public class MediaMonkeyPlayerRating  extends ID3Rating
{
    private static ID3Rating rating=null;
    private MediaMonkeyPlayerRating()
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
        else if (value<=8)
        {
             newValue = 0;
        }
        else if (value<=18)
        {
             newValue = 1;
        }
        else if (value<=28)
        {
             newValue = 1;
        }
        else if (value<=28)
        {
             newValue = 1;
        }
        else if (value<=28)
        {
             newValue = 1;
        }
        else if (value<=28)
        {
             newValue = 1;
        }
        else if (value<=29)
        {
             newValue = 2;
        }
        else if (value<=39)
        {
             newValue = 1;
        }
        else if (value<=49)
        {
             newValue = 1;
        }
        else if (value<=113)
        {
             newValue = 2;
        }
        else if (value<=167)
        {
             newValue = 3;
        }
        else if (value<=218)
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
            rating=new MediaMonkeyPlayerRating();
        }
        return rating;
    }
}
