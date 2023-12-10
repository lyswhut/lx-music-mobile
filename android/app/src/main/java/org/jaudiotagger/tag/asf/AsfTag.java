package org.jaudiotagger.tag.asf;

import org.jaudiotagger.audio.asf.data.AsfHeader;
import org.jaudiotagger.audio.generic.AbstractTag;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.*;
import org.jaudiotagger.tag.images.Artwork;
import org.jaudiotagger.tag.images.ArtworkFactory;
import org.jaudiotagger.tag.reference.PictureTypes;

import java.io.UnsupportedEncodingException;
import java.nio.charset.Charset;
import java.util.*;

/**
 * Tag implementation for ASF.<br>
 *
 * @author Christian Laireiter
 */
public final class AsfTag extends AbstractTag
{
    /**
     * This iterator is used to iterator an {@link Iterator} with
     * {@link TagField} objects and returns them by casting to
     * {@link AsfTagField}.<br>
     *
     * @author Christian Laireiter
     */
    private static class AsfFieldIterator implements Iterator<AsfTagField>
    {

        /**
         * source iterator.
         */
        private final Iterator<TagField> fieldIterator;

        /**
         * Creates an isntance.
         *
         * @param iterator iterator to read from.
         */
        public AsfFieldIterator(final Iterator<TagField> iterator)
        {
            assert iterator != null;
            this.fieldIterator = iterator;
        }

        /**
         * {@inheritDoc}
         */
        public boolean hasNext()
        {
            return this.fieldIterator.hasNext();
        }

        /**
         * {@inheritDoc}
         */
        public AsfTagField next()
        {
            return (AsfTagField) this.fieldIterator.next();
        }

        /**
         * {@inheritDoc}
         */
        public void remove()
        {
            this.fieldIterator.remove();
        }
    }

    /**
     * Stores a list of field keys, which identify common fields.<br>
     */
    public final static Set<AsfFieldKey> COMMON_FIELDS;

    /**
     * This map contains the mapping from {@link org.jaudiotagger.tag.FieldKey} to
     * {@link AsfFieldKey}.
     */
    private static final EnumMap<FieldKey, AsfFieldKey> tagFieldToAsfField;

    // Mapping from generic key to asf key

    static
    {
        tagFieldToAsfField = new EnumMap<FieldKey, AsfFieldKey>(FieldKey.class);

        tagFieldToAsfField.put(FieldKey.ACOUSTID_FINGERPRINT, AsfFieldKey.ACOUSTID_FINGERPRINT);
        tagFieldToAsfField.put(FieldKey.ACOUSTID_ID, AsfFieldKey.ACOUSTID_ID);
        tagFieldToAsfField.put(FieldKey.ALBUM, AsfFieldKey.ALBUM);
        tagFieldToAsfField.put(FieldKey.ALBUM_ARTIST, AsfFieldKey.ALBUM_ARTIST);
        tagFieldToAsfField.put(FieldKey.ALBUM_ARTIST_SORT, AsfFieldKey.ALBUM_ARTIST_SORT);
        tagFieldToAsfField.put(FieldKey.ALBUM_ARTISTS, AsfFieldKey.ALBUM_ARTISTS);
        tagFieldToAsfField.put(FieldKey.ALBUM_ARTISTS_SORT, AsfFieldKey.ALBUM_ARTISTS_SORT);
        tagFieldToAsfField.put(FieldKey.ALBUM_SORT, AsfFieldKey.ALBUM_SORT);
        tagFieldToAsfField.put(FieldKey.AMAZON_ID, AsfFieldKey.AMAZON_ID);
        tagFieldToAsfField.put(FieldKey.ARRANGER, AsfFieldKey.ARRANGER);
        tagFieldToAsfField.put(FieldKey.ARRANGER_SORT, AsfFieldKey.ARRANGER_SORT);
        tagFieldToAsfField.put(FieldKey.ARTIST, AsfFieldKey.AUTHOR);
        tagFieldToAsfField.put(FieldKey.ARTISTS, AsfFieldKey.ARTISTS);
        tagFieldToAsfField.put(FieldKey.ARTISTS_SORT, AsfFieldKey.ARTISTS_SORT);
        tagFieldToAsfField.put(FieldKey.ARTIST_SORT, AsfFieldKey.ARTIST_SORT);
        tagFieldToAsfField.put(FieldKey.BARCODE, AsfFieldKey.BARCODE);
        tagFieldToAsfField.put(FieldKey.BPM, AsfFieldKey.BPM);
        tagFieldToAsfField.put(FieldKey.CATALOG_NO, AsfFieldKey.CATALOG_NO);
        tagFieldToAsfField.put(FieldKey.CHOIR, AsfFieldKey.CHOIR);
        tagFieldToAsfField.put(FieldKey.CHOIR_SORT, AsfFieldKey.CHOIR_SORT);
        tagFieldToAsfField.put(FieldKey.CLASSICAL_CATALOG, AsfFieldKey.CLASSICAL_CATALOG);
        tagFieldToAsfField.put(FieldKey.CLASSICAL_NICKNAME, AsfFieldKey.CLASSICAL_NICKNAME);
        tagFieldToAsfField.put(FieldKey.COMMENT, AsfFieldKey.DESCRIPTION);
        tagFieldToAsfField.put(FieldKey.COMPOSER, AsfFieldKey.COMPOSER);
        tagFieldToAsfField.put(FieldKey.COMPOSER_SORT, AsfFieldKey.COMPOSER_SORT);
        tagFieldToAsfField.put(FieldKey.CONDUCTOR, AsfFieldKey.CONDUCTOR);
        tagFieldToAsfField.put(FieldKey.CONDUCTOR_SORT, AsfFieldKey.CONDUCTOR_SORT);
        tagFieldToAsfField.put(FieldKey.COPYRIGHT, AsfFieldKey.COPYRIGHT);
        tagFieldToAsfField.put(FieldKey.COUNTRY, AsfFieldKey.COUNTRY);
        tagFieldToAsfField.put(FieldKey.COVER_ART, AsfFieldKey.COVER_ART);
        tagFieldToAsfField.put(FieldKey.CUSTOM1, AsfFieldKey.CUSTOM1);
        tagFieldToAsfField.put(FieldKey.CUSTOM2, AsfFieldKey.CUSTOM2);
        tagFieldToAsfField.put(FieldKey.CUSTOM3, AsfFieldKey.CUSTOM3);
        tagFieldToAsfField.put(FieldKey.CUSTOM4, AsfFieldKey.CUSTOM4);
        tagFieldToAsfField.put(FieldKey.CUSTOM5, AsfFieldKey.CUSTOM5);
        tagFieldToAsfField.put(FieldKey.DISC_NO, AsfFieldKey.DISC_NO);
        tagFieldToAsfField.put(FieldKey.DISC_SUBTITLE, AsfFieldKey.DISC_SUBTITLE);
        tagFieldToAsfField.put(FieldKey.DISC_TOTAL, AsfFieldKey.DISC_TOTAL);
        tagFieldToAsfField.put(FieldKey.DJMIXER, AsfFieldKey.DJMIXER);
        tagFieldToAsfField.put(FieldKey.MOOD_ELECTRONIC, AsfFieldKey.MOOD_ELECTRONIC);
        tagFieldToAsfField.put(FieldKey.ENCODER, AsfFieldKey.ENCODER);
        tagFieldToAsfField.put(FieldKey.ENGINEER, AsfFieldKey.ENGINEER);
        tagFieldToAsfField.put(FieldKey.ENSEMBLE, AsfFieldKey.ENSEMBLE);
        tagFieldToAsfField.put(FieldKey.ENSEMBLE_SORT, AsfFieldKey.ENSEMBLE_SORT);
        tagFieldToAsfField.put(FieldKey.FBPM, AsfFieldKey.FBPM);
        tagFieldToAsfField.put(FieldKey.GENRE, AsfFieldKey.GENRE);
        tagFieldToAsfField.put(FieldKey.GROUP, AsfFieldKey.GROUP);
        tagFieldToAsfField.put(FieldKey.GROUPING, AsfFieldKey.GROUPING);
        tagFieldToAsfField.put(FieldKey.INSTRUMENT, AsfFieldKey.INSTRUMENT);
        tagFieldToAsfField.put(FieldKey.INVOLVED_PERSON, AsfFieldKey.INVOLVED_PERSON);
        tagFieldToAsfField.put(FieldKey.ISRC, AsfFieldKey.ISRC);
        tagFieldToAsfField.put(FieldKey.IS_CLASSICAL, AsfFieldKey.IS_CLASSICAL);
        tagFieldToAsfField.put(FieldKey.IS_COMPILATION, AsfFieldKey.IS_COMPILATION);
        tagFieldToAsfField.put(FieldKey.IS_SOUNDTRACK, AsfFieldKey.IS_SOUNDTRACK);
        tagFieldToAsfField.put(FieldKey.KEY, AsfFieldKey.INITIAL_KEY);
        tagFieldToAsfField.put(FieldKey.LANGUAGE, AsfFieldKey.LANGUAGE);
        tagFieldToAsfField.put(FieldKey.LYRICIST, AsfFieldKey.LYRICIST);
        tagFieldToAsfField.put(FieldKey.LYRICS, AsfFieldKey.LYRICS);
        tagFieldToAsfField.put(FieldKey.MEDIA, AsfFieldKey.MEDIA);
        tagFieldToAsfField.put(FieldKey.MIXER, AsfFieldKey.MIXER);
        tagFieldToAsfField.put(FieldKey.MOOD, AsfFieldKey.MOOD);
        tagFieldToAsfField.put(FieldKey.MOOD_ACOUSTIC, AsfFieldKey.MOOD_ACOUSTIC);
        tagFieldToAsfField.put(FieldKey.MOOD_AGGRESSIVE, AsfFieldKey.MOOD_AGGRESSIVE);
        tagFieldToAsfField.put(FieldKey.MOOD_AROUSAL, AsfFieldKey.MOOD_AROUSAL);
        tagFieldToAsfField.put(FieldKey.MOOD_DANCEABILITY, AsfFieldKey.MOOD_DANCEABILITY);
        tagFieldToAsfField.put(FieldKey.MOOD_HAPPY, AsfFieldKey.MOOD_HAPPY);
        tagFieldToAsfField.put(FieldKey.MOOD_INSTRUMENTAL, AsfFieldKey.MOOD_INSTRUMENTAL);
        tagFieldToAsfField.put(FieldKey.MOOD_PARTY, AsfFieldKey.MOOD_PARTY);
        tagFieldToAsfField.put(FieldKey.MOOD_RELAXED, AsfFieldKey.MOOD_RELAXED);
        tagFieldToAsfField.put(FieldKey.MOOD_SAD, AsfFieldKey.MOOD_SAD);
        tagFieldToAsfField.put(FieldKey.MOOD_VALENCE, AsfFieldKey.MOOD_VALENCE);
        tagFieldToAsfField.put(FieldKey.MOVEMENT, AsfFieldKey.MOVEMENT);
        tagFieldToAsfField.put(FieldKey.MOVEMENT_NO, AsfFieldKey.MOVEMENT_NO);
        tagFieldToAsfField.put(FieldKey.MOVEMENT_TOTAL, AsfFieldKey.MOVEMENT_TOTAL);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_ARTISTID, AsfFieldKey.MUSICBRAINZ_ARTISTID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_DISC_ID, AsfFieldKey.MUSICBRAINZ_DISC_ID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_ORIGINAL_RELEASE_ID, AsfFieldKey.MUSICBRAINZ_ORIGINAL_RELEASEID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_RELEASEARTISTID, AsfFieldKey.MUSICBRAINZ_RELEASEARTISTID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_RELEASEID, AsfFieldKey.MUSICBRAINZ_RELEASEID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_RELEASE_COUNTRY, AsfFieldKey.MUSICBRAINZ_RELEASE_COUNTRY);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_RELEASE_GROUP_ID, AsfFieldKey.MUSICBRAINZ_RELEASEGROUPID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_RELEASE_STATUS, AsfFieldKey.MUSICBRAINZ_RELEASE_STATUS);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_RELEASE_TRACK_ID, AsfFieldKey.MUSICBRAINZ_RELEASETRACKID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_RELEASE_TYPE, AsfFieldKey.MUSICBRAINZ_RELEASE_TYPE);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_TRACK_ID, AsfFieldKey.MUSICBRAINZ_TRACK_ID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK, AsfFieldKey.MUSICBRAINZ_WORK);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_ID, AsfFieldKey.MUSICBRAINZ_WORKID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_COMPOSITION, AsfFieldKey.MUSICBRAINZ_WORK_COMPOSITION);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_COMPOSITION_ID, AsfFieldKey.MUSICBRAINZ_WORK_COMPOSITION_ID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL1);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_ID, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_ID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_TYPE, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_TYPE);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL2);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_ID, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_ID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_TYPE, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_TYPE);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL3);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_ID, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_ID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_TYPE, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_TYPE);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL4);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_ID, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_ID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_TYPE, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_TYPE);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL5);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_ID, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_ID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_TYPE, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_TYPE);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL6);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_ID, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_ID);
        tagFieldToAsfField.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_TYPE, AsfFieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_TYPE);

        tagFieldToAsfField.put(FieldKey.MUSICIP_ID, AsfFieldKey.MUSICIP_ID);
        tagFieldToAsfField.put(FieldKey.OCCASION, AsfFieldKey.OCCASION);
        tagFieldToAsfField.put(FieldKey.OPUS, AsfFieldKey.OPUS);
        tagFieldToAsfField.put(FieldKey.ORCHESTRA, AsfFieldKey.ORCHESTRA);
        tagFieldToAsfField.put(FieldKey.ORCHESTRA_SORT, AsfFieldKey.ORCHESTRA_SORT);
        tagFieldToAsfField.put(FieldKey.ORIGINAL_ALBUM, AsfFieldKey.ORIGINAL_ALBUM);
        tagFieldToAsfField.put(FieldKey.ORIGINAL_ARTIST, AsfFieldKey.ORIGINAL_ARTIST);
        tagFieldToAsfField.put(FieldKey.ORIGINAL_LYRICIST, AsfFieldKey.ORIGINAL_LYRICIST);
        tagFieldToAsfField.put(FieldKey.ORIGINAL_YEAR, AsfFieldKey.ORIGINAL_YEAR);
        tagFieldToAsfField.put(FieldKey.PART, AsfFieldKey.PART);
        tagFieldToAsfField.put(FieldKey.PART_NUMBER, AsfFieldKey.PART_NUMBER);
        tagFieldToAsfField.put(FieldKey.PART_TYPE, AsfFieldKey.PART_TYPE);
        tagFieldToAsfField.put(FieldKey.PERFORMER, AsfFieldKey.PERFORMER);
        tagFieldToAsfField.put(FieldKey.PERFORMER_NAME, AsfFieldKey.PERFORMER_NAME);
        tagFieldToAsfField.put(FieldKey.PERFORMER_NAME_SORT, AsfFieldKey.PERFORMER_NAME_SORT);
        tagFieldToAsfField.put(FieldKey.PERIOD, AsfFieldKey.PERIOD);
        tagFieldToAsfField.put(FieldKey.PRODUCER, AsfFieldKey.PRODUCER);
        tagFieldToAsfField.put(FieldKey.QUALITY, AsfFieldKey.QUALITY);
        tagFieldToAsfField.put(FieldKey.RANKING, AsfFieldKey.RANKING);
        tagFieldToAsfField.put(FieldKey.RATING, AsfFieldKey.USER_RATING);
        tagFieldToAsfField.put(FieldKey.RECORD_LABEL, AsfFieldKey.RECORD_LABEL);
        tagFieldToAsfField.put(FieldKey.REMIXER, AsfFieldKey.REMIXER);
        tagFieldToAsfField.put(FieldKey.SCRIPT, AsfFieldKey.SCRIPT);
        tagFieldToAsfField.put(FieldKey.SINGLE_DISC_TRACK_NO, AsfFieldKey.SINGLE_DISC_TRACK_NO);
        tagFieldToAsfField.put(FieldKey.SUBTITLE, AsfFieldKey.SUBTITLE);
        tagFieldToAsfField.put(FieldKey.TAGS, AsfFieldKey.TAGS);
        tagFieldToAsfField.put(FieldKey.TEMPO, AsfFieldKey.TEMPO);
        tagFieldToAsfField.put(FieldKey.TIMBRE, AsfFieldKey.TIMBRE);
        tagFieldToAsfField.put(FieldKey.TITLE, AsfFieldKey.TITLE);
        tagFieldToAsfField.put(FieldKey.TITLE_MOVEMENT, AsfFieldKey.TITLE_MOVEMENT);
        tagFieldToAsfField.put(FieldKey.TITLE_SORT, AsfFieldKey.TITLE_SORT);
        tagFieldToAsfField.put(FieldKey.TONALITY, AsfFieldKey.TONALITY);
        tagFieldToAsfField.put(FieldKey.TRACK, AsfFieldKey.TRACK);
        tagFieldToAsfField.put(FieldKey.TRACK_TOTAL, AsfFieldKey.TRACK_TOTAL);
        tagFieldToAsfField.put(FieldKey.URL_DISCOGS_ARTIST_SITE, AsfFieldKey.URL_DISCOGS_ARTIST_SITE);
        tagFieldToAsfField.put(FieldKey.URL_DISCOGS_RELEASE_SITE, AsfFieldKey.URL_DISCOGS_RELEASE_SITE);
        tagFieldToAsfField.put(FieldKey.URL_LYRICS_SITE, AsfFieldKey.URL_LYRICS_SITE);
        tagFieldToAsfField.put(FieldKey.URL_OFFICIAL_ARTIST_SITE, AsfFieldKey.URL_OFFICIAL_ARTIST_SITE);
        tagFieldToAsfField.put(FieldKey.URL_OFFICIAL_RELEASE_SITE, AsfFieldKey.URL_OFFICIAL_RELEASE_SITE);
        tagFieldToAsfField.put(FieldKey.URL_WIKIPEDIA_ARTIST_SITE, AsfFieldKey.URL_WIKIPEDIA_ARTIST_SITE);
        tagFieldToAsfField.put(FieldKey.URL_WIKIPEDIA_RELEASE_SITE, AsfFieldKey.URL_WIKIPEDIA_RELEASE_SITE);
        tagFieldToAsfField.put(FieldKey.WORK, AsfFieldKey.WORK);
        tagFieldToAsfField.put(FieldKey.WORK_TYPE, AsfFieldKey.WORK_TYPE);
        tagFieldToAsfField.put(FieldKey.YEAR, AsfFieldKey.YEAR);
    }

    static
    {
        COMMON_FIELDS = new HashSet<AsfFieldKey>();
        COMMON_FIELDS.add(AsfFieldKey.ALBUM);
        COMMON_FIELDS.add(AsfFieldKey.AUTHOR);
        COMMON_FIELDS.add(AsfFieldKey.DESCRIPTION);
        COMMON_FIELDS.add(AsfFieldKey.GENRE);
        COMMON_FIELDS.add(AsfFieldKey.TITLE);
        COMMON_FIELDS.add(AsfFieldKey.TRACK);
        COMMON_FIELDS.add(AsfFieldKey.YEAR);
    }

    /**
     * @see #isCopyingFields()
     */
    private final boolean copyFields;

    /**
     * Creates an empty instance.
     */
    public AsfTag()
    {
        this(false);
    }

    /**
     * Creates an instance and sets the field conversion property.<br>
     *
     * @param copy look at {@link #isCopyingFields()}.
     */
    public AsfTag(final boolean copy)
    {
        super();
        this.copyFields = copy;
    }

    /**
     * Creates an instance and copies the fields of the source into the own
     * structure.<br>
     *
     * @param source source to read tag fields from.
     * @param copy   look at {@link #isCopyingFields()}.
     * @throws UnsupportedEncodingException {@link TagField#getRawContent()} which may be called
     */
    public AsfTag(final Tag source, final boolean copy) throws UnsupportedEncodingException
    {
        this(copy);
        copyFrom(source);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    // TODO introduce copy idea to all formats
    public void addField(final TagField field)
    {
        if (isValidField(field))
        {
            if (AsfFieldKey.isMultiValued(field.getId()))
            {
                super.addField(copyFrom(field));
            }
            else
            {
                super.setField(copyFrom(field));
            }
        }
    }

    /**
     * Creates a field for copyright and adds it.<br>
     *
     * @param copyRight copyright content
     */
    public void addCopyright(final String copyRight)
    {
        addField(createCopyrightField(copyRight));
    }

    /**
     * Creates a field for rating and adds it.<br>
     *
     * @param rating rating.
     */
    public void addRating(final String rating)
    {
        addField(createRatingField(rating));
    }

    /**
     * This method copies tag fields from the source.<br>
     *
     * @param source source to read tag fields from.
     */
    private void copyFrom(final Tag source)
    {
        final Iterator<TagField> fieldIterator = source.getFields();
        // iterate over all fields
        while (fieldIterator.hasNext())
        {
            final TagField copy = copyFrom(fieldIterator.next());
            if (copy != null)
            {
                super.addField(copy);
            }
        }
    }

    /**
     * If {@link #isCopyingFields()} is <code>true</code>, Creates a copy of
     * <code>source</code>, if its not empty-<br>
     * However, plain {@link TagField} objects can only be transformed into
     * binary fields using their {@link TagField#getRawContent()} method.<br>
     *
     * @param source source field to copy.
     * @return A copy, which is as close to the source as possible, or
     *         <code>null</code> if the field is empty (empty byte[] or blank
     *         string}.
     */
    private TagField copyFrom(final TagField source)
    {
        TagField result;
        if (isCopyingFields())
        {
            if (source instanceof AsfTagField)
            {
                try
                {
                    result = (TagField) ((AsfTagField) source).clone();
                }
                catch (CloneNotSupportedException e)
                {
                    result = new AsfTagField(((AsfTagField) source).getDescriptor());
                }
            }
            else if (source instanceof TagTextField)
            {
                final String content = ((TagTextField) source).getContent();
                result = new AsfTagTextField(source.getId(), content);
            }
            else
            {
                throw new RuntimeException("Unknown Asf Tag Field class:" // NOPMD
                        // by
                        // Christian
                        // Laireiter
                        // on
                        // 5/9/09
                        // 5:44
                        // PM
                        + source.getClass());
            }
        }
        else
        {
            result = source;
        }
        return result;
    }


    /**
     * Creates an {@link AsfTagCoverField} from given artwork
     *
     * @param artwork artwork to create a ASF field from.
     * @return ASF field capable of storing artwork.
     */
    public AsfTagCoverField createField(final Artwork artwork)
    {
        return new AsfTagCoverField(artwork.getBinaryData(), artwork.getPictureType(), artwork.getDescription(), artwork.getMimeType());
    }

    /**
     * Create artwork field
     *
     * @param data raw image data
     * @return creates a default ASF picture field with default
     *         {@linkplain PictureTypes#DEFAULT_ID picture type}.
     */
    public AsfTagCoverField createArtworkField(final byte[] data)
    {
        return new AsfTagCoverField(data, PictureTypes.DEFAULT_ID, null, null);
    }

    /**
     * Creates a field for storing the copyright.<br>
     *
     * @param content Copyright value.
     * @return {@link AsfTagTextField}
     */
    public AsfTagTextField createCopyrightField(final String content)
    {
        return new AsfTagTextField(AsfFieldKey.COPYRIGHT, content);
    }

    /**
     * Creates a field for storing the copyright.<br>
     *
     * @param content Rating value.
     * @return {@link AsfTagTextField}
     */
    public AsfTagTextField createRatingField(final String content)
    {
        return new AsfTagTextField(AsfFieldKey.RATING, content);
    }

    /**
     * Create tag text field using ASF key
     *
     * Uses the correct subclass for the key.<br>
     *
     * @param asfFieldKey field key to create field for.
     * @param value       string value for the created field.
     * @return text field with given content.
     */
    public AsfTagTextField createField(final AsfFieldKey asfFieldKey, final String value)
    {
        if (value == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        if (asfFieldKey == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        switch (asfFieldKey)
        {
            case COVER_ART:
                throw new UnsupportedOperationException("Cover Art cannot be created using this method");
            case BANNER_IMAGE:
                throw new UnsupportedOperationException("Banner Image cannot be created using this method");
            default:
                return new AsfTagTextField(asfFieldKey.getFieldName(), value);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public AsfTagTextField createField(final FieldKey genericKey, final String... values) throws KeyNotFoundException, FieldDataInvalidException
    {
        if (values == null || values[0] == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        if (genericKey == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        final AsfFieldKey asfFieldKey = tagFieldToAsfField.get(genericKey);
        if (asfFieldKey == null)
        {
            throw new KeyNotFoundException(genericKey.toString());
        }
        return createField(asfFieldKey, values[0]);
    }

    /**
     * Removes all fields which are stored to the provided field key.
     *
     * @param fieldKey fields to remove.
     */
    public void deleteField(final AsfFieldKey fieldKey)
    {
        super.deleteField(fieldKey.getFieldName());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void deleteField(final FieldKey fieldKey) throws KeyNotFoundException
    {
        if (fieldKey == null)
        {
            throw new KeyNotFoundException();
        }
        super.deleteField(tagFieldToAsfField.get(fieldKey).getFieldName());
    }

    /**
     * {@inheritDoc}
     */
    public List<TagField> getFields(final FieldKey fieldKey) throws KeyNotFoundException
    {
        if (fieldKey == null)
        {
            throw new KeyNotFoundException();
        }
        return super.getFields(tagFieldToAsfField.get(fieldKey).getFieldName());
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
        AsfFieldKey asfFieldKey = tagFieldToAsfField.get(genericKey);
        if (asfFieldKey == null)
        {
            throw new KeyNotFoundException();
        }
        return super.getAll(asfFieldKey.getFieldName());
    }

    /**
     * @return
     */
    public List<Artwork> getArtworkList()
    {
        final List<TagField> coverartList = getFields(FieldKey.COVER_ART);
        final List<Artwork> artworkList = new ArrayList<Artwork>(coverartList.size());

        for (final TagField next : coverartList)
        {
            final AsfTagCoverField coverArt = (AsfTagCoverField) next;
            final Artwork artwork = ArtworkFactory.getNew();
            artwork.setBinaryData(coverArt.getRawImageData());
            artwork.setMimeType(coverArt.getMimeType());
            artwork.setDescription(coverArt.getDescription());
            artwork.setPictureType(coverArt.getPictureType());
            artworkList.add(artwork);
        }
        return artworkList;
    }

    /**
     * This method iterates through all stored fields.<br>
     * This method can only be used if this class has been created with field
     * conversion turned on.
     *
     * @return Iterator for iterating through ASF fields.
     */
    public Iterator<AsfTagField> getAsfFields()
    {
        if (!isCopyingFields())
        {
            throw new IllegalStateException("Since the field conversion is not enabled, this method cannot be executed");
        }
        return new AsfFieldIterator(getFields());
    }

    /**
     * Returns a list of stored copyrights.
     *
     * @return list of stored copyrights.
     */
    public List<TagField> getCopyright()
    {
        return getFields(AsfFieldKey.COPYRIGHT.getFieldName());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String getFirst(final FieldKey genericKey) throws KeyNotFoundException
    {
        return getValue(genericKey, 0);
    }

    /**
     * Retrieve the first value that exists for this asfkey
     *
     * @param asfKey
     * @return
     * @throws org.jaudiotagger.tag.KeyNotFoundException
     */
    public String getFirst(AsfFieldKey asfKey) throws KeyNotFoundException
    {
        if (asfKey == null)
        {
            throw new KeyNotFoundException();
        }
        return super.getFirst(asfKey.getFieldName());
    }

    /**
     * {@inheritDoc}
     */
    public String getValue(final FieldKey genericKey, int index) throws KeyNotFoundException
    {
        if (genericKey == null)
        {
            throw new KeyNotFoundException();
        }
        return super.getItem(tagFieldToAsfField.get(genericKey).getFieldName(), index);
    }

    /**
     * Returns the Copyright.
     *
     * @return the Copyright.
     */
    public String getFirstCopyright()
    {
        return getFirst(AsfFieldKey.COPYRIGHT.getFieldName());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public AsfTagField getFirstField(final FieldKey genericKey) throws KeyNotFoundException
    {
        if (genericKey == null)
        {
            throw new KeyNotFoundException();
        }
        return (AsfTagField) super.getFirstField(tagFieldToAsfField.get(genericKey).getFieldName());
    }

    /**
     * Returns the Rating.
     *
     * @return the Rating.
     */
    public String getFirstRating()
    {
        return getFirst(AsfFieldKey.RATING.getFieldName());
    }

    /**
     * Returns a list of stored ratings.
     *
     * @return list of stored ratings.
     */
    public List<TagField> getRating()
    {
        return getFields(AsfFieldKey.RATING.getFieldName());
    }

    /**
     * {@inheritDoc}
     * @param enc
     */
    @Override
    protected boolean isAllowedEncoding(final Charset enc)
    {
        return AsfHeader.ASF_CHARSET.name().equals(enc);
    }

    /**
     * If <code>true</code>, the {@link #copyFrom(TagField)} method creates a
     * new {@link AsfTagField} instance and copies the content from the source.<br>
     * This method is utilized by {@link #addField(TagField)} and
     * {@link #setField(TagField)}.<br>
     * So if <code>true</code> it is ensured that the {@link AsfTag} instance
     * has its own copies of fields, which cannot be modified after assignment
     * (which could pass some checks), and it just stores {@link AsfTagField}
     * objects.<br>
     * Only then {@link #getAsfFields()} can work. otherwise
     * {@link IllegalStateException} is thrown.
     *
     * @return state of field conversion.
     */
    public boolean isCopyingFields()
    {
        return this.copyFields;
    }

    /**
     * Check field is valid and can be added to this tag
     *
     * @param field field to add
     * @return <code>true</code> if field may be added.
     */
    // TODO introduce this concept to all formats
    private boolean isValidField(final TagField field)
    {
        if (field == null)
        {
            return false;
        }

        if (!(field instanceof AsfTagField))
        {
            return false;
        }

        return !field.isEmpty();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    // TODO introduce copy idea to all formats
    public void setField(final TagField field)
    {
        if (isValidField(field))
        {
            // Copy only occurs if flag setField
            super.setField(copyFrom(field));
        }
    }

    /**
     * Sets the copyright.<br>
     *
     * @param Copyright the copyright to set.
     */
    public void setCopyright(final String Copyright)
    {
        setField(createCopyrightField(Copyright));
    }

    /**
     * Sets the Rating.<br>
     *
     * @param rating the rating to set.
     */
    public void setRating(final String rating)
    {
        setField(createRatingField(rating));
    }

    /**
     *
     * @param genericKey
     * @return
     */
    public boolean hasField(FieldKey genericKey)
    {
        AsfFieldKey mp4FieldKey = tagFieldToAsfField.get(genericKey);
        return getFields(mp4FieldKey.getFieldName()).size() != 0;
    }

     /**
     *
     * @param asfFieldKey
     * @return
     */
    public boolean hasField(AsfFieldKey asfFieldKey)
    {
        return getFields(asfFieldKey.getFieldName()).size() != 0;
    }

    public TagField createCompilationField(boolean value) throws KeyNotFoundException, FieldDataInvalidException
    {
        return createField(FieldKey.IS_COMPILATION,String.valueOf(value));
    }
}
