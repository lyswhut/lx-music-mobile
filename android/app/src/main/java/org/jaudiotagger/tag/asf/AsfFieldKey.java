package org.jaudiotagger.tag.asf;

import org.jaudiotagger.audio.asf.data.ContainerType;
import org.jaudiotagger.audio.asf.data.ContentBranding;
import org.jaudiotagger.audio.asf.data.ContentDescription;

import java.util.HashMap;
import java.util.Map;

/**
 * Field keys which need to be mapped for ASF files, or only specified for ASF.
 *
 * TODO These attributes and their v23 mapping that havent been added to enum yet
 *
 * WMA                 ID3v1   ID3v22  ID3v2324
 *
 * CopyrightURL 	  	       WCP 	WCOP
 * Duration 	  	           TLE 	TLEN
 * FileSize 	  	  	            TSIZ
 * WM/AudioFileURL 	  	WAF 	WOAF
 * WM/AudioSourceURL 	  	WAS 	WOAS
 * WM/Binary 	  	GEO 	GEOB
 * WM/EncodingSettings 	  	TSS 	TSSE
 * WM/EncodingTime 	  	  	TDEN
 * WM/MCDI 	  	  	MCDI
 * WM/ModifiedBy 	  	  	TPE4
 * WM/OriginalFilename 	  	TOF 	TOFN
 * WM/PlaylistDelay 	  	  	TDLY
 * WM/RadioStationName 	  	TRN 	TRSN
 * WM/RadioStationOwner 	  	TRO 	TRSO
 * WM/SetSubTitle 	  	  	TSST
 * WM/Text 	  	TXX 	TXXX
 * WM/UniqueFileIdentifier 	  	UFI 	UFID
 * WM/UserWebURL 	  	WXX 	WXXX
 *
 * @author Christian Laireiter
 */
public enum AsfFieldKey
{
    /*
     * Keys are arbitrary because these fields don't have 'keys' internally because they are stored in preset contents descriptor
     */
    
    // Content Description Object keys
    AUTHOR(ContentDescription.KEY_AUTHOR, false, ContainerType.CONTENT_DESCRIPTION),
    TITLE(ContentDescription.KEY_TITLE, false, ContainerType.CONTENT_DESCRIPTION),
    RATING(ContentDescription.KEY_RATING, false, ContainerType.CONTENT_DESCRIPTION),
    COPYRIGHT(ContentDescription.KEY_COPYRIGHT, false, ContainerType.CONTENT_DESCRIPTION),
    DESCRIPTION(ContentDescription.KEY_DESCRIPTION, false, ContainerType.CONTENT_DESCRIPTION),
    
    // Content Branding Object keys
    BANNER_IMAGE(ContentBranding.KEY_BANNER_IMAGE,false, ContainerType.CONTENT_BRANDING),
    BANNER_IMAGE_TYPE(ContentBranding.KEY_BANNER_TYPE,false, ContainerType.CONTENT_BRANDING),
    BANNER_IMAGE_URL(ContentBranding.KEY_BANNER_URL, false, ContainerType.CONTENT_BRANDING),
    COPYRIGHT_URL(ContentBranding.KEY_COPYRIGHT_URL, false, ContainerType.CONTENT_BRANDING),
    
    /*
     * keys are important because this is how values will be looked up by other applications
     */

    ACOUSTID_FINGERPRINT("Acoustid/Fingerprint", false),
    ACOUSTID_FINGERPRINT_OLD("AcoustId/Fingerprint", false),
    ACOUSTID_ID("Acoustid/Id", false),
    ALBUM("WM/AlbumTitle", false),
    ALBUM_ARTIST("WM/AlbumArtist", true),
    ALBUM_ARTIST_SORT("WM/AlbumArtistSortOrder", false),
    ALBUM_ARTISTS("ALBUM_ARTISTS", true),
    ALBUM_ARTISTS_SORT("ALBUM_ARTISTS_SORT", true),
    ALBUM_SORT("WM/AlbumSortOrder", false),
    AMAZON_ID("ASIN", false),
    ARRANGER("WM/Arranger",false),
    ARRANGER_SORT("ARRANGER_SORT",true),
    ARTISTS("WM/ARTISTS", true),
    ARTISTS_SORT("WM/ARTISTS_SORT",true),
    ARTIST_SORT("WM/ArtistSortOrder", false),
    BARCODE("WM/Barcode", false),
    BPM("WM/BeatsPerMinute", false),
    CATALOG_NO("WM/CatalogNo", false),
    CATEGORY("WM/Category", true),
    CHOIR("CHOIR", true),
    CHOIR_SORT("CHOIR_SORT", true),
    CLASSICAL_CATALOG("CLASSICAL_CATALOG", true),
    CLASSICAL_NICKNAME("CLASSICAL_NICKNAME", true),
    COMPOSER("WM/Composer", true),
    COMPOSER_SORT("WM/ComposerSort", false),
    CONDUCTOR("WM/Conductor", true),
    CONDUCTOR_SORT("CONDUCTOR_SORT",true),
    COUNTRY("WM/Country", false),
    COVER_ART("WM/Picture", true),
    COVER_ART_URL("WM/AlbumCoverURL", true),
    CUSTOM1("CUSTOM1", true),
    CUSTOM2("CUSTOM2", true),
    CUSTOM3("CUSTOM3", true),
    CUSTOM4("CUSTOM4", true),
    CUSTOM5("CUSTOM5", true),
    DIRECTOR("WM/Director", true),
    DISC_NO("WM/PartOfSet", false),
    DISC_SUBTITLE("WM/SetSubTitle", false),
    DISC_TOTAL("WM/DiscTotal", false),
    DJMIXER("WM/DJMixer",false),
    ENCODED_BY("WM/EncodedBy", false),
    ENCODER("WM/ToolName", false),
    ENGINEER("WM/Engineer",false),
    ENSEMBLE("ENSEMBLE",true),
    ENSEMBLE_SORT("ENSEMBLE_SORT",true),
    FBPM("FBPM", true),
    GENRE("WM/Genre", true),
    GENRE_ID("WM/GenreID", true),
    GROUP("GROUP", false),
    GROUPING("WM/ContentGroupDescription", false),
    INITIAL_KEY("WM/InitialKey", false),
    INSTRUMENT("INSTRUMENT", true),
    INVOLVED_PERSON("WM/InvolvedPerson", true),
    ISRC("WM/ISRC", false),
    ISVBR("IsVBR", true),
    IS_CLASSICAL("IS_CLASSICAL", false),
    IS_COMPILATION("WM/IsCompilation", false),
    IS_SOUNDTRACK("IS_SOUNDTRACK", false),
    LANGUAGE("WM/Language", true),
    LYRICIST("WM/Writer", true),
    LYRICS("WM/Lyrics", false),
    LYRICS_SYNCHRONISED("WM/Lyrics_Synchronised", true),
    MEDIA("WM/Media", false),
    MIXER("WM/Mixer",false),
    MM_RATING("SDB/Rating", true),
    MOOD("WM/Mood", true),
    MOOD_ACOUSTIC("MOOD_ACOUSTIC", false),
    MOOD_AGGRESSIVE("MOOD_AGGRESSIVE", false),
    MOOD_AROUSAL("MOOD_AROUSAL", false),
    MOOD_DANCEABILITY("MOOD_DANCEABILITY", false),
    MOOD_ELECTRONIC("MOOD_ELECTRONIC", false),
    MOOD_HAPPY("MOOD_HAPPY", false),
    MOOD_INSTRUMENTAL("MOOD_INSTRUMENTAL", false),
    MOOD_PARTY("MOOD_PARTY", false),
    MOOD_RELAXED("MOOD_RELAXED", false),
    MOOD_SAD("MOOD_SAD", false),
    MOOD_VALENCE("MOOD_VALENCE", false),
    MOVEMENT("MOVEMENT", false),
    MOVEMENT_NO("MOVEMENT_NO", false),
    MOVEMENT_TOTAL("MOVEMENT_TOTAL", false),
    MUSICBRAINZ_ARTISTID("MusicBrainz/Artist Id", false),
    MUSICBRAINZ_DISC_ID("MusicBrainz/Disc Id", false),
    MUSICBRAINZ_ORIGINAL_RELEASEID("MusicBrainz/Original Album Id", false),
    MUSICBRAINZ_RELEASEARTISTID("MusicBrainz/Album Artist Id", false),
    MUSICBRAINZ_RELEASEGROUPID("MusicBrainz/Release Group Id", false),
    MUSICBRAINZ_RELEASEID("MusicBrainz/Album Id", false),
    MUSICBRAINZ_RELEASETRACKID("MusicBrainz/Release Track Id", false),
    MUSICBRAINZ_RELEASE_COUNTRY("MusicBrainz/Album Release Country", false),
    MUSICBRAINZ_RELEASE_STATUS("MusicBrainz/Album Status", false),
    MUSICBRAINZ_RELEASE_TYPE("MusicBrainz/Album Type", false),
    MUSICBRAINZ_TRACK_ID("MusicBrainz/Track Id", false),
    MUSICBRAINZ_WORKID("MusicBrainz/Work Id", false),
    MUSICBRAINZ_WORK_COMPOSITION("MUSICBRAINZ_WORK_COMPOSITION",true),
    MUSICBRAINZ_WORK_COMPOSITION_ID("MUSICBRAINZ_MUSICBRAINZ_WORK_COMPOSITION_ID",true),
    MUSICBRAINZ_WORK_PART_LEVEL1("MUSICBRAINZ_WORK_PART_LEVEL1",true),
    MUSICBRAINZ_WORK_PART_LEVEL1_ID("MUSICBRAINZ_MUSICBRAINZ_WORK_PART_LEVEL1_ID",true),
    MUSICBRAINZ_WORK_PART_LEVEL1_TYPE("MUSICBRAINZ_WORK_PART_LEVEL1_TYPE",true),
    MUSICBRAINZ_WORK_PART_LEVEL2("MUSICBRAINZ_WORK_PART_LEVEL2",true),
    MUSICBRAINZ_WORK_PART_LEVEL2_ID("MUSICBRAINZ_MUSICBRAINZ_WORK_PART_LEVEL2_ID",true),
    MUSICBRAINZ_WORK_PART_LEVEL2_TYPE("MUSICBRAINZ_WORK_PART_LEVEL2_TYPE",true),
    MUSICBRAINZ_WORK_PART_LEVEL3("MUSICBRAINZ_WORK_PART_LEVEL3",true),
    MUSICBRAINZ_WORK_PART_LEVEL3_ID("MUSICBRAINZ_MUSICBRAINZ_WORK_PART_LEVEL3_ID",true),
    MUSICBRAINZ_WORK_PART_LEVEL3_TYPE("MUSICBRAINZ_WORK_PART_LEVEL3_TYPE",true),
    MUSICBRAINZ_WORK_PART_LEVEL4("MUSICBRAINZ_WORK_PART_LEVEL4",true),
    MUSICBRAINZ_WORK_PART_LEVEL4_ID("MUSICBRAINZ_MUSICBRAINZ_WORK_PART_LEVEL4_ID",true),
    MUSICBRAINZ_WORK_PART_LEVEL4_TYPE("MUSICBRAINZ_WORK_PART_LEVEL4_TYPE",true),
    MUSICBRAINZ_WORK_PART_LEVEL5("MUSICBRAINZ_WORK_PART_LEVEL5",true),
    MUSICBRAINZ_WORK_PART_LEVEL5_ID("MUSICBRAINZ_MUSICBRAINZ_WORK_PART_LEVEL5_ID",true),
    MUSICBRAINZ_WORK_PART_LEVEL5_TYPE("MUSICBRAINZ_WORK_PART_LEVEL5_TYPE",true),
    MUSICBRAINZ_WORK_PART_LEVEL6_ID("MUSICBRAINZ_MUSICBRAINZ_WORK_PART_LEVEL6_ID",true),
    MUSICBRAINZ_WORK_PART_LEVEL6("MUSICBRAINZ_WORK_PART_LEVEL6",true),
    MUSICBRAINZ_WORK_PART_LEVEL6_TYPE("MUSICBRAINZ_WORK_PART_LEVEL6_TYPE",true),
    MUSICIP_ID("MusicIP/PUID", false),
    OCCASION("Occasion", true),
    OPUS("OPUS",true),
    ORCHESTRA("ORCHESTRA", true),
    ORCHESTRA_SORT("ORCHESTRA_SORT",true),
    ORIGINAL_ALBUM("WM/OriginalAlbumTitle", true),
    ORIGINAL_ARTIST("WM/OriginalArtist", true),
    ORIGINAL_LYRICIST("WM/OriginalLyricist", true),
    ORIGINAL_YEAR("WM/OriginalReleaseYear", true),
    PART("PART", true),
    PART_NUMBER("PARTNUMBER",true),
    PART_TYPE("PART_TYPE",true),
    PERFORMER("PERFORMER", true),
    PERFORMER_NAME("PERFORMER_NAME",true),
    PERFORMER_NAME_SORT("PERFORMER_NAME_SORT",true),
    PERIOD("PERIOD",true),
    PRODUCER("WM/Producer", false),
    QUALITY("Quality", true),
    RANKING("RANKING", true),
    RECORD_LABEL("WM/Publisher", false),
    REMIXER("WM/ModifiedBy", false),
    SCRIPT("WM/Script", false),
    SINGLE_DISC_TRACK_NO("SINGLE_DISC_TRACK_NO",true),
    SUBTITLE("WM/SubTitle", false),
    TAGS("WM/Tags", false),
    TEMPO("Tempo", true),
    TIMBRE("TIMBRE_BRIGHTNESS", false),
    TITLE_MOVEMENT("TITLE_MOVEMENT", false),
    MUSICBRAINZ_WORK("MUSICBRAINZ_WORK", false),
    TITLE_SORT("WM/TitleSortOrder", false),
    TONALITY("TONALITY", false),
    TRACK("WM/TrackNumber", false),
    TRACK_TOTAL("WM/TrackTotal", false),
    URL_DISCOGS_ARTIST_SITE("WM/DiscogsArtistUrl", false),
    URL_DISCOGS_RELEASE_SITE("WM/DiscogsReleaseUrl", false),
    URL_LYRICS_SITE("WM/LyricsUrl", false),
    URL_OFFICIAL_ARTIST_SITE("WM/AuthorURL", false),
    URL_OFFICIAL_RELEASE_SITE("WM/OfficialReleaseUrl", false),
    URL_PROMOTIONAL_SITE("WM/PromotionURL", true),
    URL_WIKIPEDIA_ARTIST_SITE("WM/WikipediaArtistUrl", false),
    URL_WIKIPEDIA_RELEASE_SITE("WM/WikipediaReleaseUrl", false),
    USER_RATING("WM/SharedUserRating", true),
    WORK("WORK", true),
    WORK_TYPE("WORK_TYPE",true),
    YEAR("WM/Year", false),


    // Special field for all unknown field names, which will getFields maximum support
    CUSTOM ("___CUSTOM___", true);

    /**
     * Stores the {@link AsfFieldKey#fieldName} to the field key.
     */
    private final static Map<String, AsfFieldKey> FIELD_ID_MAP;

    static
    {
        FIELD_ID_MAP = new HashMap<String, AsfFieldKey>(AsfFieldKey.values().length);
        for (AsfFieldKey curr : AsfFieldKey.values())
        {
            if (curr != CUSTOM) {
                assert !FIELD_ID_MAP.containsKey(curr.getFieldName()) : "duplicate field entry: "+curr.getFieldName();
                FIELD_ID_MAP.put(curr.getFieldName(), curr);
            }
        }
    }


    /**
     * Searches for an ASF field key which represents the given id string.<br>
     *
     * @param fieldName the field name used for this key
     * @return the Enum that represents this field
     */
    public static AsfFieldKey getAsfFieldKey(final String fieldName)
    {
        AsfFieldKey result = FIELD_ID_MAP.get(fieldName);
        if (result == null) {
            result = CUSTOM;
        }
        return result;
    }

    /**
     * Tests whether the field is enabled for multiple values.<br>
     *
     * @param fieldName field id to test.
     * @return <code>true</code> if ASF implementation supports multiple values for the field.
     */
    public static boolean isMultiValued(final String fieldName)
    {
        final AsfFieldKey fieldKey = getAsfFieldKey(fieldName);
        return fieldKey != null && fieldKey.isMultiValued();
    }


    /**
     * If set, the field has a standard id assigned.
     */
    private final String fieldName;

    /**
     * If <code>true</code>, the field will be stored repeatedly if occurs so in tags.
     */
    private final boolean multiValued;

    /**
     * The lowest possible container type, such a field can be stored into.<br>
     * Low means, container with least capabilities.
     */
    private final ContainerType lowestContainer;
    
    /**
     * The highest possible container type, such a field can be stored into.<br>
     * High means, most capabilities, for example string length exceeds that of
     * the extended content description, it will be stored one level up (metadata library).
     */
    private final ContainerType highestContainer;
    
    /**
     * Creates an instance<br>
     * Lowest/Highest will be {@link ContainerType#EXTENDED_CONTENT} /
     * {@link ContainerType#METADATA_LIBRARY_OBJECT}
     * 
     * @param asfFieldName
     *            standard field identifier.
     * @param multiValue
     *            <code>true</code> if the this ASF field can have multiple
     *            values.
     */
    private AsfFieldKey(final String asfFieldName, final boolean multiValue) {
        this(asfFieldName, multiValue, ContainerType.EXTENDED_CONTENT,
                ContainerType.METADATA_LIBRARY_OBJECT);
    }
    
    /**
     * Creates an instance.<br>
     * 
     * @param asfFieldName
     *              standard field identifier.
     * @param multiValue           
     *              <code>true</code> if the this ASF field can have multiple
     *              values.
     * @param restrictedTo
     *              fields must be stored in this container.
     */
    private AsfFieldKey(final String asfFieldName, final boolean multiValue,
            final ContainerType restrictedTo) {
        this(asfFieldName, multiValue, restrictedTo, restrictedTo);
    }

    /**
     * Creates an instance.<br>
     * 
     * @param asfFieldName
     *              standard field identifier.
     * @param multiValue           
     *              <code>true</code> if the this ASF field can have multiple
     *              values.
     * @param lowest
     *              fields must be stored at least in this container.
     * @param highest
     *              fields aren't allowed to be stored in better containers than
     *              this.
     */
    private AsfFieldKey(final String asfFieldName, final boolean multiValue,
            final ContainerType lowest, final ContainerType highest) {
        this.fieldName = asfFieldName;
        assert !multiValue || highest.isMultiValued() : "Definition error";
        this.multiValued = multiValue && highest.isMultiValued();
        this.lowestContainer = lowest;
        this.highestContainer = highest;
        assert ContainerType.areInCorrectOrder(lowest, highest);
    }


    /**
     * Returns the standard field id.
     *
     * @return the standard field id. (may be <code>null</code>)
     */
    public String getFieldName()
    {
        return this.fieldName;
    }

    /**
     * @return the highestContainer
     */
    public ContainerType getHighestContainer() {
        return this.highestContainer;
    }
    
    /**
     * @return the lowestContainer
     */
    public ContainerType getLowestContainer() {
        return this.lowestContainer;
    }
    
    /**
     * Returns <code>true</code> if this field can store multiple values.
     *
     * @return <code>true</code> if multiple values are supported for this field.
     */
    public boolean isMultiValued()
    {
        return this.multiValued;
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public String toString()
    {
        return getFieldName();
    }
}
