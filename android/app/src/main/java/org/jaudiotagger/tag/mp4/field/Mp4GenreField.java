package org.jaudiotagger.tag.mp4.field;

import org.jaudiotagger.audio.mp4.atom.Mp4BoxHeader;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.mp4.Mp4FieldKey;
import org.jaudiotagger.tag.mp4.atom.Mp4DataBox;
import org.jaudiotagger.tag.reference.GenreTypes;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.util.ArrayList;

/**
 * Represents the Genre field , when user has selected from the set list of genres
 *
 * <p>This class allows you to retrieve either the internal genreid, or the display value
 */
public class Mp4GenreField extends Mp4TagTextNumberField
{
    public Mp4GenreField(String id, ByteBuffer data) throws UnsupportedEncodingException
    {
        super(id, data);
    }

    /**
     * Precheck to see if the value is a valid genre or whether you should use a custom genre.
     *
     * @param genreId
     * @return
     */
    public static boolean isValidGenre(String genreId)
    {
        //Is it an id (within old id3 range)      
        try
        {
            short genreVal = Short.parseShort(genreId);
            if ((genreVal - 1) <= GenreTypes.getMaxStandardGenreId())
            {
                return true;
            }
        }
        catch (NumberFormatException nfe)
        {
            //Do Nothing test as String instead
        }

        //Is it the String value ?
        Integer id3GenreId = GenreTypes.getInstanceOf().getIdForValue(genreId);
        if (id3GenreId != null)
        {
            if (id3GenreId <= GenreTypes.getMaxStandardGenreId())
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Construct genre, if cant find match just default to first genre
     *
     * @param genreId key into ID3v1 list (offset by one) or String value in ID3list
     */
    public Mp4GenreField(String genreId)
    {
        super(Mp4FieldKey.GENRE.getFieldName(), genreId);

        //Is it an id
        try
        {
            short genreVal = Short.parseShort(genreId);
            if (genreVal <= GenreTypes.getMaxStandardGenreId())
            {
                numbers = new ArrayList<Short>();
                numbers.add(++genreVal);
                return;
            }
            //Default
            numbers = new ArrayList<Short>();
            numbers.add((short) (1));
            return;
        }
        catch (NumberFormatException nfe)
        {
            //Do Nothing test as String instead
        }

        //Is it the String value ?
        Integer id3GenreId = GenreTypes.getInstanceOf().getIdForValue(genreId);
        if (id3GenreId != null)
        {
            if (id3GenreId <= GenreTypes.getMaxStandardGenreId())
            {
                numbers = new ArrayList<Short>();
                numbers.add((short) (id3GenreId + 1));
                return;
            }
        }
        numbers = new ArrayList<Short>();
        numbers.add((short) (1));
    }

    protected void build(ByteBuffer data) throws UnsupportedEncodingException
    {
        //Data actually contains a 'Data' Box so process data using this
        Mp4BoxHeader header = new Mp4BoxHeader(data);
        Mp4DataBox databox = new Mp4DataBox(header, data);
        dataSize = header.getDataLength();
        numbers = databox.getNumbers();

        if(numbers.size()>0)
        {
            int genreId = numbers.get(0);
            //Get value, we have to adjust index by one because iTunes labels from one instead of zero
            content = GenreTypes.getInstanceOf().getValueForId(genreId - 1);
            //Some apps set genre to invalid value, we dont disguise this by setting content to empty string we leave
            //as null so apps can handle if they wish, but we do display a warning to make them aware.
            if (content == null)
            {
                logger.warning(ErrorMessage.MP4_GENRE_OUT_OF_RANGE.getMsg(genreId));
            }
        }
        else
        {
            logger.warning(ErrorMessage.MP4_NO_GENREID_FOR_GENRE.getMsg(header.getDataLength()));
        }
    }
}
