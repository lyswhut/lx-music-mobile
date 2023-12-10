/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Raphael Slinckx <raphael@slinckx.net>
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *  
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
package org.jaudiotagger.tag.mp4;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.generic.AbstractTag;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.*;
import org.jaudiotagger.tag.images.Artwork;
import org.jaudiotagger.tag.images.ArtworkFactory;
import org.jaudiotagger.tag.mp4.field.*;

import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;

import static org.jaudiotagger.tag.mp4.Mp4FieldKey.*;

/**
 * A Logical representation of Mp4Tag, i.e the meta information stored in an Mp4 file underneath the
 * moov.udt.meta.ilst atom.
 */
public class Mp4Tag extends AbstractTag
{

    private static final EnumMap<FieldKey, Mp4FieldKey> tagFieldToMp4Field = new EnumMap<FieldKey, Mp4FieldKey>(FieldKey.class);

    //Mapping from generic key to mp4 key
    static
    {
        tagFieldToMp4Field.put(FieldKey.ACOUSTID_FINGERPRINT, Mp4FieldKey.ACOUSTID_FINGERPRINT);
        tagFieldToMp4Field.put(FieldKey.ACOUSTID_ID, Mp4FieldKey.ACOUSTID_ID);
        tagFieldToMp4Field.put(FieldKey.ALBUM, Mp4FieldKey.ALBUM);
        tagFieldToMp4Field.put(FieldKey.ALBUM_ARTIST, Mp4FieldKey.ALBUM_ARTIST);
        tagFieldToMp4Field.put(FieldKey.ALBUM_ARTIST_SORT, Mp4FieldKey.ALBUM_ARTIST_SORT);
        tagFieldToMp4Field.put(FieldKey.ALBUM_ARTISTS, Mp4FieldKey.ALBUM_ARTISTS);
        tagFieldToMp4Field.put(FieldKey.ALBUM_ARTISTS_SORT, Mp4FieldKey.ALBUM_ARTISTS_SORT);
        tagFieldToMp4Field.put(FieldKey.ALBUM_SORT, Mp4FieldKey.ALBUM_SORT);
        tagFieldToMp4Field.put(FieldKey.AMAZON_ID, Mp4FieldKey.ASIN);
        tagFieldToMp4Field.put(FieldKey.ARRANGER, Mp4FieldKey.ARRANGER);
        tagFieldToMp4Field.put(FieldKey.ARRANGER_SORT, Mp4FieldKey.ARRANGER_SORT);
        tagFieldToMp4Field.put(FieldKey.ARTIST, Mp4FieldKey.ARTIST);
        tagFieldToMp4Field.put(FieldKey.ARTISTS, Mp4FieldKey.ARTISTS);
        tagFieldToMp4Field.put(FieldKey.ARTIST_SORT, Mp4FieldKey.ARTIST_SORT);
        tagFieldToMp4Field.put(FieldKey.ARTISTS_SORT, Mp4FieldKey.ARTISTS_SORT);
        tagFieldToMp4Field.put(FieldKey.BARCODE, Mp4FieldKey.BARCODE);
        tagFieldToMp4Field.put(FieldKey.BPM, Mp4FieldKey.BPM);
        tagFieldToMp4Field.put(FieldKey.CATALOG_NO, Mp4FieldKey.CATALOGNO);
        tagFieldToMp4Field.put(FieldKey.CHOIR, Mp4FieldKey.CHOIR);
        tagFieldToMp4Field.put(FieldKey.CHOIR_SORT, Mp4FieldKey.CHOIR_SORT);
        tagFieldToMp4Field.put(FieldKey.CLASSICAL_CATALOG, Mp4FieldKey.CLASSICAL_CATALOG);
        tagFieldToMp4Field.put(FieldKey.CLASSICAL_NICKNAME, Mp4FieldKey.CLASSICAL_NICKNAME);
        tagFieldToMp4Field.put(FieldKey.COMMENT, Mp4FieldKey.COMMENT);
        tagFieldToMp4Field.put(FieldKey.COMPOSER, Mp4FieldKey.COMPOSER);
        tagFieldToMp4Field.put(FieldKey.COMPOSER_SORT, Mp4FieldKey.COMPOSER_SORT);
        tagFieldToMp4Field.put(FieldKey.CONDUCTOR, Mp4FieldKey.CONDUCTOR);
        tagFieldToMp4Field.put(FieldKey.COUNTRY, Mp4FieldKey.COUNTRY);
        tagFieldToMp4Field.put(FieldKey.CONDUCTOR_SORT, Mp4FieldKey.CONDUCTOR_SORT);
        tagFieldToMp4Field.put(FieldKey.COPYRIGHT, Mp4FieldKey.COPYRIGHT);
        tagFieldToMp4Field.put(FieldKey.COVER_ART, Mp4FieldKey.ARTWORK);
        tagFieldToMp4Field.put(FieldKey.CUSTOM1, Mp4FieldKey.MM_CUSTOM_1);
        tagFieldToMp4Field.put(FieldKey.CUSTOM2, Mp4FieldKey.MM_CUSTOM_2);
        tagFieldToMp4Field.put(FieldKey.CUSTOM3, Mp4FieldKey.MM_CUSTOM_3);
        tagFieldToMp4Field.put(FieldKey.CUSTOM4, Mp4FieldKey.MM_CUSTOM_4);
        tagFieldToMp4Field.put(FieldKey.CUSTOM5, Mp4FieldKey.MM_CUSTOM_5);
        tagFieldToMp4Field.put(FieldKey.DISC_NO, Mp4FieldKey.DISCNUMBER);
        tagFieldToMp4Field.put(FieldKey.DISC_SUBTITLE, Mp4FieldKey.DISC_SUBTITLE);
        tagFieldToMp4Field.put(FieldKey.DISC_TOTAL, Mp4FieldKey.DISCNUMBER);
        tagFieldToMp4Field.put(FieldKey.DJMIXER, Mp4FieldKey.DJMIXER);
        tagFieldToMp4Field.put(FieldKey.MOOD_ELECTRONIC, Mp4FieldKey.MOOD_ELECTRONIC);
        tagFieldToMp4Field.put(FieldKey.ENCODER, Mp4FieldKey.ENCODER);
        tagFieldToMp4Field.put(FieldKey.ENGINEER, Mp4FieldKey.ENGINEER);
        tagFieldToMp4Field.put(FieldKey.ENSEMBLE, Mp4FieldKey.ENSEMBLE);
        tagFieldToMp4Field.put(FieldKey.ENSEMBLE_SORT, Mp4FieldKey.ENSEMBLE_SORT);
        tagFieldToMp4Field.put(FieldKey.FBPM, Mp4FieldKey.FBPM);
        tagFieldToMp4Field.put(FieldKey.GENRE, Mp4FieldKey.GENRE);
        tagFieldToMp4Field.put(FieldKey.GROUP, Mp4FieldKey.GROUP);
        tagFieldToMp4Field.put(FieldKey.GROUPING, Mp4FieldKey.GROUPING);
        tagFieldToMp4Field.put(FieldKey.INSTRUMENT, Mp4FieldKey.INSTRUMENT);
        tagFieldToMp4Field.put(FieldKey.INVOLVED_PERSON, Mp4FieldKey.INVOLVED_PEOPLE);
        tagFieldToMp4Field.put(FieldKey.ISRC, Mp4FieldKey.ISRC);
        tagFieldToMp4Field.put(FieldKey.IS_COMPILATION, Mp4FieldKey.COMPILATION);
        tagFieldToMp4Field.put(FieldKey.IS_CLASSICAL, Mp4FieldKey.IS_CLASSICAL);
        tagFieldToMp4Field.put(FieldKey.IS_SOUNDTRACK, Mp4FieldKey.IS_SOUNDTRACK);
        tagFieldToMp4Field.put(FieldKey.KEY, Mp4FieldKey.KEY);
        tagFieldToMp4Field.put(FieldKey.LANGUAGE, Mp4FieldKey.LANGUAGE);
        tagFieldToMp4Field.put(FieldKey.LYRICIST, Mp4FieldKey.LYRICIST);
        tagFieldToMp4Field.put(FieldKey.LYRICS, Mp4FieldKey.LYRICS);
        tagFieldToMp4Field.put(FieldKey.MEDIA, Mp4FieldKey.MEDIA);
        tagFieldToMp4Field.put(FieldKey.MIXER, Mp4FieldKey.MIXER);
        tagFieldToMp4Field.put(FieldKey.MOOD, Mp4FieldKey.MOOD);
        tagFieldToMp4Field.put(FieldKey.MOOD_ACOUSTIC, Mp4FieldKey.MOOD_ACOUSTIC);
        tagFieldToMp4Field.put(FieldKey.MOOD_AGGRESSIVE, Mp4FieldKey.MOOD_AGGRESSIVE);
        tagFieldToMp4Field.put(FieldKey.MOOD_AROUSAL, Mp4FieldKey.MOOD_AROUSAL);
        tagFieldToMp4Field.put(FieldKey.MOOD_DANCEABILITY, Mp4FieldKey.MOOD_DANCEABILITY);
        tagFieldToMp4Field.put(FieldKey.MOOD_HAPPY, Mp4FieldKey.MOOD_HAPPY);
        tagFieldToMp4Field.put(FieldKey.MOOD_INSTRUMENTAL, Mp4FieldKey.MOOD_INSTRUMENTAL);
        tagFieldToMp4Field.put(FieldKey.MOOD_PARTY, Mp4FieldKey.MOOD_PARTY);
        tagFieldToMp4Field.put(FieldKey.MOOD_RELAXED, Mp4FieldKey.MOOD_RELAXED);
        tagFieldToMp4Field.put(FieldKey.MOOD_SAD, Mp4FieldKey.MOOD_SAD);
        tagFieldToMp4Field.put(FieldKey.MOOD_VALENCE, Mp4FieldKey.MOOD_VALENCE);
        tagFieldToMp4Field.put(FieldKey.MOVEMENT, Mp4FieldKey.MOVEMENT);
        tagFieldToMp4Field.put(FieldKey.MOVEMENT_NO, Mp4FieldKey.MOVEMENT_NO);
        tagFieldToMp4Field.put(FieldKey.MOVEMENT_TOTAL, Mp4FieldKey.MOVEMENT_TOTAL);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK, Mp4FieldKey.MUSICBRAINZ_WORK);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_ARTISTID, Mp4FieldKey.MUSICBRAINZ_ARTISTID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_DISC_ID, Mp4FieldKey.MUSICBRAINZ_DISCID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_ORIGINAL_RELEASE_ID, Mp4FieldKey.MUSICBRAINZ_ORIGINALALBUMID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_RELEASEARTISTID, Mp4FieldKey.MUSICBRAINZ_ALBUMARTISTID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_RELEASEID, Mp4FieldKey.MUSICBRAINZ_ALBUMID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_RELEASE_COUNTRY, Mp4FieldKey.RELEASECOUNTRY);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_RELEASE_GROUP_ID, Mp4FieldKey.MUSICBRAINZ_RELEASE_GROUPID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_RELEASE_STATUS, Mp4FieldKey.MUSICBRAINZ_ALBUM_STATUS);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_RELEASE_TRACK_ID, Mp4FieldKey.MUSICBRAINZ_RELEASE_TRACKID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_RELEASE_TYPE, Mp4FieldKey.MUSICBRAINZ_ALBUM_TYPE);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_TRACK_ID, Mp4FieldKey.MUSICBRAINZ_TRACKID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_ID, Mp4FieldKey.MUSICBRAINZ_WORKID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_COMPOSITION_ID, Mp4FieldKey.MUSICBRAINZ_WORK_COMPOSITION_ID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_ID, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_ID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_COMPOSITION, Mp4FieldKey.MUSICBRAINZ_WORK_COMPOSITION);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_TYPE, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_TYPE);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_ID, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_ID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_TYPE, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_TYPE);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_ID, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_ID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_TYPE, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_TYPE);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_ID, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_ID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_TYPE, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_TYPE);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_ID, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_ID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_TYPE, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_TYPE);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_ID, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_ID);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6);
        tagFieldToMp4Field.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_TYPE, Mp4FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_TYPE);
        tagFieldToMp4Field.put(FieldKey.MUSICIP_ID, Mp4FieldKey.MUSICIP_PUID);
        tagFieldToMp4Field.put(FieldKey.OCCASION, Mp4FieldKey.MM_OCCASION);
        tagFieldToMp4Field.put(FieldKey.OPUS, Mp4FieldKey.OPUS);
        tagFieldToMp4Field.put(FieldKey.ORCHESTRA, Mp4FieldKey.ORCHESTRA);
        tagFieldToMp4Field.put(FieldKey.ORCHESTRA_SORT, Mp4FieldKey.ORCHESTRA_SORT);
        tagFieldToMp4Field.put(FieldKey.ORIGINAL_ALBUM, Mp4FieldKey.MM_ORIGINAL_ALBUM_TITLE);
        tagFieldToMp4Field.put(FieldKey.ORIGINAL_ARTIST, Mp4FieldKey.MM_ORIGINAL_ARTIST);
        tagFieldToMp4Field.put(FieldKey.ORIGINAL_LYRICIST, Mp4FieldKey.MM_ORIGINAL_LYRICIST);
        tagFieldToMp4Field.put(FieldKey.ORIGINAL_YEAR, Mp4FieldKey.MM_ORIGINAL_YEAR);
        tagFieldToMp4Field.put(FieldKey.PART, Mp4FieldKey.PART);
        tagFieldToMp4Field.put(FieldKey.PART_NUMBER, Mp4FieldKey.PART_NUMBER);
        tagFieldToMp4Field.put(FieldKey.PART_TYPE, Mp4FieldKey.PART_TYPE);
        tagFieldToMp4Field.put(FieldKey.PERFORMER, Mp4FieldKey.PERFORMER);
        tagFieldToMp4Field.put(FieldKey.PERFORMER_NAME, Mp4FieldKey.PERFORMER_NAME);
        tagFieldToMp4Field.put(FieldKey.PERFORMER_NAME_SORT, Mp4FieldKey.PERFORMER_NAME_SORT);
        tagFieldToMp4Field.put(FieldKey.PERIOD, Mp4FieldKey.PERIOD);
        tagFieldToMp4Field.put(FieldKey.PRODUCER, Mp4FieldKey.PRODUCER);
        tagFieldToMp4Field.put(FieldKey.QUALITY, Mp4FieldKey.MM_QUALITY);
        tagFieldToMp4Field.put(FieldKey.RANKING, Mp4FieldKey.RANKING);
        tagFieldToMp4Field.put(FieldKey.RATING, Mp4FieldKey.SCORE);
        tagFieldToMp4Field.put(FieldKey.RECORD_LABEL, Mp4FieldKey.LABEL);
        tagFieldToMp4Field.put(FieldKey.REMIXER, Mp4FieldKey.REMIXER);
        tagFieldToMp4Field.put(FieldKey.SCRIPT, Mp4FieldKey.SCRIPT);
        tagFieldToMp4Field.put(FieldKey.SINGLE_DISC_TRACK_NO, Mp4FieldKey.SINGLE_DISC_TRACK_NO);
        tagFieldToMp4Field.put(FieldKey.SUBTITLE, Mp4FieldKey.SUBTITLE);
        tagFieldToMp4Field.put(FieldKey.TAGS, Mp4FieldKey.TAGS);
        tagFieldToMp4Field.put(FieldKey.TEMPO, Mp4FieldKey.TEMPO);
        tagFieldToMp4Field.put(FieldKey.TIMBRE, Mp4FieldKey.TIMBRE);
        tagFieldToMp4Field.put(FieldKey.TITLE, Mp4FieldKey.TITLE);
        tagFieldToMp4Field.put(FieldKey.TITLE_MOVEMENT, Mp4FieldKey.TITLE_MOVEMENT);
        tagFieldToMp4Field.put(FieldKey.TITLE_SORT, Mp4FieldKey.TITLE_SORT);
        tagFieldToMp4Field.put(FieldKey.TONALITY, Mp4FieldKey.TONALITY);
        tagFieldToMp4Field.put(FieldKey.TRACK, Mp4FieldKey.TRACK);
        tagFieldToMp4Field.put(FieldKey.TRACK_TOTAL, Mp4FieldKey.TRACK);
        tagFieldToMp4Field.put(FieldKey.URL_DISCOGS_ARTIST_SITE, Mp4FieldKey.URL_DISCOGS_ARTIST_SITE);
        tagFieldToMp4Field.put(FieldKey.URL_DISCOGS_RELEASE_SITE, Mp4FieldKey.URL_DISCOGS_RELEASE_SITE);
        tagFieldToMp4Field.put(FieldKey.URL_LYRICS_SITE, Mp4FieldKey.URL_LYRICS_SITE);
        tagFieldToMp4Field.put(FieldKey.URL_OFFICIAL_ARTIST_SITE, Mp4FieldKey.URL_OFFICIAL_ARTIST_SITE);
        tagFieldToMp4Field.put(FieldKey.URL_OFFICIAL_RELEASE_SITE, Mp4FieldKey.URL_OFFICIAL_RELEASE_SITE);
        tagFieldToMp4Field.put(FieldKey.URL_WIKIPEDIA_ARTIST_SITE, Mp4FieldKey.URL_WIKIPEDIA_ARTIST_SITE);
        tagFieldToMp4Field.put(FieldKey.URL_WIKIPEDIA_RELEASE_SITE, Mp4FieldKey.URL_WIKIPEDIA_RELEASE_SITE);
        tagFieldToMp4Field.put(FieldKey.WORK, Mp4FieldKey.WORK);
        tagFieldToMp4Field.put(FieldKey.YEAR, Mp4FieldKey.DAY);
        tagFieldToMp4Field.put(FieldKey.WORK_TYPE, Mp4FieldKey.WORK_TYPE);
    }

    /**
     * Create genre field
     *
     * <p>If the content can be parsed to one of the known values use the genre field otherwise
     * use the custom field.
     *
     * @param content
     * @return
     */
    @SuppressWarnings({"JavaDoc"})
    private TagField createGenreField(String content)
    {
        if (content == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }

        //Always write as text
        if(TagOptionSingleton.getInstance().isWriteMp4GenresAsText())
        {
            return new Mp4TagTextField(GENRE_CUSTOM.getFieldName(), content);
        }

        if (Mp4GenreField.isValidGenre(content))
        {
            return new Mp4GenreField(content);
        }
        else
        {
            return new Mp4TagTextField(GENRE_CUSTOM.getFieldName(), content);
        }
    }

    protected boolean isAllowedEncoding(Charset enc)
    {
        return StandardCharsets.UTF_8.equals(enc);
    }

    public String toString()
    {
        return "Mpeg4 " + super.toString();
    }

    /**
     *
     * @param genericKey
     * @return
     */
    public boolean hasField(FieldKey genericKey)
    {
        return getFields(genericKey).size() != 0;
    }

    /**
     *
     * @param mp4FieldKey
     * @return
     */
    public boolean hasField(Mp4FieldKey mp4FieldKey)
    {
        return getFields(mp4FieldKey.getFieldName()).size() != 0;
    }

    /**
     * Maps the generic key to the mp4 key and return the list of values for this field
     *
     * @param genericKey
     */
    @SuppressWarnings({"JavaDoc"})
    public List<TagField> getFields(FieldKey genericKey) throws KeyNotFoundException
    {
        if (genericKey == null)
        {
            throw new KeyNotFoundException();
        }
        Mp4FieldKey mp4FieldKey = tagFieldToMp4Field.get(genericKey);
        List<TagField> list = getFields(mp4FieldKey.getFieldName());
        List<TagField> filteredList = new ArrayList<TagField>();

        if (genericKey==FieldKey.KEY)
        {
            if (list.size() == 0)
            {
                list = getFields(KEY_OLD.getFieldName());
            }
            return list;
        }
        else if(genericKey==FieldKey.GENRE)
        {
            if (list.size() == 0)
            {
                list = getFields(GENRE_CUSTOM.getFieldName());
            }
            return list;
        }
        else if(genericKey==FieldKey.TRACK)
        {
            for(TagField next:list)
            {
                Mp4TrackField trackField = (Mp4TrackField)next;
                if(trackField.getTrackNo()>0)
                {
                    filteredList.add(next);
                }
            }
            return filteredList;
        }
        else if(genericKey==FieldKey.TRACK_TOTAL)
        {
            for(TagField next:list)
            {
                Mp4TrackField trackField = (Mp4TrackField)next;
                if(trackField.getTrackTotal()>0)
                {
                    filteredList.add(next);
                }
            }
            return filteredList;
        }
        else if(genericKey==FieldKey.DISC_NO)
        {
            for(TagField next:list)
            {
                Mp4DiscNoField discNoField = (Mp4DiscNoField)next;
                if(discNoField.getDiscNo()>0)
                {
                    filteredList.add(next);
                }
            }
            return filteredList;
        }
        else if(genericKey==FieldKey.DISC_TOTAL)
        {
            for(TagField next:list)
            {
                Mp4DiscNoField discNoField = (Mp4DiscNoField)next;
                if(discNoField.getDiscTotal()>0)
                {
                    filteredList.add(next);
                }
            }
            return filteredList;
        }
        else
        {
            return list;
        }
    }

     /**
     * Maps the generic key to the specific key and return the list of values for this field as strings
     *
     * @param genericKey
     * @return
     * @throws KeyNotFoundException
     */
    public List<String> getAll(FieldKey genericKey) throws KeyNotFoundException
    {
        List<String>   values = new ArrayList<String>();
        List<TagField> fields = getFields(genericKey);
        for(TagField tagfield:fields)
        {
            if(genericKey==FieldKey.TRACK)
            {
                values.add(((Mp4TrackField)tagfield).getTrackNo().toString());
            }
            else if(genericKey==FieldKey.TRACK_TOTAL)
            {
                values.add(((Mp4TrackField)tagfield).getTrackTotal().toString());
            }
            else if(genericKey==FieldKey.DISC_NO)
            {
                values.add(((Mp4DiscNoField)tagfield).getDiscNo().toString());
            }
            else if(genericKey==FieldKey.DISC_TOTAL)
            {
                values.add(((Mp4DiscNoField)tagfield).getDiscTotal().toString());
            }
            else
            {
                values.add(tagfield.toString());
            }
        }
        return values;
    }

    /**
     * Retrieve the  values that exists for this mp4keyId (this is the internalid actually used)
     *
     *
     * @param mp4FieldKey
     * @throws org.jaudiotagger.tag.KeyNotFoundException
     * @return
     */
    public List<TagField> get(Mp4FieldKey mp4FieldKey) throws KeyNotFoundException
    {
        if (mp4FieldKey == null)
        {
            throw new KeyNotFoundException();
        }
        return super.getFields(mp4FieldKey.getFieldName());
    }

    /**
     * Retrieve the indexed value that exists for this generic key
     *
     * @param genericKey
     * @return
     */
    public String getValue(FieldKey genericKey, int index) throws KeyNotFoundException
    {
        List<TagField> fields = getFields(genericKey);
        if(fields.size()>index)
        {
            TagField field = fields.get(index);
            if(genericKey==FieldKey.TRACK)
            {
                return ((Mp4TrackField)field).getTrackNo().toString();
            }
            else if(genericKey==FieldKey.DISC_NO)
            {
                return ((Mp4DiscNoField)field).getDiscNo().toString();
            }
            else if(genericKey==FieldKey.TRACK_TOTAL)
            {
                return ((Mp4TrackField)field).getTrackTotal().toString();
            }
            else if(genericKey==FieldKey.DISC_TOTAL)
            {
                return ((Mp4DiscNoField)field).getDiscTotal().toString();
            }
            else
            {
                return field.toString();
            }
        }
        return "";
    }

  /**
     * Retrieve the first value that exists for this mp4key
     *
     * @param mp4Key
     * @return
     * @throws org.jaudiotagger.tag.KeyNotFoundException
     */
    public String getFirst(Mp4FieldKey mp4Key) throws KeyNotFoundException
    {
        if (mp4Key == null)
        {
            throw new KeyNotFoundException();
        }
        return super.getFirst(mp4Key.getFieldName());
    }

    public Mp4TagField getFirstField(FieldKey genericKey) throws KeyNotFoundException
    {
        List<TagField> fields = getFields(genericKey);
        if(fields.size() == 0)
        {
            return null;
        }
        return (Mp4TagField)fields.get(0);
    }

    public Mp4TagField getFirstField(Mp4FieldKey mp4Key) throws KeyNotFoundException
    {
        if (mp4Key == null)
        {
            throw new KeyNotFoundException();
        }
        return (Mp4TagField) super.getFirstField(mp4Key.getFieldName());
    }

    /**
     * Delete fields with this generic key
     *
     * @param genericKey
     */
    public void deleteField(FieldKey genericKey) throws KeyNotFoundException
    {
        if (genericKey == null)
        {
            throw new KeyNotFoundException();
        }

        String mp4FieldName = tagFieldToMp4Field.get(genericKey).getFieldName();
        if (genericKey == FieldKey.KEY)
        {
            deleteField(Mp4FieldKey.KEY_OLD);
            deleteField(mp4FieldName);
        }
        else if (genericKey == FieldKey.TRACK)
        {
            String trackTotal = this.getFirst(FieldKey.TRACK_TOTAL);
            if(trackTotal.length()==0)
            {
                super.deleteField(mp4FieldName);
                return;
            }
            else
            {
                Mp4TrackField field = (Mp4TrackField)this.getFirstField(FieldKey.TRACK_TOTAL);
                field.setTrackNo(0);
                return;
            }
        }
        else if (genericKey == FieldKey.TRACK_TOTAL)
        {
            String track = this.getFirst(FieldKey.TRACK);
            if(track.length()==0)
            {
                super.deleteField(mp4FieldName);
                return;
            }
            else
            {
                Mp4TrackField field = (Mp4TrackField)this.getFirstField(FieldKey.TRACK);
                field.setTrackTotal(0);
                return;
            }
        }
        else if (genericKey == FieldKey.DISC_NO)
        {
            String discTotal = this.getFirst(FieldKey.DISC_TOTAL);
            if(discTotal.length()==0)
            {
                super.deleteField(mp4FieldName);
                return;
            }
            else
            {
                Mp4DiscNoField field = (Mp4DiscNoField)this.getFirstField(FieldKey.DISC_TOTAL);
                field.setDiscNo(0);
                return;
            }
        }
        else if (genericKey == FieldKey.DISC_TOTAL)
        {
            String discno = this.getFirst(FieldKey.DISC_NO);
            if(discno.length()==0)
            {
                super.deleteField(mp4FieldName);
                return;
            }
            else
            {
                Mp4DiscNoField field = (Mp4DiscNoField)this.getFirstField(FieldKey.DISC_NO);
                field.setDiscTotal(0);
                return;
            }
        }
        else if(genericKey == FieldKey.GENRE)
        {
            super.deleteField(Mp4FieldKey.GENRE.getFieldName());
            super.deleteField(Mp4FieldKey.GENRE_CUSTOM.getFieldName());
        }
        else
        {
            super.deleteField(mp4FieldName);
        }
    }

    /**
     * Delete fields with this mp4key
     *
     * @param mp4Key
     * @throws org.jaudiotagger.tag.KeyNotFoundException
     */
    public void deleteField(Mp4FieldKey mp4Key) throws KeyNotFoundException
    {
        if (mp4Key == null)
        {
            throw new KeyNotFoundException();
        }
        super.deleteField(mp4Key.getFieldName());
    }

    /**
     * Create artwork field
     *
     * @param data raw image data
     * @return
     * @throws org.jaudiotagger.tag.FieldDataInvalidException
     */
    public TagField createArtworkField(byte[] data)
    {
        return new Mp4TagCoverField(data);
    }

     /**
     * Create artwork field
     *    
     * @return
     */
    public TagField createField(Artwork artwork) throws FieldDataInvalidException
    {
        return new Mp4TagCoverField(artwork.getBinaryData());
    }

    /**
     * Create new field and add it to the tag, with special handling for trackNo, discNo fields as we dont want multiple
     * fields to be created for these fields
     *
     * @param genericKey
     * @param value
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    @Override
    public void addField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException
    {
        if(
            (genericKey==FieldKey.TRACK)||
            (genericKey==FieldKey.TRACK_TOTAL)||
            (genericKey==FieldKey.DISC_NO)||
            (genericKey==FieldKey.DISC_TOTAL)
            )
        {
            setField(genericKey, value);
        }
        else
        {
            TagField tagfield = createField(genericKey,value);
            addField(tagfield);
        }
    }

    /**
     * Create Tag Field using generic key
     *
     * This should use the correct subclass for the key
     *
     * @param genericKey
     * @param values
     * @return
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    @Override
    public TagField createField(FieldKey genericKey, String... values) throws KeyNotFoundException, FieldDataInvalidException
    {
        if (values == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        if (genericKey == null)
        {
            throw new KeyNotFoundException();
        }

        String value = values[0];

        //Special handling for these number fields because multiple generic keys map to a single mp4 field
        if(
                (genericKey == FieldKey.TRACK)||
                (genericKey == FieldKey.TRACK_TOTAL)||
                (genericKey == FieldKey.DISC_NO)||
                (genericKey == FieldKey.DISC_TOTAL)
            )
        {
            try
            {
                int number = Integer.parseInt(value);
                if(genericKey== FieldKey.TRACK)
                {
                    return new Mp4TrackField(number);
                }
                else if(genericKey== FieldKey.TRACK_TOTAL)
                {
                    return new Mp4TrackField(0,number);
                }
                else if(genericKey== FieldKey.DISC_NO)
                {
                    return new Mp4DiscNoField(number);
                }
                else if(genericKey== FieldKey.DISC_TOTAL)
                {
                    return new Mp4DiscNoField(0,number);
                }
            }
            catch(NumberFormatException nfe)
            {
                //If not number we want to convert to an expected exception (which is not a RuntimeException)
                //so can be handled properly by calling program
                throw new FieldDataInvalidException("Value "+value + " is not a number as required",nfe);
            }
        }
        else if (genericKey == FieldKey.GENRE)
        {
            //Always write as text
            if(TagOptionSingleton.getInstance().isWriteMp4GenresAsText())
            {
                return new Mp4TagTextField(GENRE_CUSTOM.getFieldName(), value);
            }

            if (Mp4GenreField.isValidGenre(value))
            {
                return new Mp4GenreField(value);
            }
            else
            {
                return new Mp4TagTextField(GENRE_CUSTOM.getFieldName(), value);
            }
        }
        //Default for all other fields
        return createField(tagFieldToMp4Field.get(genericKey), value);
    }

    /**
     * Overidden to ensure cannot have both a genre field and a custom genre field
     *
     * @param genericKey
     * @param value
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    @Override
    public void setField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException
    {
        TagField tagfield = createField(genericKey,value);

        if(genericKey==FieldKey.GENRE)
        {
            if(tagfield.getId().equals(GENRE.getFieldName()))
            {
                this.deleteField(Mp4FieldKey.GENRE_CUSTOM);
            }
            else if(tagfield.getId().equals(GENRE_CUSTOM.getFieldName()))
            {
                this.deleteField(Mp4FieldKey.GENRE);
            }
        }
        setField(tagfield);
    }

    /**
     * Set mp4 field
     * @param fieldKey
     * @param value
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    public void setField(Mp4FieldKey fieldKey, String value) throws KeyNotFoundException, FieldDataInvalidException
    {
        TagField tagfield = createField(fieldKey,value);
        setField(tagfield);
    }
    /**
     * Set field, special handling for track and disc because they hold two fields
     * 
     * @param field
     */
    @Override
    public void setField(TagField field)
    {
        if (field == null)
        {
            return;
        }

        if(field.getId().equals(TRACK.getFieldName()))
        {
            List<TagField> list = fields.get(field.getId());
            if(list==null||list.size()==0)
            {
                 super.setField(field);
            }
            else
            {
                Mp4TrackField existingTrackField = (Mp4TrackField)list.get(0);
                Mp4TrackField newTrackField      = (Mp4TrackField)field;
                Short trackNo    = existingTrackField.getTrackNo();
                Short trackTotal = existingTrackField.getTrackTotal();
                if(newTrackField.getTrackNo()>0 )
                {
                    trackNo = newTrackField.getTrackNo();
                }
                if(newTrackField.getTrackTotal()>0 )
                {
                    trackTotal = newTrackField.getTrackTotal();
                }

                Mp4TrackField mergedTrackField = new Mp4TrackField(trackNo,trackTotal);
                super.setField(mergedTrackField);
            }
        }
        else if(field.getId().equals(DISCNUMBER.getFieldName()))
        {
            List<TagField> list = fields.get(field.getId());
            if(list==null||list.size()==0)
            {
                 super.setField(field);
            }
            else
            {
                Mp4DiscNoField existingDiscNoField = (Mp4DiscNoField)list.get(0);
                Mp4DiscNoField newDiscNoField      = (Mp4DiscNoField)field;
                Short discNo    = existingDiscNoField.getDiscNo();
                Short discTotal = existingDiscNoField.getDiscTotal();
                if(newDiscNoField.getDiscNo()>0 )
                {
                    discNo = newDiscNoField.getDiscNo();
                }
                if(newDiscNoField.getDiscTotal()>0 )
                {
                    discTotal = newDiscNoField.getDiscTotal();
                }

                Mp4DiscNoField mergedDiscNoField = new Mp4DiscNoField(discNo,discTotal);
                super.setField(mergedDiscNoField);
            }
        }
        else
        {
            super.setField(field);
        }
    }

    /**
     * Create Tag Field using mp4 key
     *
     * Uses the correct subclass for the key
     *
     * @param mp4FieldKey
     * @param value
     * @return
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    public TagField createField(Mp4FieldKey mp4FieldKey, String value) throws KeyNotFoundException, FieldDataInvalidException
    {
        if (value == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        if (mp4FieldKey == null)
        {
            throw new KeyNotFoundException();
        }

        //This is boolean stored as 1, but calling program might setField as 'true' so we handle this
        //case internally , any other values it is set to we treat as false
        if(mp4FieldKey==Mp4FieldKey.COMPILATION)
        {
            if(value.equalsIgnoreCase("true") || value.equals("1"))
            {
                return createCompilationField(true);
            }
            else
            {
                return createCompilationField(false);
            }
        }
        else if(mp4FieldKey==Mp4FieldKey.GENRE)
        {
            if (Mp4GenreField.isValidGenre(value))
            {
                return new Mp4GenreField(value);
            }
            else
            {
                throw new IllegalArgumentException(ErrorMessage.NOT_STANDARD_MP$_GENRE.getMsg());
            }
        }
        else if(mp4FieldKey==Mp4FieldKey.GENRE_CUSTOM)
        {
            return new Mp4TagTextField(GENRE_CUSTOM.getFieldName(), value);
        }
        else if(mp4FieldKey.getSubClassFieldType()==Mp4TagFieldSubType.DISC_NO)
        {
            return new Mp4DiscNoField(value);
        }
        else if(mp4FieldKey.getSubClassFieldType()==Mp4TagFieldSubType.TRACK_NO)
        {
            return new Mp4TrackField(value);
        }
        else if(mp4FieldKey.getSubClassFieldType()==Mp4TagFieldSubType.BYTE)
        {
            return new Mp4TagByteField(mp4FieldKey, value, mp4FieldKey.getFieldLength());
        }
        else if(mp4FieldKey.getSubClassFieldType()==Mp4TagFieldSubType.NUMBER)
        {
            return new Mp4TagTextNumberField(mp4FieldKey.getFieldName(), value);
        }
        else if(mp4FieldKey.getSubClassFieldType()==Mp4TagFieldSubType.REVERSE_DNS)
        {
            return new Mp4TagReverseDnsField(mp4FieldKey, value);
        }
        else if(mp4FieldKey.getSubClassFieldType()==Mp4TagFieldSubType.ARTWORK)
        {
            throw new UnsupportedOperationException(ErrorMessage.ARTWORK_CANNOT_BE_CREATED_WITH_THIS_METHOD.getMsg());
        }
        else if(mp4FieldKey.getSubClassFieldType()==Mp4TagFieldSubType.TEXT)
        {
            return new Mp4TagTextField(mp4FieldKey.getFieldName(), value);
        }
        else if(mp4FieldKey.getSubClassFieldType()==Mp4TagFieldSubType.UNKNOWN)
        {
            throw new UnsupportedOperationException(ErrorMessage.DO_NOT_KNOW_HOW_TO_CREATE_THIS_ATOM_TYPE.getMsg(mp4FieldKey.getFieldName()));
        }
        else
        {
            throw new UnsupportedOperationException(ErrorMessage.DO_NOT_KNOW_HOW_TO_CREATE_THIS_ATOM_TYPE.getMsg(mp4FieldKey.getFieldName()));
        }
    }

    public List<Artwork> getArtworkList()
    {
        List<TagField> coverartList = get(Mp4FieldKey.ARTWORK);
        List<Artwork> artworkList = new ArrayList<Artwork>(coverartList.size());

        for(TagField next:coverartList)
        {
            Mp4TagCoverField mp4CoverArt = (Mp4TagCoverField)next;
            Artwork artwork = ArtworkFactory.getNew();
            artwork.setBinaryData(mp4CoverArt.getData());
            artwork.setMimeType(Mp4TagCoverField.getMimeTypeForImageType(mp4CoverArt.getFieldType()));
            artworkList.add(artwork);
        }
        return artworkList;
    }

    public TagField createCompilationField(boolean origValue) throws KeyNotFoundException, FieldDataInvalidException
    {
        String value = "";
        if(origValue)
        {
            value=Mp4TagByteField.TRUE_VALUE;
            return new Mp4TagByteField(Mp4FieldKey.COMPILATION, value, Mp4FieldKey.COMPILATION.getFieldLength());
        }
        else
        {
            value=Mp4TagByteField.FALSE_VALUE;
            return new Mp4TagByteField(Mp4FieldKey.COMPILATION, value, Mp4FieldKey.COMPILATION.getFieldLength());
        }
    }
}
