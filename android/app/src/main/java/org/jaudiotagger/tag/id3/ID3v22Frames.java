/*
 * Jaudiotagger Copyright (C)2004,2005
 *
 * This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 * or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along with this library; if not,
 * you can getFields a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
package org.jaudiotagger.tag.id3;

import org.jaudiotagger.tag.FieldKey;

import java.util.EnumMap;
import java.util.Map;

/**
 * Defines ID3v22 frames and collections that categorise frames within an ID3v22 tag.
 *
 * You can include frames here that are not officially supported as long as they can be used within an
 * ID3v22Tag
 *
 * @author Paul Taylor
 * @version $Id$
 */
public class ID3v22Frames extends ID3Frames
{
    //V2 Frames (only 3 chars)
    public static final String FRAME_ID_V2_ACCOMPANIMENT = "TP2";
    public static final String FRAME_ID_V2_ALBUM = "TAL";
    public static final String FRAME_ID_V2_ARTIST = "TP1";
    public static final String FRAME_ID_V2_ATTACHED_PICTURE = "PIC";
    public static final String FRAME_ID_V2_AUDIO_ENCRYPTION = "CRA";
    public static final String FRAME_ID_V2_BPM = "TBP";
    public static final String FRAME_ID_V2_COMMENT = "COM";
    public static final String FRAME_ID_V2_COMPOSER = "TCM";
    public static final String FRAME_ID_V2_CONDUCTOR = "TPE";
    public static final String FRAME_ID_V2_CONTENT_GROUP_DESC = "TT1";
    public static final String FRAME_ID_V2_COPYRIGHTINFO = "TCR";
    public static final String FRAME_ID_V2_ENCODEDBY = "TEN";
    public static final String FRAME_ID_V2_ENCRYPTED_FRAME = "CRM";
    public static final String FRAME_ID_V2_EQUALISATION = "EQU";
    public static final String FRAME_ID_V2_EVENT_TIMING_CODES = "ETC";
    public static final String FRAME_ID_V2_FILE_TYPE = "TFT";
    public static final String FRAME_ID_V2_GENERAL_ENCAPS_OBJECT = "GEO";
    public static final String FRAME_ID_V2_GENRE = "TCO";
    public static final String FRAME_ID_V2_HW_SW_SETTINGS = "TSS";
    public static final String FRAME_ID_V2_INITIAL_KEY = "TKE";
    public static final String FRAME_ID_V2_IPLS = "IPL";
    public static final String FRAME_ID_V2_ISRC = "TRC";
    public static final String FRAME_ID_V2_ITUNES_GROUPING = "GP1";
    public static final String FRAME_ID_V2_LANGUAGE = "TLA";
    public static final String FRAME_ID_V2_LENGTH = "TLE";
    public static final String FRAME_ID_V2_LINKED_INFO = "LNK";
    public static final String FRAME_ID_V2_LYRICIST = "TXT";
    public static final String FRAME_ID_V2_MEDIA_TYPE = "TMT";
    public static final String FRAME_ID_V2_MOVEMENT = "MVN";
    public static final String FRAME_ID_V2_MOVEMENT_NO = "MVI";
    public static final String FRAME_ID_V2_MPEG_LOCATION_LOOKUP_TABLE = "MLL";
    public static final String FRAME_ID_V2_MUSIC_CD_ID = "MCI";
    public static final String FRAME_ID_V2_ORIGARTIST = "TOA";
    public static final String FRAME_ID_V2_ORIG_FILENAME = "TOF";
    public static final String FRAME_ID_V2_ORIG_LYRICIST = "TOL";
    public static final String FRAME_ID_V2_ORIG_TITLE = "TOT";
    public static final String FRAME_ID_V2_PLAYLIST_DELAY = "TDY";
    public static final String FRAME_ID_V2_PLAY_COUNTER = "CNT";
    public static final String FRAME_ID_V2_POPULARIMETER = "POP";
    public static final String FRAME_ID_V2_PUBLISHER = "TPB";
    public static final String FRAME_ID_V2_RECOMMENDED_BUFFER_SIZE = "BUF";
    public static final String FRAME_ID_V2_RELATIVE_VOLUME_ADJUSTMENT = "RVA";
    public static final String FRAME_ID_V2_REMIXED = "TP4";
    public static final String FRAME_ID_V2_REVERB = "REV";
    public static final String FRAME_ID_V2_SET = "TPA";
    public static final String FRAME_ID_V2_SET_SUBTITLE = "TPS";     //Note this is non-standard
    public static final String FRAME_ID_V2_SYNC_LYRIC = "SLT";
    public static final String FRAME_ID_V2_SYNC_TEMPO = "STC";
    public static final String FRAME_ID_V2_TDAT = "TDA";
    public static final String FRAME_ID_V2_TIME = "TIM";
    public static final String FRAME_ID_V2_TITLE = "TT2";
    public static final String FRAME_ID_V2_TITLE_REFINEMENT = "TT3";
    public static final String FRAME_ID_V2_TORY = "TOR";
    public static final String FRAME_ID_V2_TRACK = "TRK";
    public static final String FRAME_ID_V2_TRDA = "TRD";
    public static final String FRAME_ID_V2_TSIZ = "TSI";
    public static final String FRAME_ID_V2_TYER = "TYE";
    public static final String FRAME_ID_V2_UNIQUE_FILE_ID = "UFI";
    public static final String FRAME_ID_V2_UNSYNC_LYRICS = "ULT";
    public static final String FRAME_ID_V2_URL_ARTIST_WEB = "WAR";
    public static final String FRAME_ID_V2_URL_COMMERCIAL = "WCM";
    public static final String FRAME_ID_V2_URL_COPYRIGHT = "WCP";
    public static final String FRAME_ID_V2_URL_FILE_WEB = "WAF";
    public static final String FRAME_ID_V2_URL_OFFICIAL_RADIO = "WRS";
    public static final String FRAME_ID_V2_URL_PAYMENT = "WPAY";
    public static final String FRAME_ID_V2_URL_PUBLISHERS = "WPB";
    public static final String FRAME_ID_V2_URL_SOURCE_WEB = "WAS";
    public static final String FRAME_ID_V2_USER_DEFINED_INFO = "TXX";
    public static final String FRAME_ID_V2_USER_DEFINED_URL = "WXX";

    public static final String FRAME_ID_V2_IS_COMPILATION = "TCP";
    public static final String FRAME_ID_V2_TITLE_SORT_ORDER_ITUNES = "TST";
    public static final String FRAME_ID_V2_ARTIST_SORT_ORDER_ITUNES = "TSP";
    public static final String FRAME_ID_V2_ALBUM_SORT_ORDER_ITUNES = "TSA";
    public static final String FRAME_ID_V2_ALBUM_ARTIST_SORT_ORDER_ITUNES = "TS2";
    public static final String FRAME_ID_V2_COMPOSER_SORT_ORDER_ITUNES = "TSC";

    private static ID3v22Frames id3v22Frames;

    /**
     * Maps from Generic key to ID3 key
     */
    protected EnumMap<FieldKey, ID3v22FieldKey> tagFieldToId3 = new EnumMap<FieldKey, ID3v22FieldKey>(FieldKey.class);

    /**
     * Maps from ID3 key to Generic key
     */
    protected EnumMap<ID3v22FieldKey, FieldKey> id3ToTagField = new EnumMap<ID3v22FieldKey,FieldKey>(ID3v22FieldKey.class);


    public static ID3v22Frames getInstanceOf()
    {
        if (id3v22Frames == null)
        {
            id3v22Frames = new ID3v22Frames();
        }
        return id3v22Frames;
    }

    private ID3v22Frames()
    {
        // The defined v22 frames
        supportedFrames.add(FRAME_ID_V2_ACCOMPANIMENT);
        supportedFrames.add(FRAME_ID_V2_ALBUM);
        supportedFrames.add(FRAME_ID_V2_ARTIST);
        supportedFrames.add(FRAME_ID_V2_ATTACHED_PICTURE);
        supportedFrames.add(FRAME_ID_V2_AUDIO_ENCRYPTION);
        supportedFrames.add(FRAME_ID_V2_BPM);
        supportedFrames.add(FRAME_ID_V2_COMMENT);
        supportedFrames.add(FRAME_ID_V2_COMPOSER);
        supportedFrames.add(FRAME_ID_V2_ENCRYPTED_FRAME);
        supportedFrames.add(FRAME_ID_V2_CONDUCTOR);
        supportedFrames.add(FRAME_ID_V2_CONTENT_GROUP_DESC);
        supportedFrames.add(FRAME_ID_V2_COPYRIGHTINFO);
        supportedFrames.add(FRAME_ID_V2_ENCODEDBY);
        supportedFrames.add(FRAME_ID_V2_EQUALISATION);
        supportedFrames.add(FRAME_ID_V2_EVENT_TIMING_CODES);
        supportedFrames.add(FRAME_ID_V2_FILE_TYPE);
        supportedFrames.add(FRAME_ID_V2_GENERAL_ENCAPS_OBJECT);
        supportedFrames.add(FRAME_ID_V2_GENRE);
        supportedFrames.add(FRAME_ID_V2_HW_SW_SETTINGS);
        supportedFrames.add(FRAME_ID_V2_INITIAL_KEY);
        supportedFrames.add(FRAME_ID_V2_IPLS);
        supportedFrames.add(FRAME_ID_V2_ISRC);
        supportedFrames.add(FRAME_ID_V2_ITUNES_GROUPING);
        supportedFrames.add(FRAME_ID_V2_LANGUAGE);
        supportedFrames.add(FRAME_ID_V2_LENGTH);
        supportedFrames.add(FRAME_ID_V2_LINKED_INFO);
        supportedFrames.add(FRAME_ID_V2_LYRICIST);
        supportedFrames.add(FRAME_ID_V2_MEDIA_TYPE);
        supportedFrames.add(FRAME_ID_V2_MOVEMENT);
        supportedFrames.add(FRAME_ID_V2_MOVEMENT_NO);
        supportedFrames.add(FRAME_ID_V2_MPEG_LOCATION_LOOKUP_TABLE);
        supportedFrames.add(FRAME_ID_V2_MUSIC_CD_ID);
        supportedFrames.add(FRAME_ID_V2_ORIGARTIST);
        supportedFrames.add(FRAME_ID_V2_ORIG_FILENAME);
        supportedFrames.add(FRAME_ID_V2_ORIG_LYRICIST);
        supportedFrames.add(FRAME_ID_V2_ORIG_TITLE);
        supportedFrames.add(FRAME_ID_V2_PLAYLIST_DELAY);
        supportedFrames.add(FRAME_ID_V2_PLAY_COUNTER);
        supportedFrames.add(FRAME_ID_V2_POPULARIMETER);
        supportedFrames.add(FRAME_ID_V2_PUBLISHER);
        supportedFrames.add(FRAME_ID_V2_RECOMMENDED_BUFFER_SIZE);
        supportedFrames.add(FRAME_ID_V2_RELATIVE_VOLUME_ADJUSTMENT);
        supportedFrames.add(FRAME_ID_V2_REMIXED);
        supportedFrames.add(FRAME_ID_V2_REVERB);
        supportedFrames.add(FRAME_ID_V2_SET);
        supportedFrames.add(FRAME_ID_V2_SYNC_LYRIC);
        supportedFrames.add(FRAME_ID_V2_SYNC_TEMPO);
        supportedFrames.add(FRAME_ID_V2_TDAT);
        supportedFrames.add(FRAME_ID_V2_TIME);
        supportedFrames.add(FRAME_ID_V2_TITLE);
        supportedFrames.add(FRAME_ID_V2_TITLE_REFINEMENT);
        supportedFrames.add(FRAME_ID_V2_TORY);
        supportedFrames.add(FRAME_ID_V2_TRACK);
        supportedFrames.add(FRAME_ID_V2_TRDA);
        supportedFrames.add(FRAME_ID_V2_TSIZ);
        supportedFrames.add(FRAME_ID_V2_TYER);
        supportedFrames.add(FRAME_ID_V2_UNIQUE_FILE_ID);
        supportedFrames.add(FRAME_ID_V2_UNSYNC_LYRICS);
        supportedFrames.add(FRAME_ID_V2_URL_ARTIST_WEB);
        supportedFrames.add(FRAME_ID_V2_URL_COMMERCIAL);
        supportedFrames.add(FRAME_ID_V2_URL_COPYRIGHT);
        supportedFrames.add(FRAME_ID_V2_URL_FILE_WEB);
        supportedFrames.add(FRAME_ID_V2_URL_OFFICIAL_RADIO);
        supportedFrames.add(FRAME_ID_V2_URL_PAYMENT);
        supportedFrames.add(FRAME_ID_V2_URL_PUBLISHERS);
        supportedFrames.add(FRAME_ID_V2_URL_SOURCE_WEB);
        supportedFrames.add(FRAME_ID_V2_USER_DEFINED_INFO);
        supportedFrames.add(FRAME_ID_V2_USER_DEFINED_URL);

        //Extension
        extensionFrames.add(FRAME_ID_V2_IS_COMPILATION);
        extensionFrames.add(FRAME_ID_V2_TITLE_SORT_ORDER_ITUNES);
        extensionFrames.add(FRAME_ID_V2_ARTIST_SORT_ORDER_ITUNES);
        extensionFrames.add(FRAME_ID_V2_ALBUM_SORT_ORDER_ITUNES);
        extensionFrames.add(FRAME_ID_V2_ALBUM_ARTIST_SORT_ORDER_ITUNES);
        extensionFrames.add(FRAME_ID_V2_COMPOSER_SORT_ORDER_ITUNES);

        //Common
        commonFrames.add(FRAME_ID_V2_ARTIST);
        commonFrames.add(FRAME_ID_V2_ALBUM);
        commonFrames.add(FRAME_ID_V2_TITLE);
        commonFrames.add(FRAME_ID_V2_GENRE);
        commonFrames.add(FRAME_ID_V2_TRACK);
        commonFrames.add(FRAME_ID_V2_TYER);
        commonFrames.add(FRAME_ID_V2_COMMENT);

        //Binary
        binaryFrames.add(FRAME_ID_V2_ATTACHED_PICTURE);
        binaryFrames.add(FRAME_ID_V2_AUDIO_ENCRYPTION);
        binaryFrames.add(FRAME_ID_V2_ENCRYPTED_FRAME);
        binaryFrames.add(FRAME_ID_V2_EQUALISATION);
        binaryFrames.add(FRAME_ID_V2_EVENT_TIMING_CODES);
        binaryFrames.add(FRAME_ID_V2_GENERAL_ENCAPS_OBJECT);
        binaryFrames.add(FRAME_ID_V2_RELATIVE_VOLUME_ADJUSTMENT);
        binaryFrames.add(FRAME_ID_V2_RECOMMENDED_BUFFER_SIZE);
        binaryFrames.add(FRAME_ID_V2_UNIQUE_FILE_ID);

        // Map frameid to a name
        idToValue.put(FRAME_ID_V2_ACCOMPANIMENT, "Text: Band/Orchestra/Accompaniment");
        idToValue.put(FRAME_ID_V2_ALBUM, "Text: Album/Movie/Show title");
        idToValue.put(FRAME_ID_V2_ARTIST, "Text: Lead artist(s)/Lead performer(s)/Soloist(s)/Performing group");
        idToValue.put(FRAME_ID_V2_ATTACHED_PICTURE, "Attached picture");
        idToValue.put(FRAME_ID_V2_AUDIO_ENCRYPTION, "Audio encryption");
        idToValue.put(FRAME_ID_V2_BPM, "Text: BPM (Beats Per Minute)");
        idToValue.put(FRAME_ID_V2_COMMENT, "Comments");
        idToValue.put(FRAME_ID_V2_COMPOSER, "Text: Composer");
        idToValue.put(FRAME_ID_V2_CONDUCTOR, "Text: Conductor/Performer refinement");
        idToValue.put(FRAME_ID_V2_CONTENT_GROUP_DESC, "Text: Content group description");
        idToValue.put(FRAME_ID_V2_COPYRIGHTINFO, "Text: Copyright message");
        idToValue.put(FRAME_ID_V2_ENCODEDBY, "Text: Encoded by");
        idToValue.put(FRAME_ID_V2_ENCRYPTED_FRAME, "Encrypted meta frame");
        idToValue.put(FRAME_ID_V2_EQUALISATION, "Equalization");
        idToValue.put(FRAME_ID_V2_EVENT_TIMING_CODES, "Event timing codes");
        idToValue.put(FRAME_ID_V2_FILE_TYPE, "Text: File type");
        idToValue.put(FRAME_ID_V2_GENERAL_ENCAPS_OBJECT, "General encapsulated datatype");
        idToValue.put(FRAME_ID_V2_GENRE, "Text: Content type");
        idToValue.put(FRAME_ID_V2_HW_SW_SETTINGS, "Text: Software/hardware and settings used for encoding");
        idToValue.put(FRAME_ID_V2_INITIAL_KEY, "Text: Initial key");
        idToValue.put(FRAME_ID_V2_IPLS, "Involved people list");
        idToValue.put(FRAME_ID_V2_ISRC, "Text: ISRC (International Standard Recording Code)");
        idToValue.put(FRAME_ID_V2_ITUNES_GROUPING, "iTunes Grouping");
        idToValue.put(FRAME_ID_V2_LANGUAGE, "Text: Language(s)");
        idToValue.put(FRAME_ID_V2_LENGTH, "Text: Length");
        idToValue.put(FRAME_ID_V2_LINKED_INFO, "Linked information");
        idToValue.put(FRAME_ID_V2_LYRICIST, "Text: Lyricist/text writer");
        idToValue.put(FRAME_ID_V2_MEDIA_TYPE, "Text: Media type");
        idToValue.put(FRAME_ID_V2_MOVEMENT, "Text: Movement");
        idToValue.put(FRAME_ID_V2_MOVEMENT_NO, "Text: Movement No");
        idToValue.put(FRAME_ID_V2_MPEG_LOCATION_LOOKUP_TABLE, "MPEG location lookup table");
        idToValue.put(FRAME_ID_V2_MUSIC_CD_ID, "Music CD Identifier");
        idToValue.put(FRAME_ID_V2_ORIGARTIST, "Text: Original artist(s)/performer(s)");
        idToValue.put(FRAME_ID_V2_ORIG_FILENAME, "Text: Original filename");
        idToValue.put(FRAME_ID_V2_ORIG_LYRICIST, "Text: Original Lyricist(s)/text writer(s)");
        idToValue.put(FRAME_ID_V2_ORIG_TITLE, "Text: Original album/Movie/Show title");
        idToValue.put(FRAME_ID_V2_PLAYLIST_DELAY, "Text: Playlist delay");
        idToValue.put(FRAME_ID_V2_PLAY_COUNTER, "Play counter");
        idToValue.put(FRAME_ID_V2_POPULARIMETER, "Popularimeter");
        idToValue.put(FRAME_ID_V2_PUBLISHER, "Text: Publisher");
        idToValue.put(FRAME_ID_V2_RECOMMENDED_BUFFER_SIZE, "Recommended buffer size");
        idToValue.put(FRAME_ID_V2_RELATIVE_VOLUME_ADJUSTMENT, "Relative volume adjustment");
        idToValue.put(FRAME_ID_V2_REMIXED, "Text: Interpreted, remixed, or otherwise modified by");
        idToValue.put(FRAME_ID_V2_REVERB, "Reverb");
        idToValue.put(FRAME_ID_V2_SET, "Text: Part of a setField");
        idToValue.put(FRAME_ID_V2_SET_SUBTITLE, "Text: Set subtitle");
        idToValue.put(FRAME_ID_V2_SYNC_LYRIC, "Synchronized lyric/text");
        idToValue.put(FRAME_ID_V2_SYNC_TEMPO, "Synced tempo codes");
        idToValue.put(FRAME_ID_V2_TDAT, "Text: Date");
        idToValue.put(FRAME_ID_V2_TIME, "Text: Time");
        idToValue.put(FRAME_ID_V2_TITLE, "Text: Title/Songname/Content description");
        idToValue.put(FRAME_ID_V2_TITLE_REFINEMENT, "Text: Subtitle/Description refinement");
        idToValue.put(FRAME_ID_V2_TORY, "Text: Original release year");
        idToValue.put(FRAME_ID_V2_TRACK, "Text: Track number/Position in setField");
        idToValue.put(FRAME_ID_V2_TRDA, "Text: Recording dates");
        idToValue.put(FRAME_ID_V2_TSIZ, "Text: Size");
        idToValue.put(FRAME_ID_V2_TYER, "Text: Year");
        idToValue.put(FRAME_ID_V2_UNIQUE_FILE_ID, "Unique file identifier");
        idToValue.put(FRAME_ID_V2_UNSYNC_LYRICS, "Unsychronized lyric/text transcription");
        idToValue.put(FRAME_ID_V2_URL_ARTIST_WEB, "URL: Official artist/performer webpage");
        idToValue.put(FRAME_ID_V2_URL_COMMERCIAL, "URL: Commercial information");
        idToValue.put(FRAME_ID_V2_URL_COPYRIGHT, "URL: Copyright/Legal information");
        idToValue.put(FRAME_ID_V2_URL_FILE_WEB, "URL: Official audio file webpage");
        idToValue.put(FRAME_ID_V2_URL_OFFICIAL_RADIO, "URL: Official radio station");
        idToValue.put(FRAME_ID_V2_URL_PAYMENT, "URL: Official payment site");
        idToValue.put(FRAME_ID_V2_URL_PUBLISHERS, "URL: Publishers official webpage");
        idToValue.put(FRAME_ID_V2_URL_SOURCE_WEB, "URL: Official audio source webpage");
        idToValue.put(FRAME_ID_V2_USER_DEFINED_INFO, "User defined text information frame");
        idToValue.put(FRAME_ID_V2_USER_DEFINED_URL, "User defined URL link frame");

        idToValue.put(FRAME_ID_V2_IS_COMPILATION, "Is Compilation");
        idToValue.put(FRAME_ID_V2_TITLE_SORT_ORDER_ITUNES, "Text: title sort order");
        idToValue.put(FRAME_ID_V2_ARTIST_SORT_ORDER_ITUNES, "Text: artist sort order");
        idToValue.put(FRAME_ID_V2_ALBUM_SORT_ORDER_ITUNES, "Text: album sort order");
        idToValue.put(FRAME_ID_V2_ALBUM_ARTIST_SORT_ORDER_ITUNES, "Text:Album Artist Sort Order Frame");
        idToValue.put(FRAME_ID_V2_COMPOSER_SORT_ORDER_ITUNES, "Text:Composer Sort Order Frame");


        createMaps();

        multipleFrames.add(FRAME_ID_V2_ATTACHED_PICTURE);
        multipleFrames.add(FRAME_ID_V2_UNIQUE_FILE_ID);
        multipleFrames.add(FRAME_ID_V2_POPULARIMETER);
        multipleFrames.add(FRAME_ID_V2_USER_DEFINED_INFO);
        multipleFrames.add(FRAME_ID_V2_USER_DEFINED_URL);
        multipleFrames.add(FRAME_ID_V2_COMMENT);
        multipleFrames.add(FRAME_ID_V2_UNSYNC_LYRICS);
        multipleFrames.add(FRAME_ID_V2_GENERAL_ENCAPS_OBJECT);
        multipleFrames.add(FRAME_ID_V2_URL_ARTIST_WEB);

        //Mapping generic key to id3v22 key

        tagFieldToId3.put(FieldKey.ACOUSTID_FINGERPRINT, ID3v22FieldKey.ACOUSTID_FINGERPRINT);
        tagFieldToId3.put(FieldKey.ACOUSTID_ID, ID3v22FieldKey.ACOUSTID_ID);
        tagFieldToId3.put(FieldKey.ALBUM, ID3v22FieldKey.ALBUM);
        tagFieldToId3.put(FieldKey.ALBUM_ARTIST, ID3v22FieldKey.ALBUM_ARTIST);
        tagFieldToId3.put(FieldKey.ALBUM_ARTIST_SORT, ID3v22FieldKey.ALBUM_ARTIST_SORT);
        tagFieldToId3.put(FieldKey.ALBUM_ARTISTS, ID3v22FieldKey.ALBUM_ARTISTS);
        tagFieldToId3.put(FieldKey.ALBUM_ARTISTS_SORT, ID3v22FieldKey.ALBUM_ARTISTS_SORT);
        tagFieldToId3.put(FieldKey.ALBUM_SORT, ID3v22FieldKey.ALBUM_SORT);
        tagFieldToId3.put(FieldKey.AMAZON_ID, ID3v22FieldKey.AMAZON_ID);
        tagFieldToId3.put(FieldKey.ARRANGER, ID3v22FieldKey.ARRANGER);
        tagFieldToId3.put(FieldKey.ARRANGER_SORT, ID3v22FieldKey.ARRANGER_SORT);
        tagFieldToId3.put(FieldKey.ARTIST, ID3v22FieldKey.ARTIST);
        tagFieldToId3.put(FieldKey.ARTISTS, ID3v22FieldKey.ARTISTS);
        tagFieldToId3.put(FieldKey.ARTISTS_SORT, ID3v22FieldKey.ARTISTS_SORT);
        tagFieldToId3.put(FieldKey.ARTIST_SORT, ID3v22FieldKey.ARTIST_SORT);
        tagFieldToId3.put(FieldKey.BARCODE, ID3v22FieldKey.BARCODE);
        tagFieldToId3.put(FieldKey.BPM, ID3v22FieldKey.BPM);
        tagFieldToId3.put(FieldKey.CATALOG_NO, ID3v22FieldKey.CATALOG_NO);
        tagFieldToId3.put(FieldKey.CHOIR, ID3v22FieldKey.CHOIR);
        tagFieldToId3.put(FieldKey.CHOIR_SORT, ID3v22FieldKey.CHOIR_SORT);
        tagFieldToId3.put(FieldKey.CLASSICAL_CATALOG, ID3v22FieldKey.CLASSICAL_CATALOG);
        tagFieldToId3.put(FieldKey.CLASSICAL_NICKNAME, ID3v22FieldKey.CLASSICAL_NICKNAME);
        tagFieldToId3.put(FieldKey.COMMENT, ID3v22FieldKey.COMMENT);
        tagFieldToId3.put(FieldKey.COMPOSER, ID3v22FieldKey.COMPOSER);
        tagFieldToId3.put(FieldKey.COMPOSER_SORT, ID3v22FieldKey.COMPOSER_SORT);
        tagFieldToId3.put(FieldKey.CONDUCTOR, ID3v22FieldKey.CONDUCTOR);
        tagFieldToId3.put(FieldKey.CONDUCTOR_SORT, ID3v22FieldKey.CONDUCTOR_SORT);
        tagFieldToId3.put(FieldKey.COUNTRY, ID3v22FieldKey.COUNTRY);
        tagFieldToId3.put(FieldKey.COPYRIGHT, ID3v22FieldKey.COPYRIGHT);
        tagFieldToId3.put(FieldKey.COVER_ART, ID3v22FieldKey.COVER_ART);
        tagFieldToId3.put(FieldKey.CUSTOM1, ID3v22FieldKey.CUSTOM1);
        tagFieldToId3.put(FieldKey.CUSTOM2, ID3v22FieldKey.CUSTOM2);
        tagFieldToId3.put(FieldKey.CUSTOM3, ID3v22FieldKey.CUSTOM3);
        tagFieldToId3.put(FieldKey.CUSTOM4, ID3v22FieldKey.CUSTOM4);
        tagFieldToId3.put(FieldKey.CUSTOM5, ID3v22FieldKey.CUSTOM5);
        tagFieldToId3.put(FieldKey.DISC_NO, ID3v22FieldKey.DISC_NO);
        tagFieldToId3.put(FieldKey.DISC_SUBTITLE, ID3v22FieldKey.DISC_SUBTITLE);
        tagFieldToId3.put(FieldKey.DISC_TOTAL, ID3v22FieldKey.DISC_NO);
        tagFieldToId3.put(FieldKey.DJMIXER, ID3v22FieldKey.DJMIXER);
        tagFieldToId3.put(FieldKey.ENCODER, ID3v22FieldKey.ENCODER);
        tagFieldToId3.put(FieldKey.ENGINEER, ID3v22FieldKey.ENGINEER);
        tagFieldToId3.put(FieldKey.ENSEMBLE, ID3v22FieldKey.ENSEMBLE);
        tagFieldToId3.put(FieldKey.ENSEMBLE_SORT, ID3v22FieldKey.ENSEMBLE_SORT);
        tagFieldToId3.put(FieldKey.FBPM, ID3v22FieldKey.FBPM);
        tagFieldToId3.put(FieldKey.GENRE, ID3v22FieldKey.GENRE);
        tagFieldToId3.put(FieldKey.GROUP, ID3v22FieldKey.GROUP);
        tagFieldToId3.put(FieldKey.GROUPING, ID3v22FieldKey.GROUPING);
        tagFieldToId3.put(FieldKey.INSTRUMENT, ID3v22FieldKey.INSTRUMENT);
        tagFieldToId3.put(FieldKey.INVOLVED_PERSON, ID3v22FieldKey.INVOLVED_PERSON);
        tagFieldToId3.put(FieldKey.ISRC, ID3v22FieldKey.ISRC);
        tagFieldToId3.put(FieldKey.IS_CLASSICAL, ID3v22FieldKey.IS_CLASSICAL);
        tagFieldToId3.put(FieldKey.IS_COMPILATION, ID3v22FieldKey.IS_COMPILATION);
        tagFieldToId3.put(FieldKey.IS_SOUNDTRACK, ID3v22FieldKey.IS_SOUNDTRACK);
        tagFieldToId3.put(FieldKey.ITUNES_GROUPING, ID3v22FieldKey.ITUNES_GROUPING);
        tagFieldToId3.put(FieldKey.KEY, ID3v22FieldKey.KEY);
        tagFieldToId3.put(FieldKey.LANGUAGE, ID3v22FieldKey.LANGUAGE);
        tagFieldToId3.put(FieldKey.LYRICIST, ID3v22FieldKey.LYRICIST);
        tagFieldToId3.put(FieldKey.LYRICS, ID3v22FieldKey.LYRICS);
        tagFieldToId3.put(FieldKey.MEDIA, ID3v22FieldKey.MEDIA);
        tagFieldToId3.put(FieldKey.MIXER, ID3v22FieldKey.MIXER);
        tagFieldToId3.put(FieldKey.MOOD, ID3v22FieldKey.MOOD);
        tagFieldToId3.put(FieldKey.MOOD_ACOUSTIC, ID3v22FieldKey.MOOD_ACOUSTIC);
        tagFieldToId3.put(FieldKey.MOOD_AGGRESSIVE, ID3v22FieldKey.MOOD_AGGRESSIVE);
        tagFieldToId3.put(FieldKey.MOOD_AROUSAL, ID3v22FieldKey.MOOD_AROUSAL);
        tagFieldToId3.put(FieldKey.MOOD_DANCEABILITY, ID3v22FieldKey.MOOD_DANCEABILITY);
        tagFieldToId3.put(FieldKey.MOOD_ELECTRONIC, ID3v22FieldKey.MOOD_ELECTRONIC);
        tagFieldToId3.put(FieldKey.MOOD_HAPPY, ID3v22FieldKey.MOOD_HAPPY);
        tagFieldToId3.put(FieldKey.MOOD_INSTRUMENTAL, ID3v22FieldKey.MOOD_INSTRUMENTAL);
        tagFieldToId3.put(FieldKey.MOOD_PARTY, ID3v22FieldKey.MOOD_PARTY);
        tagFieldToId3.put(FieldKey.MOOD_RELAXED, ID3v22FieldKey.MOOD_RELAXED);
        tagFieldToId3.put(FieldKey.MOOD_SAD, ID3v22FieldKey.MOOD_SAD);
        tagFieldToId3.put(FieldKey.MOOD_VALENCE, ID3v22FieldKey.MOOD_VALENCE);
        tagFieldToId3.put(FieldKey.MOVEMENT, ID3v22FieldKey.MOVEMENT);
        tagFieldToId3.put(FieldKey.MOVEMENT_NO, ID3v22FieldKey.MOVEMENT_NO);
        tagFieldToId3.put(FieldKey.MOVEMENT_TOTAL, ID3v22FieldKey.MOVEMENT_TOTAL);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_ARTISTID, ID3v22FieldKey.MUSICBRAINZ_ARTISTID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_DISC_ID, ID3v22FieldKey.MUSICBRAINZ_DISC_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_ORIGINAL_RELEASE_ID, ID3v22FieldKey.MUSICBRAINZ_ORIGINAL_RELEASEID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASEARTISTID, ID3v22FieldKey.MUSICBRAINZ_RELEASEARTISTID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASEID, ID3v22FieldKey.MUSICBRAINZ_RELEASEID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASE_COUNTRY, ID3v22FieldKey.MUSICBRAINZ_RELEASE_COUNTRY);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASE_GROUP_ID, ID3v22FieldKey.MUSICBRAINZ_RELEASE_GROUP_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASE_STATUS, ID3v22FieldKey.MUSICBRAINZ_RELEASE_STATUS);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASE_TRACK_ID, ID3v22FieldKey.MUSICBRAINZ_RELEASE_TRACK_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASE_TYPE, ID3v22FieldKey.MUSICBRAINZ_RELEASE_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_TRACK_ID, ID3v22FieldKey.MUSICBRAINZ_TRACK_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK, ID3v22FieldKey.MUSICBRAINZ_WORK);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_ID, ID3v22FieldKey.MUSICBRAINZ_WORK_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_COMPOSITION_ID, ID3v22FieldKey.MUSICBRAINZ_WORK_COMPOSITION_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_ID, ID3v22FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_ID, ID3v22FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_ID, ID3v22FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_ID, ID3v22FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_ID, ID3v22FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_ID, ID3v22FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_ID);
        tagFieldToId3.put(FieldKey.MUSICIP_ID, ID3v22FieldKey.MUSICIP_ID);
        tagFieldToId3.put(FieldKey.OCCASION, ID3v22FieldKey.OCCASION);
        tagFieldToId3.put(FieldKey.OPUS, ID3v22FieldKey.OPUS);
        tagFieldToId3.put(FieldKey.ORCHESTRA, ID3v22FieldKey.ORCHESTRA);
        tagFieldToId3.put(FieldKey.ORCHESTRA_SORT, ID3v22FieldKey.ORCHESTRA_SORT);
        tagFieldToId3.put(FieldKey.ORIGINAL_ALBUM, ID3v22FieldKey.ORIGINAL_ALBUM);
        tagFieldToId3.put(FieldKey.ORIGINAL_ARTIST, ID3v22FieldKey.ORIGINAL_ARTIST);
        tagFieldToId3.put(FieldKey.ORIGINAL_LYRICIST, ID3v22FieldKey.ORIGINAL_LYRICIST);
        tagFieldToId3.put(FieldKey.ORIGINAL_YEAR, ID3v22FieldKey.ORIGINAL_YEAR);
        tagFieldToId3.put(FieldKey.PART, ID3v22FieldKey.PART);
        tagFieldToId3.put(FieldKey.PART_NUMBER, ID3v22FieldKey.PART_NUMBER);
        tagFieldToId3.put(FieldKey.PART_TYPE, ID3v22FieldKey.PART_TYPE);
        tagFieldToId3.put(FieldKey.PERFORMER, ID3v22FieldKey.PERFORMER);
        tagFieldToId3.put(FieldKey.PERFORMER_NAME, ID3v22FieldKey.PERFORMER_NAME);
        tagFieldToId3.put(FieldKey.PERFORMER_NAME_SORT, ID3v22FieldKey.PERFORMER_NAME_SORT);
        tagFieldToId3.put(FieldKey.PERIOD, ID3v22FieldKey.PERIOD);
        tagFieldToId3.put(FieldKey.PRODUCER, ID3v22FieldKey.PRODUCER);
        tagFieldToId3.put(FieldKey.QUALITY, ID3v22FieldKey.QUALITY);
        tagFieldToId3.put(FieldKey.RANKING, ID3v22FieldKey.RANKING);
        tagFieldToId3.put(FieldKey.RATING, ID3v22FieldKey.RATING);
        tagFieldToId3.put(FieldKey.RECORD_LABEL, ID3v22FieldKey.RECORD_LABEL);
        tagFieldToId3.put(FieldKey.REMIXER, ID3v22FieldKey.REMIXER);
        tagFieldToId3.put(FieldKey.SCRIPT, ID3v22FieldKey.SCRIPT);
        tagFieldToId3.put(FieldKey.SINGLE_DISC_TRACK_NO, ID3v22FieldKey.SINGLE_DISC_TRACK_NO);
        tagFieldToId3.put(FieldKey.SUBTITLE, ID3v22FieldKey.SUBTITLE);
        tagFieldToId3.put(FieldKey.TAGS, ID3v22FieldKey.TAGS);
        tagFieldToId3.put(FieldKey.TEMPO, ID3v22FieldKey.TEMPO);
        tagFieldToId3.put(FieldKey.TIMBRE, ID3v22FieldKey.TIMBRE);
        tagFieldToId3.put(FieldKey.TITLE, ID3v22FieldKey.TITLE);
        tagFieldToId3.put(FieldKey.TITLE_MOVEMENT, ID3v22FieldKey.TITLE_MOVEMENT);
        tagFieldToId3.put(FieldKey.TITLE_SORT, ID3v22FieldKey.TITLE_SORT);
        tagFieldToId3.put(FieldKey.TONALITY, ID3v22FieldKey.TONALITY);
        tagFieldToId3.put(FieldKey.TRACK, ID3v22FieldKey.TRACK);
        tagFieldToId3.put(FieldKey.TRACK_TOTAL, ID3v22FieldKey.TRACK_TOTAL);
        tagFieldToId3.put(FieldKey.URL_DISCOGS_ARTIST_SITE, ID3v22FieldKey.URL_DISCOGS_ARTIST_SITE);
        tagFieldToId3.put(FieldKey.URL_DISCOGS_RELEASE_SITE, ID3v22FieldKey.URL_DISCOGS_RELEASE_SITE);
        tagFieldToId3.put(FieldKey.URL_LYRICS_SITE, ID3v22FieldKey.URL_LYRICS_SITE);
        tagFieldToId3.put(FieldKey.URL_OFFICIAL_ARTIST_SITE, ID3v22FieldKey.URL_OFFICIAL_ARTIST_SITE);
        tagFieldToId3.put(FieldKey.URL_OFFICIAL_RELEASE_SITE, ID3v22FieldKey.URL_OFFICIAL_RELEASE_SITE);
        tagFieldToId3.put(FieldKey.URL_WIKIPEDIA_ARTIST_SITE, ID3v22FieldKey.URL_WIKIPEDIA_ARTIST_SITE);
        tagFieldToId3.put(FieldKey.URL_WIKIPEDIA_RELEASE_SITE, ID3v22FieldKey.URL_WIKIPEDIA_RELEASE_SITE);
        tagFieldToId3.put(FieldKey.WORK, ID3v22FieldKey.WORK);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_COMPOSITION, ID3v22FieldKey.MUSICBRAINZ_WORK_COMPOSITION);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1, ID3v22FieldKey.WORK_PART_LEVEL1);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_TYPE, ID3v22FieldKey.WORK_PART_LEVEL1_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2, ID3v22FieldKey.WORK_PART_LEVEL2);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_TYPE, ID3v22FieldKey.WORK_PART_LEVEL2_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3, ID3v22FieldKey.WORK_PART_LEVEL3);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_TYPE, ID3v22FieldKey.WORK_PART_LEVEL3_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4, ID3v22FieldKey.WORK_PART_LEVEL4);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_TYPE, ID3v22FieldKey.WORK_PART_LEVEL4_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5, ID3v22FieldKey.WORK_PART_LEVEL5);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_TYPE, ID3v22FieldKey.WORK_PART_LEVEL5_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6, ID3v22FieldKey.WORK_PART_LEVEL6);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_TYPE, ID3v22FieldKey.WORK_PART_LEVEL6_TYPE);
        tagFieldToId3.put(FieldKey.WORK_TYPE, ID3v22FieldKey.WORK_TYPE);
        tagFieldToId3.put(FieldKey.YEAR, ID3v22FieldKey.YEAR);


        for(Map.Entry<FieldKey,ID3v22FieldKey> next:tagFieldToId3.entrySet())
        {
            id3ToTagField.put(next.getValue(), next.getKey());
        }
    }

    /**
     * @param genericKey
     * @return id3 key for generic key
     */
    public ID3v22FieldKey getId3KeyFromGenericKey(FieldKey genericKey)
    {
        return tagFieldToId3.get(genericKey);
    }

    /**
     * Get generic key for ID3 field key
     * @param fieldKey
     * @return
     */
    public FieldKey getGenericKeyFromId3(ID3v22FieldKey fieldKey)
    {
        return id3ToTagField.get(fieldKey);
    }
}
