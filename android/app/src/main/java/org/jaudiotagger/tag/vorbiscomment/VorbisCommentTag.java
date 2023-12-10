/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Rapha�l Slinckx <raphael@slinckx.net>
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
package org.jaudiotagger.tag.vorbiscomment;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.flac.metadatablock.MetadataBlockDataPicture;
import org.jaudiotagger.audio.generic.AbstractTag;
import org.jaudiotagger.audio.ogg.util.VorbisHeader;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.*;
import org.jaudiotagger.tag.images.Artwork;
import org.jaudiotagger.tag.images.ArtworkFactory;
import org.jaudiotagger.tag.vorbiscomment.util.Base64Coder;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;

import static org.jaudiotagger.tag.vorbiscomment.VorbisCommentFieldKey.VENDOR;

/**
 * This is the logical representation of  Vorbis Comment Data
 */
public class VorbisCommentTag extends AbstractTag
{
    private static EnumMap<FieldKey, VorbisCommentFieldKey> tagFieldToOggField = new EnumMap<FieldKey, VorbisCommentFieldKey>(FieldKey.class);

    static
    {
        tagFieldToOggField.put(FieldKey.ACOUSTID_FINGERPRINT, VorbisCommentFieldKey.ACOUSTID_FINGERPRINT);
        tagFieldToOggField.put(FieldKey.ACOUSTID_ID, VorbisCommentFieldKey.ACOUSTID_ID);
        tagFieldToOggField.put(FieldKey.ALBUM, VorbisCommentFieldKey.ALBUM);
        tagFieldToOggField.put(FieldKey.ALBUM_ARTIST, VorbisCommentFieldKey.ALBUMARTIST);
        tagFieldToOggField.put(FieldKey.ALBUM_ARTISTS, VorbisCommentFieldKey.ALBUMARTISTS);
        tagFieldToOggField.put(FieldKey.ALBUM_ARTISTS_SORT, VorbisCommentFieldKey.ALBUMARTISTSSORT);
        tagFieldToOggField.put(FieldKey.ALBUM_ARTIST_SORT, VorbisCommentFieldKey.ALBUMARTISTSORT);
        tagFieldToOggField.put(FieldKey.ALBUM_SORT, VorbisCommentFieldKey.ALBUMSORT);
        tagFieldToOggField.put(FieldKey.AMAZON_ID, VorbisCommentFieldKey.ASIN);
        tagFieldToOggField.put(FieldKey.ARRANGER, VorbisCommentFieldKey.ARRANGER);
        tagFieldToOggField.put(FieldKey.ARRANGER_SORT, VorbisCommentFieldKey.ARRANGER_SORT);
        tagFieldToOggField.put(FieldKey.ARTIST, VorbisCommentFieldKey.ARTIST);
        tagFieldToOggField.put(FieldKey.ARTISTS, VorbisCommentFieldKey.ARTISTS);
        tagFieldToOggField.put(FieldKey.ARTISTS_SORT, VorbisCommentFieldKey.ARTISTS_SORT);
        tagFieldToOggField.put(FieldKey.ARTIST_SORT, VorbisCommentFieldKey.ARTISTSORT);
        tagFieldToOggField.put(FieldKey.BARCODE, VorbisCommentFieldKey.BARCODE);
        tagFieldToOggField.put(FieldKey.BPM, VorbisCommentFieldKey.BPM);
        tagFieldToOggField.put(FieldKey.CATALOG_NO, VorbisCommentFieldKey.CATALOGNUMBER);
        tagFieldToOggField.put(FieldKey.CHOIR, VorbisCommentFieldKey.CHOIR);
        tagFieldToOggField.put(FieldKey.CHOIR_SORT, VorbisCommentFieldKey.CHOIR_SORT);
        tagFieldToOggField.put(FieldKey.CLASSICAL_CATALOG, VorbisCommentFieldKey.CLASSICAL_CATALOG);
        tagFieldToOggField.put(FieldKey.CLASSICAL_NICKNAME, VorbisCommentFieldKey.CLASSICAL_NICKNAME);
        tagFieldToOggField.put(FieldKey.COMMENT, VorbisCommentFieldKey.COMMENT);
        tagFieldToOggField.put(FieldKey.COMPOSER, VorbisCommentFieldKey.COMPOSER);
        tagFieldToOggField.put(FieldKey.COMPOSER_SORT, VorbisCommentFieldKey.COMPOSERSORT);
        tagFieldToOggField.put(FieldKey.COPYRIGHT, VorbisCommentFieldKey.COPYRIGHT);
        tagFieldToOggField.put(FieldKey.CONDUCTOR, VorbisCommentFieldKey.CONDUCTOR);
        tagFieldToOggField.put(FieldKey.CONDUCTOR_SORT, VorbisCommentFieldKey.CONDUCTOR_SORT);
        tagFieldToOggField.put(FieldKey.COUNTRY, VorbisCommentFieldKey.COUNTRY);
        tagFieldToOggField.put(FieldKey.COVER_ART, VorbisCommentFieldKey.METADATA_BLOCK_PICTURE);
        tagFieldToOggField.put(FieldKey.CUSTOM1, VorbisCommentFieldKey.CUSTOM1);
        tagFieldToOggField.put(FieldKey.CUSTOM2, VorbisCommentFieldKey.CUSTOM2);
        tagFieldToOggField.put(FieldKey.CUSTOM3, VorbisCommentFieldKey.CUSTOM3);
        tagFieldToOggField.put(FieldKey.CUSTOM4, VorbisCommentFieldKey.CUSTOM4);
        tagFieldToOggField.put(FieldKey.CUSTOM5, VorbisCommentFieldKey.CUSTOM5);
        tagFieldToOggField.put(FieldKey.DISC_NO, VorbisCommentFieldKey.DISCNUMBER);
        tagFieldToOggField.put(FieldKey.DISC_SUBTITLE, VorbisCommentFieldKey.DISCSUBTITLE);
        tagFieldToOggField.put(FieldKey.DISC_TOTAL, VorbisCommentFieldKey.DISCTOTAL);
        tagFieldToOggField.put(FieldKey.DJMIXER, VorbisCommentFieldKey.DJMIXER);
        tagFieldToOggField.put(FieldKey.ENCODER, VorbisCommentFieldKey.VENDOR);     //Known as vendor in VorbisComment
        tagFieldToOggField.put(FieldKey.ENGINEER, VorbisCommentFieldKey.ENGINEER);
        tagFieldToOggField.put(FieldKey.ENSEMBLE, VorbisCommentFieldKey.ENSEMBLE);
        tagFieldToOggField.put(FieldKey.ENSEMBLE_SORT, VorbisCommentFieldKey.ENSEMBLE_SORT);
        tagFieldToOggField.put(FieldKey.FBPM, VorbisCommentFieldKey.FBPM);
        tagFieldToOggField.put(FieldKey.GENRE, VorbisCommentFieldKey.GENRE);
        tagFieldToOggField.put(FieldKey.GROUP, VorbisCommentFieldKey.GROUP);
        tagFieldToOggField.put(FieldKey.GROUPING, VorbisCommentFieldKey.GROUPING);
        tagFieldToOggField.put(FieldKey.INSTRUMENT, VorbisCommentFieldKey.INSTRUMENT);
        tagFieldToOggField.put(FieldKey.INVOLVED_PERSON, VorbisCommentFieldKey.INVOLVED_PERSON);
        tagFieldToOggField.put(FieldKey.ISRC, VorbisCommentFieldKey.ISRC);
        tagFieldToOggField.put(FieldKey.IS_CLASSICAL, VorbisCommentFieldKey.IS_CLASSICAL);
        tagFieldToOggField.put(FieldKey.IS_COMPILATION, VorbisCommentFieldKey.COMPILATION);
        tagFieldToOggField.put(FieldKey.IS_SOUNDTRACK, VorbisCommentFieldKey.IS_SOUNDTRACK);
        tagFieldToOggField.put(FieldKey.KEY, VorbisCommentFieldKey.KEY);
        tagFieldToOggField.put(FieldKey.LANGUAGE, VorbisCommentFieldKey.LANGUAGE);
        tagFieldToOggField.put(FieldKey.LYRICIST, VorbisCommentFieldKey.LYRICIST);
        tagFieldToOggField.put(FieldKey.LYRICS, VorbisCommentFieldKey.LYRICS);
        tagFieldToOggField.put(FieldKey.MEDIA, VorbisCommentFieldKey.MEDIA);
        tagFieldToOggField.put(FieldKey.MIXER, VorbisCommentFieldKey.MIXER);
        tagFieldToOggField.put(FieldKey.MOOD, VorbisCommentFieldKey.MOOD);
        tagFieldToOggField.put(FieldKey.MOOD_ACOUSTIC, VorbisCommentFieldKey.MOOD_ACOUSTIC);
        tagFieldToOggField.put(FieldKey.MOOD_AGGRESSIVE, VorbisCommentFieldKey.MOOD_AGGRESSIVE);
        tagFieldToOggField.put(FieldKey.MOOD_AROUSAL, VorbisCommentFieldKey.MOOD_AROUSAL);
        tagFieldToOggField.put(FieldKey.MOOD_DANCEABILITY, VorbisCommentFieldKey.MOOD_DANCEABILITY);
        tagFieldToOggField.put(FieldKey.MOOD_ELECTRONIC, VorbisCommentFieldKey.MOOD_ELECTRONIC);
        tagFieldToOggField.put(FieldKey.MOOD_HAPPY, VorbisCommentFieldKey.MOOD_HAPPY);
        tagFieldToOggField.put(FieldKey.MOOD_INSTRUMENTAL, VorbisCommentFieldKey.MOOD_INSTRUMENTAL);
        tagFieldToOggField.put(FieldKey.MOOD_PARTY, VorbisCommentFieldKey.MOOD_PARTY);
        tagFieldToOggField.put(FieldKey.MOOD_RELAXED, VorbisCommentFieldKey.MOOD_RELAXED);
        tagFieldToOggField.put(FieldKey.MOOD_SAD, VorbisCommentFieldKey.MOOD_SAD);
        tagFieldToOggField.put(FieldKey.MOOD_VALENCE, VorbisCommentFieldKey.MOOD_VALENCE);
        tagFieldToOggField.put(FieldKey.MOVEMENT, VorbisCommentFieldKey.MOVEMENT);
        tagFieldToOggField.put(FieldKey.MOVEMENT_NO, VorbisCommentFieldKey.MOVEMENT_NO);
        tagFieldToOggField.put(FieldKey.MOVEMENT_TOTAL, VorbisCommentFieldKey.MOVEMENT_TOTAL);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_ARTISTID, VorbisCommentFieldKey.MUSICBRAINZ_ARTISTID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_DISC_ID, VorbisCommentFieldKey.MUSICBRAINZ_DISCID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_ORIGINAL_RELEASE_ID, VorbisCommentFieldKey.MUSICBRAINZ_ORIGINAL_ALBUMID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_RELEASEARTISTID, VorbisCommentFieldKey.MUSICBRAINZ_ALBUMARTISTID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_RELEASEID, VorbisCommentFieldKey.MUSICBRAINZ_ALBUMID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_RELEASE_COUNTRY, VorbisCommentFieldKey.RELEASECOUNTRY);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_RELEASE_GROUP_ID, VorbisCommentFieldKey.MUSICBRAINZ_RELEASEGROUPID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_RELEASE_STATUS, VorbisCommentFieldKey.MUSICBRAINZ_ALBUMSTATUS);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_RELEASE_TRACK_ID, VorbisCommentFieldKey.MUSICBRAINZ_RELEASETRACKID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_RELEASE_TYPE, VorbisCommentFieldKey.MUSICBRAINZ_ALBUMTYPE);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_TRACK_ID, VorbisCommentFieldKey.MUSICBRAINZ_TRACKID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK, VorbisCommentFieldKey.MUSICBRAINZ_WORK);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_COMPOSITION, VorbisCommentFieldKey.MUSICBRAINZ_WORK_COMPOSITION);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_COMPOSITION_ID, VorbisCommentFieldKey.MUSICBRAINZ_WORK_COMPOSITION_ID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_ID, VorbisCommentFieldKey.MUSICBRAINZ_WORKID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL1);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_ID, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_ID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_TYPE, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_TYPE);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL2);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_ID, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_ID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_TYPE, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_TYPE);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL3);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_ID, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_ID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_TYPE, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_TYPE);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL4);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_ID, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_ID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_TYPE, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_TYPE);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL5);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_ID, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_ID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_TYPE, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_TYPE);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL6);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_ID, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_ID);
        tagFieldToOggField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_TYPE, VorbisCommentFieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_TYPE);
        tagFieldToOggField.put(FieldKey.MUSICIP_ID, VorbisCommentFieldKey.MUSICIP_PUID);
        tagFieldToOggField.put(FieldKey.OCCASION, VorbisCommentFieldKey.OCCASION);
        tagFieldToOggField.put(FieldKey.OPUS, VorbisCommentFieldKey.OPUS);
        tagFieldToOggField.put(FieldKey.ORCHESTRA, VorbisCommentFieldKey.ORCHESTRA);
        tagFieldToOggField.put(FieldKey.ORCHESTRA_SORT, VorbisCommentFieldKey.ORCHESTRA_SORT);
        tagFieldToOggField.put(FieldKey.ORIGINAL_ALBUM, VorbisCommentFieldKey.ORIGINAL_ALBUM);
        tagFieldToOggField.put(FieldKey.ORIGINAL_ARTIST, VorbisCommentFieldKey.ORIGINAL_ARTIST);
        tagFieldToOggField.put(FieldKey.ORIGINAL_LYRICIST, VorbisCommentFieldKey.ORIGINAL_LYRICIST);
        tagFieldToOggField.put(FieldKey.ORIGINAL_YEAR, VorbisCommentFieldKey.ORIGINAL_YEAR);
        tagFieldToOggField.put(FieldKey.PART, VorbisCommentFieldKey.PART);
        tagFieldToOggField.put(FieldKey.PART_NUMBER, VorbisCommentFieldKey.PART_NUMBER);
        tagFieldToOggField.put(FieldKey.PART_TYPE, VorbisCommentFieldKey.PART_TYPE);
        tagFieldToOggField.put(FieldKey.PERFORMER, VorbisCommentFieldKey.PERFORMER);
        tagFieldToOggField.put(FieldKey.PERFORMER_NAME, VorbisCommentFieldKey.PERFORMER_NAME);
        tagFieldToOggField.put(FieldKey.PERFORMER_NAME_SORT, VorbisCommentFieldKey.PERFORMER_NAME_SORT);
        tagFieldToOggField.put(FieldKey.PERIOD, VorbisCommentFieldKey.PERIOD);
        tagFieldToOggField.put(FieldKey.PRODUCER, VorbisCommentFieldKey.PRODUCER);
        tagFieldToOggField.put(FieldKey.QUALITY, VorbisCommentFieldKey.QUALITY);
        tagFieldToOggField.put(FieldKey.RANKING, VorbisCommentFieldKey.RANKING);
        tagFieldToOggField.put(FieldKey.RATING, VorbisCommentFieldKey.RATING);
        tagFieldToOggField.put(FieldKey.RECORD_LABEL, VorbisCommentFieldKey.LABEL);
        tagFieldToOggField.put(FieldKey.REMIXER, VorbisCommentFieldKey.REMIXER);
        tagFieldToOggField.put(FieldKey.SCRIPT, VorbisCommentFieldKey.SCRIPT);
        tagFieldToOggField.put(FieldKey.SINGLE_DISC_TRACK_NO, VorbisCommentFieldKey.SINGLE_DISC_TRACK_NO);
        tagFieldToOggField.put(FieldKey.SUBTITLE, VorbisCommentFieldKey.SUBTITLE);
        tagFieldToOggField.put(FieldKey.TAGS, VorbisCommentFieldKey.TAGS);
        tagFieldToOggField.put(FieldKey.TEMPO, VorbisCommentFieldKey.TEMPO);
        tagFieldToOggField.put(FieldKey.TIMBRE, VorbisCommentFieldKey.TIMBRE);
        tagFieldToOggField.put(FieldKey.TITLE, VorbisCommentFieldKey.TITLE);
        tagFieldToOggField.put(FieldKey.TITLE_MOVEMENT, VorbisCommentFieldKey.TITLE_MOVEMENT);
        tagFieldToOggField.put(FieldKey.TITLE_SORT, VorbisCommentFieldKey.TITLESORT);
        tagFieldToOggField.put(FieldKey.TONALITY, VorbisCommentFieldKey.TONALITY);
        tagFieldToOggField.put(FieldKey.TRACK, VorbisCommentFieldKey.TRACKNUMBER);
        tagFieldToOggField.put(FieldKey.TRACK_TOTAL, VorbisCommentFieldKey.TRACKTOTAL);
        tagFieldToOggField.put(FieldKey.URL_DISCOGS_ARTIST_SITE, VorbisCommentFieldKey.URL_DISCOGS_ARTIST_SITE);
        tagFieldToOggField.put(FieldKey.URL_DISCOGS_RELEASE_SITE, VorbisCommentFieldKey.URL_DISCOGS_RELEASE_SITE);
        tagFieldToOggField.put(FieldKey.URL_LYRICS_SITE, VorbisCommentFieldKey.URL_LYRICS_SITE);
        tagFieldToOggField.put(FieldKey.URL_OFFICIAL_ARTIST_SITE, VorbisCommentFieldKey.URL_OFFICIAL_ARTIST_SITE);
        tagFieldToOggField.put(FieldKey.URL_OFFICIAL_RELEASE_SITE, VorbisCommentFieldKey.URL_OFFICIAL_RELEASE_SITE);
        tagFieldToOggField.put(FieldKey.URL_WIKIPEDIA_ARTIST_SITE, VorbisCommentFieldKey.URL_WIKIPEDIA_ARTIST_SITE);
        tagFieldToOggField.put(FieldKey.URL_WIKIPEDIA_RELEASE_SITE, VorbisCommentFieldKey.URL_WIKIPEDIA_RELEASE_SITE);
        tagFieldToOggField.put(FieldKey.WORK, VorbisCommentFieldKey.WORK);
        tagFieldToOggField.put(FieldKey.WORK_TYPE, VorbisCommentFieldKey.WORK_TYPE);
        tagFieldToOggField.put(FieldKey.YEAR, VorbisCommentFieldKey.DATE);
    }


    //This is the vendor string that will be written if no other is supplied. Should be the name of the software
    //that actually encoded the file in the first place.
    public static final String DEFAULT_VENDOR = "jaudiotagger";

    /**
     * Only used within Package, hidden because it doesnt set Vendor
     * which should be done when created by end user
     */
    public VorbisCommentTag()
    {

    }

    /**
     * Use to construct a new tag properly initialized
     *
     * @return
     */
    public static VorbisCommentTag createNewTag()
    {
        VorbisCommentTag tag = new VorbisCommentTag();
        tag.setVendor(DEFAULT_VENDOR);
        return tag;
    }

    /**
     * @return the vendor, generically known as the encoder
     */
    public String getVendor()
    {
        return getFirst(VENDOR.getFieldName());
    }

    /**
     * Set the vendor, known as the encoder  generally
     *
     * We dont want this to be blank, when written to file this field is written to a different location
     * to all other fields but user of library can just reat it as another field
     *
     * @param vendor
     */
    public void setVendor(String vendor)
    {
        if (vendor == null)
        {
            vendor = DEFAULT_VENDOR;
        }
        super.setField(new VorbisCommentTagField(VENDOR.getFieldName(), vendor));
    }

    protected boolean isAllowedEncoding(Charset enc)
    {
        return enc.equals(VorbisHeader.CHARSET_UTF_8);
    }

    public String toString()
    {
        return "OGG " + super.toString();
    }

    /**
     * Create Tag Field using generic key
     */
    @Override
    public TagField createField(FieldKey genericKey, String... values) throws KeyNotFoundException,FieldDataInvalidException
    {
        if (genericKey == null)
        {
            throw new KeyNotFoundException();
        }

        return createField(tagFieldToOggField.get(genericKey), values[0]);
    }

    /**
     * Create Tag Field using ogg key
     *
     * @param vorbisCommentFieldKey
     * @param value
     * @return
     * @throws org.jaudiotagger.tag.KeyNotFoundException
     * @throws org.jaudiotagger.tag.FieldDataInvalidException
     */
    public TagField createField(VorbisCommentFieldKey vorbisCommentFieldKey, String value) throws KeyNotFoundException,FieldDataInvalidException
    {
        if (value == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        if (vorbisCommentFieldKey == null)
        {
            throw new KeyNotFoundException();
        }

        return new VorbisCommentTagField(vorbisCommentFieldKey.getFieldName(), value);
    }

    /**
     * Create Tag Field using ogg key
     *
     * This method is provided to allow you to create key of any value because VorbisComment allows
     * arbitary keys.
     *
     * @param vorbisCommentFieldKey
     * @param value
     * @return
     */
    public TagField createField(String vorbisCommentFieldKey, String value)
    {
        if (value == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        return new VorbisCommentTagField(vorbisCommentFieldKey, value);
    }

    /**
     * Maps the generic key to the ogg key and return the list of values for this field
     *
     * @param genericKey
     */
    public List<TagField> getFields(FieldKey genericKey) throws KeyNotFoundException
    {
        VorbisCommentFieldKey vorbisCommentFieldKey = tagFieldToOggField.get(genericKey);
        if (vorbisCommentFieldKey == null)
        {
            throw new KeyNotFoundException();
        }
        return super.getFields(vorbisCommentFieldKey.getFieldName());
    }


    /**
     * Maps the generic key to the ogg key and return the list of values for this field as strings
     *
     * @param genericKey
     * @return
     * @throws KeyNotFoundException
     */
    public List<String> getAll(FieldKey genericKey) throws KeyNotFoundException
    {
        VorbisCommentFieldKey vorbisCommentFieldKey = tagFieldToOggField.get(genericKey);
        if (vorbisCommentFieldKey == null)
        {
            throw new KeyNotFoundException();
        }
        return super.getAll(vorbisCommentFieldKey.getFieldName());
    }

    /**
     * Retrieve the first value that exists for this vorbis comment key
     *
     * @param vorbisCommentKey
     * @return
     * @throws org.jaudiotagger.tag.KeyNotFoundException
     */
    public List<TagField> get(VorbisCommentFieldKey vorbisCommentKey) throws KeyNotFoundException
    {
        if (vorbisCommentKey == null)
        {
            throw new KeyNotFoundException();
        }
        return super.getFields(vorbisCommentKey.getFieldName());
    }


    /**
     * Retrieve the first value that exists for this vorbis comment key
     *
     * @param vorbisCommentKey
     * @return
     * @throws org.jaudiotagger.tag.KeyNotFoundException
     */
    public String getFirst(VorbisCommentFieldKey vorbisCommentKey) throws KeyNotFoundException
    {
        if (vorbisCommentKey == null)
        {
            throw new KeyNotFoundException();
        }
        return super.getFirst(vorbisCommentKey.getFieldName());
    }

    /**
     *
     * @param genericKey
     * @return
     */
    public boolean hasField(FieldKey genericKey)
    {
        VorbisCommentFieldKey vorbisFieldKey = tagFieldToOggField.get(genericKey);
        return getFields(vorbisFieldKey.getFieldName()).size() != 0;
    }

    /**
     *
     * @param vorbisFieldKey
     * @return
     */
    public boolean hasField(VorbisCommentFieldKey vorbisFieldKey)
    {
        return getFields(vorbisFieldKey.getFieldName()).size() != 0;
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

        if(genericKey==FieldKey.ALBUM_ARTIST)
        {
            switch(TagOptionSingleton.getInstance().getVorbisAlbumArtistSaveOptions())
            {
                case WRITE_ALBUMARTIST:
                case WRITE_ALBUMARTIST_AND_DELETE_JRIVER_ALBUMARTIST:
                {
                    VorbisCommentFieldKey vorbisCommentFieldKey = tagFieldToOggField.get(genericKey);
                    deleteField(vorbisCommentFieldKey);
                    return;
                }

                case WRITE_JRIVER_ALBUMARTIST:
                case WRITE_JRIVER_ALBUMARTIST_AND_DELETE_ALBUMARTIST:
                {
                    deleteField(VorbisCommentFieldKey.ALBUMARTIST_JRIVER);
                    return;
                }

                case WRITE_BOTH:
                {
                    VorbisCommentFieldKey vorbisCommentFieldKey = tagFieldToOggField.get(genericKey);
                    deleteField(vorbisCommentFieldKey);
                    deleteField(VorbisCommentFieldKey.ALBUMARTIST_JRIVER);
                    return;
                }

            }
        }
        else
        {
            VorbisCommentFieldKey vorbisCommentFieldKey = tagFieldToOggField.get(genericKey);
            deleteField(vorbisCommentFieldKey);
        }
    }

    /**
     * Delete fields with this vorbisCommentFieldKey
     *
     * @param vorbisCommentFieldKey
     * @throws org.jaudiotagger.tag.KeyNotFoundException
     */
    public void deleteField(VorbisCommentFieldKey vorbisCommentFieldKey) throws KeyNotFoundException
    {
        if (vorbisCommentFieldKey == null)
        {
            throw new KeyNotFoundException();
        }
        super.deleteField(vorbisCommentFieldKey.getFieldName());
    }



    /**
     * Retrieve artwork raw data when using the deprecated COVERART format
     *
     * @return
     */
    public byte[] getArtworkBinaryData()
    {
        String base64data = this.getFirst(VorbisCommentFieldKey.COVERART);
        byte[] rawdata = Base64Coder.decode(base64data.toCharArray());
        return rawdata;
    }

    /**
     * Retrieve artwork mimeType when using deprecated COVERART format
     *
     * @return mimetype
     */
    public String getArtworkMimeType()
    {
        return this.getFirst(VorbisCommentFieldKey.COVERARTMIME);
    }

    /**
     * Is this tag empty
     *
     * <p>Overridden because check for size of one because there is always a vendor tag unless just
     * created an empty vorbis tag as part of flac tag in which case size could be zero
     *
     * @see Tag#isEmpty()
     */
    public boolean isEmpty()
    {
        return fields.size() <= 1;
    }

    /**
     * Add Field
     *
     * <p>Overidden because there can only be one vendor set
     *
     * @param field
     */
    public void addField(TagField field)
    {
        if (field.getId().equals(VorbisCommentFieldKey.VENDOR.getFieldName()))
        {
            super.setField(field);
        }
        else
        {
            super.addField(field);
        }
    }

     public TagField getFirstField(FieldKey genericKey) throws KeyNotFoundException
    {
        if (genericKey == null)
        {
            throw new KeyNotFoundException();
        }
        return getFirstField(tagFieldToOggField.get(genericKey).getFieldName());
    }

    /**
     *
     * @return list of artwork images
     */
    public List<Artwork> getArtworkList()
    {
        List<Artwork>  artworkList  = new ArrayList<Artwork>(1);

        //Read Old Format
        if(getArtworkBinaryData()!=null & getArtworkBinaryData().length>0)
        {
            Artwork artwork= ArtworkFactory.getNew();
            artwork.setMimeType(getArtworkMimeType());
            artwork.setBinaryData(getArtworkBinaryData());
            artworkList.add(artwork);
        }

        //New Format (Supports Multiple Images)
        List<TagField> metadataBlockPics = this.get(VorbisCommentFieldKey.METADATA_BLOCK_PICTURE);
        for(TagField tagField:metadataBlockPics)
        {

            try
            {
                byte[] imageBinaryData = Base64Coder.decode(((TagTextField)tagField).getContent());
                MetadataBlockDataPicture coverArt = new MetadataBlockDataPicture(ByteBuffer.wrap(imageBinaryData));
                Artwork artwork=ArtworkFactory.createArtworkFromMetadataBlockDataPicture(coverArt);
                artworkList.add(artwork);
            }
            catch(IOException ioe)
            {
                throw new RuntimeException(ioe);
            }
            catch(InvalidFrameException ife)
            {
                throw new RuntimeException(ife);
            }
        }
        return artworkList;
    }


    /**
       * Create MetadataBlockPicture field, this is the preferred way of storing artwork in VorbisComment tag now but
       * has to be base encoded to be stored in VorbisComment
       *
       * @return MetadataBlockDataPicture
     */
      private MetadataBlockDataPicture createMetadataBlockDataPicture(Artwork artwork) throws FieldDataInvalidException
      {
          if(artwork.isLinked())
          {
              return new MetadataBlockDataPicture(
                      artwork.getImageUrl().getBytes(StandardCharsets.ISO_8859_1),
                      artwork.getPictureType(),
                      MetadataBlockDataPicture.IMAGE_IS_URL,
                      "",
                      0,
                      0,
                      0,
                      0);
          }
          else
          {
              if(!artwork.setImageFromData())
              {
                  throw new FieldDataInvalidException("Unable to create MetadataBlockDataPicture from buffered");
              }
              return new MetadataBlockDataPicture(artwork.getBinaryData(),
                      artwork.getPictureType(),
                      artwork.getMimeType(),
                      artwork.getDescription(),
                      artwork.getWidth(),
                      artwork.getHeight(),
                      0,
                      0);
          }
      }

    /**
     * Create Artwork field
     *
     * @param artwork
     * @return
     * @throws FieldDataInvalidException
     */
      public TagField createField(Artwork artwork) throws FieldDataInvalidException
      {
        try
        {
            char[] testdata = Base64Coder.encode(createMetadataBlockDataPicture(artwork).getRawContent());
            String base64image = new String(testdata);
            TagField imageTagField  = createField(VorbisCommentFieldKey.METADATA_BLOCK_PICTURE, base64image);
            return imageTagField;
        }
        catch(UnsupportedEncodingException uee)
        {
            throw new RuntimeException(uee);
        }
    }

    /**
     * Create and set artwork field
     *
     * @return
     */
    @Override
    public void setField(Artwork artwork) throws FieldDataInvalidException
    {
        //Set field
        this.setField(createField(artwork));

        //If worked okay above then that should be first artwork and if we still had old coverart format
        //that should be removed
        if(this.getFirst(VorbisCommentFieldKey.COVERART).length()>0)
        {
            this.deleteField(VorbisCommentFieldKey.COVERART);
            this.deleteField(VorbisCommentFieldKey.COVERARTMIME);
        }
    }

    /**
     * Add artwork field
     *
     * @param artwork
     * @throws FieldDataInvalidException
     */
    public void addField(Artwork artwork) throws FieldDataInvalidException
    {
        this.addField(createField(artwork));
    }

     /**
     * Create artwork field using the non-standard COVERART tag
     *
     *
     * Actually create two fields , the data field and the mimetype. Its is not recommended that you use this
     * method anymore.
      *
     * @param data     raw image data
     * @param mimeType mimeType of data
     *
     * @return
     */
    @Deprecated
    public void setArtworkField(byte[] data, String mimeType)
    {
        char[] testdata = Base64Coder.encode(data);
        String base64image = new String(testdata);
        VorbisCommentTagField dataField = new VorbisCommentTagField(VorbisCommentFieldKey.COVERART.getFieldName(), base64image);
        VorbisCommentTagField mimeField = new VorbisCommentTagField(VorbisCommentFieldKey.COVERARTMIME.getFieldName(), mimeType);

        setField(dataField);
        setField(mimeField);

    }

    /**
     * Create and set field with name of vorbisCommentkey
     *
     * @param vorbisCommentKey
     * @param value
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    public void setField(String vorbisCommentKey, String value) throws KeyNotFoundException, FieldDataInvalidException
    {
        TagField tagfield = createField(vorbisCommentKey,value);
        setField(tagfield);
    }

    /**
     * Create and add field with name of vorbisCommentkey
     * @param vorbisCommentKey
     * @param value
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    public void addField(String vorbisCommentKey, String value) throws KeyNotFoundException, FieldDataInvalidException
    {
        TagField tagfield = createField(vorbisCommentKey,value);
        addField(tagfield);
    }

     /**
     * Delete all instance of artwork Field
     *
     * @throws KeyNotFoundException
     */
    public void deleteArtworkField() throws KeyNotFoundException
    {
        //New Method
        this.deleteField(VorbisCommentFieldKey.METADATA_BLOCK_PICTURE);

        //Old Method
        this.deleteField(VorbisCommentFieldKey.COVERART);
        this.deleteField(VorbisCommentFieldKey.COVERARTMIME);
    }

    public TagField createCompilationField(boolean value) throws KeyNotFoundException, FieldDataInvalidException
    {
        return createField(FieldKey.IS_COMPILATION,String.valueOf(value));
    }

    @Override
    public void setField(FieldKey genericKey, String... values) throws KeyNotFoundException, FieldDataInvalidException
    {
        if (values == null || values[0] == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }

        String value = values[0];
        if(genericKey==FieldKey.ALBUM_ARTIST)
        {
            switch(TagOptionSingleton.getInstance().getVorbisAlbumArtistSaveOptions())
            {
                case WRITE_ALBUMARTIST:
                {
                    TagField tagfield = createField(genericKey, value);
                    setField(tagfield);
                    return;
                }

                case WRITE_JRIVER_ALBUMARTIST:
                {
                    TagField tagfield = createField(VorbisCommentFieldKey.ALBUMARTIST_JRIVER, value);
                    setField(tagfield);
                    return;
                }

                case WRITE_ALBUMARTIST_AND_DELETE_JRIVER_ALBUMARTIST:
                {
                    TagField tagfield = createField(genericKey, value);
                    setField(tagfield);
                    deleteField(VorbisCommentFieldKey.ALBUMARTIST_JRIVER.getFieldName());
                    return;
                }

                case WRITE_JRIVER_ALBUMARTIST_AND_DELETE_ALBUMARTIST:
                {
                    TagField tagfield = createField(VorbisCommentFieldKey.ALBUMARTIST_JRIVER, value);
                    setField(tagfield);
                    deleteField(VorbisCommentFieldKey.ALBUMARTIST.getFieldName());
                    return;
                }


                case WRITE_BOTH:
                {
                    TagField tagfield1 = createField(genericKey, value);
                    setField(tagfield1);
                    TagField tagfield2 = createField(VorbisCommentFieldKey.ALBUMARTIST_JRIVER, value);
                    setField(tagfield2);
                    return;
                }

            }
        }
        else
        {
            TagField tagfield = createField(genericKey, value);
            setField(tagfield);
        }
    }

    /**
     * Create new field and add it to the tag
     *
     * @param genericKey
     * @param values
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    @Override
    public void addField(FieldKey genericKey, String... values) throws KeyNotFoundException, FieldDataInvalidException
    {
        if (values == null || values[0] == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        String value = values[0];
        if(genericKey==FieldKey.ALBUM_ARTIST)
        {
            switch(TagOptionSingleton.getInstance().getVorbisAlbumArtistSaveOptions())
            {
                case WRITE_ALBUMARTIST:
                {
                    TagField tagfield = createField(genericKey, value);
                    addField(tagfield);
                    return;
                }
                case WRITE_JRIVER_ALBUMARTIST:
                {
                    TagField tagfield = createField(VorbisCommentFieldKey.ALBUMARTIST_JRIVER, value);
                    addField(tagfield);
                    return;
                }
                case WRITE_ALBUMARTIST_AND_DELETE_JRIVER_ALBUMARTIST:
                {
                    TagField tagfield = createField(genericKey, value);
                    addField(tagfield);
                    deleteField(VorbisCommentFieldKey.ALBUMARTIST_JRIVER.getFieldName());
                    return;
                }

                case WRITE_JRIVER_ALBUMARTIST_AND_DELETE_ALBUMARTIST:
                {
                    TagField tagfield = createField(VorbisCommentFieldKey.ALBUMARTIST_JRIVER, value);
                    addField(tagfield);
                    deleteField(VorbisCommentFieldKey.ALBUMARTIST.getFieldName());
                    return;
                }
                case WRITE_BOTH:
                {
                    TagField tagfield1 = createField(genericKey, value);
                    addField(tagfield1);
                    TagField tagfield2 = createField(VorbisCommentFieldKey.ALBUMARTIST_JRIVER, value);
                    addField(tagfield2);
                    return;
                }

            }
        }
        else
        {
            TagField tagfield = createField(genericKey, value);
            addField(tagfield);
        }
    }

    public String getValue(FieldKey genericKey,int index) throws KeyNotFoundException
    {
        if(genericKey==FieldKey.ALBUM_ARTIST)
        {
            switch(TagOptionSingleton.getInstance().getVorbisAlbumArtisReadOptions())
            {
                case READ_ALBUMARTIST:
                {
                    VorbisCommentFieldKey vorbisCommentFieldKey =  VorbisCommentFieldKey.ALBUMARTIST;
                    return super.getItem(vorbisCommentFieldKey.getFieldName(), index);
                }

                case READ_JRIVER_ALBUMARTIST:
                {
                    VorbisCommentFieldKey vorbisCommentFieldKey = VorbisCommentFieldKey.ALBUMARTIST_JRIVER;
                    return super.getItem(vorbisCommentFieldKey.getFieldName(), index);
                }

                case READ_ALBUMARTIST_THEN_JRIVER:
                {
                    VorbisCommentFieldKey vorbisCommentFieldKey =  VorbisCommentFieldKey.ALBUMARTIST;
                    String value = super.getItem(vorbisCommentFieldKey.getFieldName(), index);
                    if(value.isEmpty())
                    {
                        vorbisCommentFieldKey = VorbisCommentFieldKey.ALBUMARTIST_JRIVER;
                        return super.getItem(vorbisCommentFieldKey.getFieldName(), index);
                    }
                    else
                    {
                        return value;
                    }
                }

                case READ_JRIVER_THEN_ALBUMARTIST:
                {
                    VorbisCommentFieldKey vorbisCommentFieldKey =  VorbisCommentFieldKey.ALBUMARTIST_JRIVER;
                    String value = super.getItem(vorbisCommentFieldKey.getFieldName(), index);
                    if(value.isEmpty())
                    {
                        vorbisCommentFieldKey = VorbisCommentFieldKey.ALBUMARTIST;
                        return super.getItem(vorbisCommentFieldKey.getFieldName(), index);
                    }
                    else
                    {
                        return value;
                    }
                }

                default:
                    VorbisCommentFieldKey vorbisCommentFieldKey = tagFieldToOggField.get(genericKey);
                    if (vorbisCommentFieldKey == null)
                    {
                        throw new KeyNotFoundException();
                    }
                    return super.getItem(vorbisCommentFieldKey.getFieldName(), index);
            }
        }
        else
        {
            VorbisCommentFieldKey vorbisCommentFieldKey = tagFieldToOggField.get(genericKey);
            if (vorbisCommentFieldKey == null)
            {
                throw new KeyNotFoundException();
            }
            return super.getItem(vorbisCommentFieldKey.getFieldName(), index);
        }
    }
}

