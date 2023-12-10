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
 * Defines ID3v23 frames and collections that categorise frames within an ID3v23 tag.
 *
 * You can include frames here that are not officially supported as long as they can be used within an
 * ID3v23Tag
 *
 * @author Paul Taylor
 * @version $Id$
 */
public class ID3v23Frames extends ID3Frames
{
    /**
     * Define all frames that are valid within ID3v23
     * Frame IDs beginning with T are text frames, and with W are url frames
     */
    public static final String FRAME_ID_V3_ACCOMPANIMENT = "TPE2";
    public static final String FRAME_ID_V3_ALBUM = "TALB";
    public static final String FRAME_ID_V3_ARTIST = "TPE1";
    public static final String FRAME_ID_V3_ATTACHED_PICTURE = "APIC";
    public static final String FRAME_ID_V3_AUDIO_ENCRYPTION = "AENC";
    public static final String FRAME_ID_V3_BPM = "TBPM";
    public static final String FRAME_ID_V3_COMMENT = "COMM";
    public static final String FRAME_ID_V3_COMMERCIAL_FRAME = "COMR";
    public static final String FRAME_ID_V3_COMPOSER = "TCOM";
    public static final String FRAME_ID_V3_CONDUCTOR = "TPE3";
    public static final String FRAME_ID_V3_CONTENT_GROUP_DESC = "TIT1";
    public static final String FRAME_ID_V3_COPYRIGHTINFO = "TCOP";
    public static final String FRAME_ID_V3_ENCODEDBY = "TENC";
    public static final String FRAME_ID_V3_ENCRYPTION = "ENCR";
    public static final String FRAME_ID_V3_EQUALISATION = "EQUA";
    public static final String FRAME_ID_V3_EVENT_TIMING_CODES = "ETCO";
    public static final String FRAME_ID_V3_FILE_OWNER = "TOWN";
    public static final String FRAME_ID_V3_FILE_TYPE = "TFLT";
    public static final String FRAME_ID_V3_GENERAL_ENCAPS_OBJECT = "GEOB";
    public static final String FRAME_ID_V3_GENRE = "TCON";
    public static final String FRAME_ID_V3_GROUP_ID_REG = "GRID";
    public static final String FRAME_ID_V3_HW_SW_SETTINGS = "TSSE";
    public static final String FRAME_ID_V3_INITIAL_KEY = "TKEY";
    public static final String FRAME_ID_V3_INVOLVED_PEOPLE = "IPLS";
    public static final String FRAME_ID_V3_ISRC = "TSRC";
    public static final String FRAME_ID_V3_ITUNES_GROUPING = "GRP1";
    public static final String FRAME_ID_V3_LANGUAGE = "TLAN";
    public static final String FRAME_ID_V3_LENGTH = "TLEN";
    public static final String FRAME_ID_V3_LINKED_INFO = "LINK";
    public static final String FRAME_ID_V3_LYRICIST = "TEXT";
    public static final String FRAME_ID_V3_MEDIA_TYPE = "TMED";
    public static final String FRAME_ID_V3_MOVEMENT = "MVNM";
    public static final String FRAME_ID_V3_MOVEMENT_NO = "MVIN";
    public static final String FRAME_ID_V3_MPEG_LOCATION_LOOKUP_TABLE = "MLLT";
    public static final String FRAME_ID_V3_MUSIC_CD_ID = "MCDI";
    public static final String FRAME_ID_V3_ORIGARTIST = "TOPE";
    public static final String FRAME_ID_V3_ORIG_FILENAME = "TOFN";
    public static final String FRAME_ID_V3_ORIG_LYRICIST = "TOLY";
    public static final String FRAME_ID_V3_ORIG_TITLE = "TOAL";
    public static final String FRAME_ID_V3_OWNERSHIP = "OWNE";
    public static final String FRAME_ID_V3_PLAYLIST_DELAY = "TDLY";
    public static final String FRAME_ID_V3_PLAY_COUNTER = "PCNT";
    public static final String FRAME_ID_V3_POPULARIMETER = "POPM";
    public static final String FRAME_ID_V3_POSITION_SYNC = "POSS";
    public static final String FRAME_ID_V3_PRIVATE = "PRIV";
    public static final String FRAME_ID_V3_PUBLISHER = "TPUB";
    public static final String FRAME_ID_V3_RADIO_NAME = "TRSN";
    public static final String FRAME_ID_V3_RADIO_OWNER = "TRSO";
    public static final String FRAME_ID_V3_RECOMMENDED_BUFFER_SIZE = "RBUF";
    public static final String FRAME_ID_V3_RELATIVE_VOLUME_ADJUSTMENT = "RVAD";
    public static final String FRAME_ID_V3_REMIXED = "TPE4";
    public static final String FRAME_ID_V3_REVERB = "RVRB";
    public static final String FRAME_ID_V3_SET = "TPOS";
    public static final String FRAME_ID_V3_SYNC_LYRIC = "SYLT";
    public static final String FRAME_ID_V3_SYNC_TEMPO = "SYTC";
    public static final String FRAME_ID_V3_TDAT = "TDAT";
    public static final String FRAME_ID_V3_TERMS_OF_USE = "USER";
    public static final String FRAME_ID_V3_TIME = "TIME";
    public static final String FRAME_ID_V3_TITLE = "TIT2";
    public static final String FRAME_ID_V3_TITLE_REFINEMENT = "TIT3";
    public static final String FRAME_ID_V3_TORY = "TORY";
    public static final String FRAME_ID_V3_TRACK = "TRCK";
    public static final String FRAME_ID_V3_TRDA = "TRDA";
    public static final String FRAME_ID_V3_TSIZ = "TSIZ";
    public static final String FRAME_ID_V3_TYER = "TYER";
    public static final String FRAME_ID_V3_UNIQUE_FILE_ID = "UFID";
    public static final String FRAME_ID_V3_UNSYNC_LYRICS = "USLT";
    public static final String FRAME_ID_V3_URL_ARTIST_WEB = "WOAR";
    public static final String FRAME_ID_V3_URL_COMMERCIAL = "WCOM";
    public static final String FRAME_ID_V3_URL_COPYRIGHT = "WCOP";
    public static final String FRAME_ID_V3_URL_FILE_WEB = "WOAF";
    public static final String FRAME_ID_V3_URL_OFFICIAL_RADIO = "WORS";
    public static final String FRAME_ID_V3_URL_PAYMENT = "WPAY";
    public static final String FRAME_ID_V3_URL_PUBLISHERS = "WPUB";
    public static final String FRAME_ID_V3_URL_SOURCE_WEB = "WOAS";
    public static final String FRAME_ID_V3_USER_DEFINED_INFO = "TXXX";
    public static final String FRAME_ID_V3_USER_DEFINED_URL = "WXXX";

    public static final String FRAME_ID_V3_IS_COMPILATION = "TCMP";
    public static final String FRAME_ID_V3_TITLE_SORT_ORDER_ITUNES = "TSOT";
    public static final String FRAME_ID_V3_ARTIST_SORT_ORDER_ITUNES = "TSOP";
    public static final String FRAME_ID_V3_ALBUM_SORT_ORDER_ITUNES = "TSOA";
    public static final String FRAME_ID_V3_TITLE_SORT_ORDER_MUSICBRAINZ = "XSOT";
    public static final String FRAME_ID_V3_ARTIST_SORT_ORDER_MUSICBRAINZ = "XSOP";
    public static final String FRAME_ID_V3_ALBUM_SORT_ORDER_MUSICBRAINZ = "XSOA";
    public static final String FRAME_ID_V3_ALBUM_ARTIST_SORT_ORDER_ITUNES = "TSO2";
    public static final String FRAME_ID_V3_COMPOSER_SORT_ORDER_ITUNES = "TSOC";
    public static final String FRAME_ID_V3_SET_SUBTITLE = "TSST";

    private static ID3v23Frames id3v23Frames;

    /**
     * Maps from Generic key to ID3 key
     */
    protected EnumMap<FieldKey, ID3v23FieldKey> tagFieldToId3 = new EnumMap<FieldKey, ID3v23FieldKey>(FieldKey.class);


    /**
     * Maps from ID3 key to Generic key
     */
    protected EnumMap<ID3v23FieldKey, FieldKey> id3ToTagField = new EnumMap<ID3v23FieldKey,FieldKey>(ID3v23FieldKey.class);
    
    public static ID3v23Frames getInstanceOf()
    {
        if (id3v23Frames == null)
        {
            id3v23Frames = new ID3v23Frames();
        }
        return id3v23Frames;
    }

    private ID3v23Frames()
    {
        // The defined v23 frames,
        supportedFrames.add(FRAME_ID_V3_ACCOMPANIMENT);
        supportedFrames.add(FRAME_ID_V3_ALBUM);
        supportedFrames.add(FRAME_ID_V3_ARTIST);
        supportedFrames.add(FRAME_ID_V3_ATTACHED_PICTURE);
        supportedFrames.add(FRAME_ID_V3_AUDIO_ENCRYPTION);
        supportedFrames.add(FRAME_ID_V3_BPM);
        supportedFrames.add(FRAME_ID_V3_COMMENT);
        supportedFrames.add(FRAME_ID_V3_COMMERCIAL_FRAME);
        supportedFrames.add(FRAME_ID_V3_COMPOSER);
        supportedFrames.add(FRAME_ID_V3_CONDUCTOR);
        supportedFrames.add(FRAME_ID_V3_CONTENT_GROUP_DESC);
        supportedFrames.add(FRAME_ID_V3_COPYRIGHTINFO);
        supportedFrames.add(FRAME_ID_V3_ENCODEDBY);
        supportedFrames.add(FRAME_ID_V3_ENCRYPTION);
        supportedFrames.add(FRAME_ID_V3_EQUALISATION);
        supportedFrames.add(FRAME_ID_V3_EVENT_TIMING_CODES);
        supportedFrames.add(FRAME_ID_V3_FILE_OWNER);
        supportedFrames.add(FRAME_ID_V3_FILE_TYPE);
        supportedFrames.add(FRAME_ID_V3_GENERAL_ENCAPS_OBJECT);
        supportedFrames.add(FRAME_ID_V3_GENRE);
        supportedFrames.add(FRAME_ID_V3_GROUP_ID_REG);
        supportedFrames.add(FRAME_ID_V3_HW_SW_SETTINGS);
        supportedFrames.add(FRAME_ID_V3_INITIAL_KEY);
        supportedFrames.add(FRAME_ID_V3_INVOLVED_PEOPLE);
        supportedFrames.add(FRAME_ID_V3_ISRC);
        supportedFrames.add(FRAME_ID_V3_ITUNES_GROUPING);
        supportedFrames.add(FRAME_ID_V3_LANGUAGE);
        supportedFrames.add(FRAME_ID_V3_LENGTH);
        supportedFrames.add(FRAME_ID_V3_LINKED_INFO);
        supportedFrames.add(FRAME_ID_V3_LYRICIST);
        supportedFrames.add(FRAME_ID_V3_MEDIA_TYPE);
        supportedFrames.add(FRAME_ID_V3_MPEG_LOCATION_LOOKUP_TABLE);
        supportedFrames.add(FRAME_ID_V3_MOVEMENT);
        supportedFrames.add(FRAME_ID_V3_MOVEMENT_NO);
        supportedFrames.add(FRAME_ID_V3_MUSIC_CD_ID);
        supportedFrames.add(FRAME_ID_V3_ORIGARTIST);
        supportedFrames.add(FRAME_ID_V3_ORIG_FILENAME);
        supportedFrames.add(FRAME_ID_V3_ORIG_LYRICIST);
        supportedFrames.add(FRAME_ID_V3_ORIG_TITLE);
        supportedFrames.add(FRAME_ID_V3_OWNERSHIP);
        supportedFrames.add(FRAME_ID_V3_PLAYLIST_DELAY);
        supportedFrames.add(FRAME_ID_V3_PLAY_COUNTER);
        supportedFrames.add(FRAME_ID_V3_POPULARIMETER);
        supportedFrames.add(FRAME_ID_V3_POSITION_SYNC);
        supportedFrames.add(FRAME_ID_V3_PRIVATE);
        supportedFrames.add(FRAME_ID_V3_PUBLISHER);
        supportedFrames.add(FRAME_ID_V3_RADIO_NAME);
        supportedFrames.add(FRAME_ID_V3_RADIO_OWNER);
        supportedFrames.add(FRAME_ID_V3_RECOMMENDED_BUFFER_SIZE);
        supportedFrames.add(FRAME_ID_V3_RELATIVE_VOLUME_ADJUSTMENT);
        supportedFrames.add(FRAME_ID_V3_REMIXED);
        supportedFrames.add(FRAME_ID_V3_REVERB);
        supportedFrames.add(FRAME_ID_V3_SET);
        supportedFrames.add(FRAME_ID_V3_SET_SUBTITLE);
        supportedFrames.add(FRAME_ID_V3_SYNC_LYRIC);
        supportedFrames.add(FRAME_ID_V3_SYNC_TEMPO);
        supportedFrames.add(FRAME_ID_V3_TDAT);
        supportedFrames.add(FRAME_ID_V3_TERMS_OF_USE);
        supportedFrames.add(FRAME_ID_V3_TIME);
        supportedFrames.add(FRAME_ID_V3_TITLE);
        supportedFrames.add(FRAME_ID_V3_TITLE_REFINEMENT);
        supportedFrames.add(FRAME_ID_V3_TORY);
        supportedFrames.add(FRAME_ID_V3_TRACK);
        supportedFrames.add(FRAME_ID_V3_TRDA);
        supportedFrames.add(FRAME_ID_V3_TSIZ);
        supportedFrames.add(FRAME_ID_V3_TYER);
        supportedFrames.add(FRAME_ID_V3_UNIQUE_FILE_ID);
        supportedFrames.add(FRAME_ID_V3_UNSYNC_LYRICS);
        supportedFrames.add(FRAME_ID_V3_URL_ARTIST_WEB);
        supportedFrames.add(FRAME_ID_V3_URL_COMMERCIAL);
        supportedFrames.add(FRAME_ID_V3_URL_COPYRIGHT);
        supportedFrames.add(FRAME_ID_V3_URL_FILE_WEB);
        supportedFrames.add(FRAME_ID_V3_URL_OFFICIAL_RADIO);
        supportedFrames.add(FRAME_ID_V3_URL_PAYMENT);
        supportedFrames.add(FRAME_ID_V3_URL_PUBLISHERS);
        supportedFrames.add(FRAME_ID_V3_URL_SOURCE_WEB);
        supportedFrames.add(FRAME_ID_V3_USER_DEFINED_INFO);
        supportedFrames.add(FRAME_ID_V3_USER_DEFINED_URL);

        //Extension
        extensionFrames.add(FRAME_ID_V3_IS_COMPILATION);
        extensionFrames.add(FRAME_ID_V3_TITLE_SORT_ORDER_ITUNES);
        extensionFrames.add(FRAME_ID_V3_ARTIST_SORT_ORDER_ITUNES);
        extensionFrames.add(FRAME_ID_V3_ALBUM_SORT_ORDER_ITUNES);
        extensionFrames.add(FRAME_ID_V3_TITLE_SORT_ORDER_MUSICBRAINZ);
        extensionFrames.add(FRAME_ID_V3_ARTIST_SORT_ORDER_MUSICBRAINZ);
        extensionFrames.add(FRAME_ID_V3_ALBUM_SORT_ORDER_MUSICBRAINZ);
        extensionFrames.add(FRAME_ID_V3_ALBUM_ARTIST_SORT_ORDER_ITUNES);
        extensionFrames.add(FRAME_ID_V3_COMPOSER_SORT_ORDER_ITUNES);

        //Common
        commonFrames.add(FRAME_ID_V3_ARTIST);
        commonFrames.add(FRAME_ID_V3_ALBUM);
        commonFrames.add(FRAME_ID_V3_TITLE);
        commonFrames.add(FRAME_ID_V3_GENRE);
        commonFrames.add(FRAME_ID_V3_TRACK);
        commonFrames.add(FRAME_ID_V3_TYER);
        commonFrames.add(FRAME_ID_V3_COMMENT);

        //Binary
        binaryFrames.add(FRAME_ID_V3_ATTACHED_PICTURE);
        binaryFrames.add(FRAME_ID_V3_AUDIO_ENCRYPTION);
        binaryFrames.add(FRAME_ID_V3_ENCRYPTION);
        binaryFrames.add(FRAME_ID_V3_EQUALISATION);
        binaryFrames.add(FRAME_ID_V3_EVENT_TIMING_CODES);
        binaryFrames.add(FRAME_ID_V3_GENERAL_ENCAPS_OBJECT);
        binaryFrames.add(FRAME_ID_V3_RELATIVE_VOLUME_ADJUSTMENT);
        binaryFrames.add(FRAME_ID_V3_RECOMMENDED_BUFFER_SIZE);
        binaryFrames.add(FRAME_ID_V3_UNIQUE_FILE_ID);

        // Map frameid to a name
        idToValue.put(FRAME_ID_V3_ACCOMPANIMENT, "Text: Band/Orchestra/Accompaniment");
        idToValue.put(FRAME_ID_V3_ALBUM, "Text: Album/Movie/Show title");
        idToValue.put(FRAME_ID_V3_ARTIST, "Text: Lead artist(s)/Lead performer(s)/Soloist(s)/Performing group");
        idToValue.put(FRAME_ID_V3_ATTACHED_PICTURE, "Attached picture");
        idToValue.put(FRAME_ID_V3_AUDIO_ENCRYPTION, "Audio encryption");
        idToValue.put(FRAME_ID_V3_BPM, "Text: BPM (Beats Per Minute)");
        idToValue.put(FRAME_ID_V3_COMMENT, "Comments");
        idToValue.put(FRAME_ID_V3_COMMERCIAL_FRAME, "");
        idToValue.put(FRAME_ID_V3_COMPOSER, "Text: Composer");
        idToValue.put(FRAME_ID_V3_CONDUCTOR, "Text: Conductor/Performer refinement");
        idToValue.put(FRAME_ID_V3_CONTENT_GROUP_DESC, "Text: Content group description");
        idToValue.put(FRAME_ID_V3_COPYRIGHTINFO, "Text: Copyright message");
        idToValue.put(FRAME_ID_V3_ENCODEDBY, "Text: Encoded by");
        idToValue.put(FRAME_ID_V3_ENCRYPTION, "Encryption method registration");
        idToValue.put(FRAME_ID_V3_EQUALISATION, "Equalization");
        idToValue.put(FRAME_ID_V3_EVENT_TIMING_CODES, "Event timing codes");
        idToValue.put(FRAME_ID_V3_FILE_OWNER, "");
        idToValue.put(FRAME_ID_V3_FILE_TYPE, "Text: File type");
        idToValue.put(FRAME_ID_V3_GENERAL_ENCAPS_OBJECT, "General encapsulated datatype");
        idToValue.put(FRAME_ID_V3_GENRE, "Text: Content type");
        idToValue.put(FRAME_ID_V3_GROUP_ID_REG, "");
        idToValue.put(FRAME_ID_V3_HW_SW_SETTINGS, "Text: Software/hardware and settings used for encoding");
        idToValue.put(FRAME_ID_V3_INITIAL_KEY, "Text: Initial key");
        idToValue.put(FRAME_ID_V3_INVOLVED_PEOPLE, "Involved people list");
        idToValue.put(FRAME_ID_V3_ISRC, "Text: ISRC (International Standard Recording Code)");
        idToValue.put(FRAME_ID_V3_ITUNES_GROUPING, "Text: iTunes Grouping");
        idToValue.put(FRAME_ID_V3_LANGUAGE, "Text: Language(s)");
        idToValue.put(FRAME_ID_V3_LENGTH, "Text: Length");
        idToValue.put(FRAME_ID_V3_LINKED_INFO, "Linked information");
        idToValue.put(FRAME_ID_V3_LYRICIST, "Text: Lyricist/text writer");
        idToValue.put(FRAME_ID_V3_MEDIA_TYPE, "Text: Media type");
        idToValue.put(FRAME_ID_V3_MOVEMENT, "Text: Movement");
        idToValue.put(FRAME_ID_V3_MOVEMENT_NO, "Text: Movement No");
        idToValue.put(FRAME_ID_V3_MPEG_LOCATION_LOOKUP_TABLE, "MPEG location lookup table");
        idToValue.put(FRAME_ID_V3_MUSIC_CD_ID, "Music CD Identifier");
        idToValue.put(FRAME_ID_V3_ORIGARTIST, "Text: Original artist(s)/performer(s)");
        idToValue.put(FRAME_ID_V3_ORIG_FILENAME, "Text: Original filename");
        idToValue.put(FRAME_ID_V3_ORIG_LYRICIST, "Text: Original Lyricist(s)/text writer(s)");
        idToValue.put(FRAME_ID_V3_ORIG_TITLE, "Text: Original album/Movie/Show title");
        idToValue.put(FRAME_ID_V3_OWNERSHIP, "");
        idToValue.put(FRAME_ID_V3_PLAYLIST_DELAY, "Text: Playlist delay");
        idToValue.put(FRAME_ID_V3_PLAY_COUNTER, "Play counter");
        idToValue.put(FRAME_ID_V3_POPULARIMETER, "Popularimeter");
        idToValue.put(FRAME_ID_V3_POSITION_SYNC, "Position Sync");
        idToValue.put(FRAME_ID_V3_PRIVATE, "Private frame");
        idToValue.put(FRAME_ID_V3_PUBLISHER, "Text: Publisher");
        idToValue.put(FRAME_ID_V3_RADIO_NAME, "");
        idToValue.put(FRAME_ID_V3_RADIO_OWNER, "");
        idToValue.put(FRAME_ID_V3_RECOMMENDED_BUFFER_SIZE, "Recommended buffer size");
        idToValue.put(FRAME_ID_V3_RELATIVE_VOLUME_ADJUSTMENT, "Relative volume adjustment");
        idToValue.put(FRAME_ID_V3_REMIXED, "Text: Interpreted, remixed, or otherwise modified by");
        idToValue.put(FRAME_ID_V3_REVERB, "Reverb");
        idToValue.put(FRAME_ID_V3_SET, "Text: Part of a setField");
        idToValue.put(FRAME_ID_V3_SET_SUBTITLE, "Text: SubTitle");
        idToValue.put(FRAME_ID_V3_SYNC_LYRIC, "Synchronized lyric/text");
        idToValue.put(FRAME_ID_V3_SYNC_TEMPO, "Synced tempo codes");
        idToValue.put(FRAME_ID_V3_TDAT, "Text: Date");
        idToValue.put(FRAME_ID_V3_TERMS_OF_USE, "");
        idToValue.put(FRAME_ID_V3_TIME, "Text: Time");
        idToValue.put(FRAME_ID_V3_TITLE, "Text: Title/Songname/Content description");
        idToValue.put(FRAME_ID_V3_TITLE_REFINEMENT, "Text: Subtitle/Description refinement");
        idToValue.put(FRAME_ID_V3_TORY, "Text: Original release year");
        idToValue.put(FRAME_ID_V3_TRACK, "Text: Track number/Position in setField");
        idToValue.put(FRAME_ID_V3_TRDA, "Text: Recording dates");
        idToValue.put(FRAME_ID_V3_TSIZ, "Text: Size");
        idToValue.put(FRAME_ID_V3_TYER, "Text: Year");
        idToValue.put(FRAME_ID_V3_UNIQUE_FILE_ID, "Unique file identifier");
        idToValue.put(FRAME_ID_V3_UNSYNC_LYRICS, "Unsychronized lyric/text transcription");
        idToValue.put(FRAME_ID_V3_URL_ARTIST_WEB, "URL: Official artist/performer webpage");
        idToValue.put(FRAME_ID_V3_URL_COMMERCIAL, "URL: Commercial information");
        idToValue.put(FRAME_ID_V3_URL_COPYRIGHT, "URL: Copyright/Legal information");
        idToValue.put(FRAME_ID_V3_URL_FILE_WEB, "URL: Official audio file webpage");
        idToValue.put(FRAME_ID_V3_URL_OFFICIAL_RADIO, "Official Radio");
        idToValue.put(FRAME_ID_V3_URL_PAYMENT, "URL: Payment");
        idToValue.put(FRAME_ID_V3_URL_PUBLISHERS, "URL: Publishers official webpage");
        idToValue.put(FRAME_ID_V3_URL_SOURCE_WEB, "URL: Official audio source webpage");
        idToValue.put(FRAME_ID_V3_USER_DEFINED_INFO, "User defined text information frame");
        idToValue.put(FRAME_ID_V3_USER_DEFINED_URL, "User defined URL link frame");
        idToValue.put(FRAME_ID_V3_IS_COMPILATION, "Is Compilation");
        idToValue.put(FRAME_ID_V3_TITLE_SORT_ORDER_ITUNES, "Text: title sort order");
        idToValue.put(FRAME_ID_V3_ARTIST_SORT_ORDER_ITUNES, "Text: artist sort order");
        idToValue.put(FRAME_ID_V3_ALBUM_SORT_ORDER_ITUNES, "Text: album sort order");
        idToValue.put(FRAME_ID_V3_TITLE_SORT_ORDER_MUSICBRAINZ, "Text: title sort order");
        idToValue.put(FRAME_ID_V3_ARTIST_SORT_ORDER_MUSICBRAINZ, "Text: artist sort order");
        idToValue.put(FRAME_ID_V3_ALBUM_SORT_ORDER_MUSICBRAINZ, "Text: album sort order");
        idToValue.put(FRAME_ID_V3_ALBUM_ARTIST_SORT_ORDER_ITUNES, "Text:Album Artist Sort Order Frame");
        idToValue.put(FRAME_ID_V3_COMPOSER_SORT_ORDER_ITUNES, "Text:Composer Sort Order Frame");

        createMaps();

        multipleFrames.add(FRAME_ID_V3_USER_DEFINED_INFO);
        multipleFrames.add(FRAME_ID_V3_USER_DEFINED_URL);
        multipleFrames.add(FRAME_ID_V3_ATTACHED_PICTURE);
        multipleFrames.add(FRAME_ID_V3_PRIVATE);
        multipleFrames.add(FRAME_ID_V3_COMMENT);
        multipleFrames.add(FRAME_ID_V3_UNIQUE_FILE_ID);
        multipleFrames.add(FRAME_ID_V3_UNSYNC_LYRICS);
        multipleFrames.add(FRAME_ID_V3_POPULARIMETER);
        multipleFrames.add(FRAME_ID_V3_GENERAL_ENCAPS_OBJECT);
        multipleFrames.add(FRAME_ID_V3_URL_ARTIST_WEB);

        discardIfFileAlteredFrames.add(FRAME_ID_V3_EVENT_TIMING_CODES);
        discardIfFileAlteredFrames.add(FRAME_ID_V3_EQUALISATION);
        discardIfFileAlteredFrames.add(FRAME_ID_V3_MPEG_LOCATION_LOOKUP_TABLE);
        discardIfFileAlteredFrames.add(FRAME_ID_V3_POSITION_SYNC);
        discardIfFileAlteredFrames.add(FRAME_ID_V3_SYNC_LYRIC);
        discardIfFileAlteredFrames.add(FRAME_ID_V3_SYNC_TEMPO);
        discardIfFileAlteredFrames.add(FRAME_ID_V3_RELATIVE_VOLUME_ADJUSTMENT);
        discardIfFileAlteredFrames.add(FRAME_ID_V3_EVENT_TIMING_CODES);
        discardIfFileAlteredFrames.add(FRAME_ID_V3_ENCODEDBY);
        discardIfFileAlteredFrames.add(FRAME_ID_V3_LENGTH);
        discardIfFileAlteredFrames.add(FRAME_ID_V3_TSIZ);

        //Mapping from generic key
        tagFieldToId3.put(FieldKey.ACOUSTID_FINGERPRINT, ID3v23FieldKey.ACOUSTID_FINGERPRINT);
        tagFieldToId3.put(FieldKey.ACOUSTID_ID, ID3v23FieldKey.ACOUSTID_ID);
        tagFieldToId3.put(FieldKey.ALBUM, ID3v23FieldKey.ALBUM);
        tagFieldToId3.put(FieldKey.ALBUM_ARTIST, ID3v23FieldKey.ALBUM_ARTIST);
        tagFieldToId3.put(FieldKey.ALBUM_ARTIST_SORT, ID3v23FieldKey.ALBUM_ARTIST_SORT);
        tagFieldToId3.put(FieldKey.ALBUM_ARTISTS, ID3v23FieldKey.ALBUM_ARTISTS);
        tagFieldToId3.put(FieldKey.ALBUM_ARTISTS_SORT, ID3v23FieldKey.ALBUM_ARTISTS_SORT);
        tagFieldToId3.put(FieldKey.ALBUM_SORT, ID3v23FieldKey.ALBUM_SORT);
        tagFieldToId3.put(FieldKey.AMAZON_ID, ID3v23FieldKey.AMAZON_ID);
        tagFieldToId3.put(FieldKey.ARRANGER, ID3v23FieldKey.ARRANGER);
        tagFieldToId3.put(FieldKey.ARRANGER_SORT, ID3v23FieldKey.ARRANGER_SORT);
        tagFieldToId3.put(FieldKey.ARTIST, ID3v23FieldKey.ARTIST);
        tagFieldToId3.put(FieldKey.ARTISTS, ID3v23FieldKey.ARTISTS);
        tagFieldToId3.put(FieldKey.ARTISTS_SORT, ID3v23FieldKey.ARTISTS_SORT);
        tagFieldToId3.put(FieldKey.ARTIST_SORT, ID3v23FieldKey.ARTIST_SORT);
        tagFieldToId3.put(FieldKey.BARCODE, ID3v23FieldKey.BARCODE);
        tagFieldToId3.put(FieldKey.BPM, ID3v23FieldKey.BPM);
        tagFieldToId3.put(FieldKey.CATALOG_NO, ID3v23FieldKey.CATALOG_NO);
        tagFieldToId3.put(FieldKey.CHOIR, ID3v23FieldKey.CHOIR);
        tagFieldToId3.put(FieldKey.CHOIR_SORT, ID3v23FieldKey.CHOIR_SORT);
        tagFieldToId3.put(FieldKey.CLASSICAL_CATALOG, ID3v23FieldKey.CLASSICAL_CATALOG);
        tagFieldToId3.put(FieldKey.CLASSICAL_NICKNAME, ID3v23FieldKey.CLASSICAL_NICKNAME);
        tagFieldToId3.put(FieldKey.COMMENT, ID3v23FieldKey.COMMENT);
        tagFieldToId3.put(FieldKey.COMPOSER, ID3v23FieldKey.COMPOSER);
        tagFieldToId3.put(FieldKey.COMPOSER_SORT, ID3v23FieldKey.COMPOSER_SORT);
        tagFieldToId3.put(FieldKey.CONDUCTOR, ID3v23FieldKey.CONDUCTOR);
        tagFieldToId3.put(FieldKey.CONDUCTOR_SORT, ID3v23FieldKey.CONDUCTOR_SORT);
        tagFieldToId3.put(FieldKey.COPYRIGHT, ID3v23FieldKey.COPYRIGHT);
        tagFieldToId3.put(FieldKey.COUNTRY, ID3v23FieldKey.COUNTRY);
        tagFieldToId3.put(FieldKey.COVER_ART, ID3v23FieldKey.COVER_ART);
        tagFieldToId3.put(FieldKey.CUSTOM1, ID3v23FieldKey.CUSTOM1);
        tagFieldToId3.put(FieldKey.CUSTOM2, ID3v23FieldKey.CUSTOM2);
        tagFieldToId3.put(FieldKey.CUSTOM3, ID3v23FieldKey.CUSTOM3);
        tagFieldToId3.put(FieldKey.CUSTOM4, ID3v23FieldKey.CUSTOM4);
        tagFieldToId3.put(FieldKey.CUSTOM5, ID3v23FieldKey.CUSTOM5);
        tagFieldToId3.put(FieldKey.DISC_NO, ID3v23FieldKey.DISC_NO);
        tagFieldToId3.put(FieldKey.DISC_SUBTITLE, ID3v23FieldKey.DISC_SUBTITLE);
        tagFieldToId3.put(FieldKey.DISC_TOTAL, ID3v23FieldKey.DISC_NO);
        tagFieldToId3.put(FieldKey.DJMIXER, ID3v23FieldKey.DJMIXER);
        tagFieldToId3.put(FieldKey.MOOD_ELECTRONIC, ID3v23FieldKey.MOOD_ELECTRONIC);
        tagFieldToId3.put(FieldKey.ENCODER, ID3v23FieldKey.ENCODER);
        tagFieldToId3.put(FieldKey.ENGINEER, ID3v23FieldKey.ENGINEER);
        tagFieldToId3.put(FieldKey.ENSEMBLE, ID3v23FieldKey.ENSEMBLE);
        tagFieldToId3.put(FieldKey.ENSEMBLE_SORT, ID3v23FieldKey.ENSEMBLE_SORT);
        tagFieldToId3.put(FieldKey.FBPM, ID3v23FieldKey.FBPM);
        tagFieldToId3.put(FieldKey.GENRE, ID3v23FieldKey.GENRE);
        tagFieldToId3.put(FieldKey.GROUP, ID3v23FieldKey.GROUP);
        tagFieldToId3.put(FieldKey.GROUPING, ID3v23FieldKey.GROUPING);
        tagFieldToId3.put(FieldKey.INSTRUMENT, ID3v23FieldKey.INSTRUMENT);
        tagFieldToId3.put(FieldKey.INVOLVED_PERSON, ID3v23FieldKey.INVOLVED_PERSON);
        tagFieldToId3.put(FieldKey.ISRC, ID3v23FieldKey.ISRC);
        tagFieldToId3.put(FieldKey.IS_CLASSICAL, ID3v23FieldKey.IS_CLASSICAL);
        tagFieldToId3.put(FieldKey.IS_COMPILATION, ID3v23FieldKey.IS_COMPILATION);
        tagFieldToId3.put(FieldKey.IS_SOUNDTRACK, ID3v23FieldKey.IS_SOUNDTRACK);
        tagFieldToId3.put(FieldKey.ITUNES_GROUPING, ID3v23FieldKey.ITUNES_GROUPING);
        tagFieldToId3.put(FieldKey.KEY, ID3v23FieldKey.KEY);
        tagFieldToId3.put(FieldKey.LANGUAGE, ID3v23FieldKey.LANGUAGE);
        tagFieldToId3.put(FieldKey.LYRICIST, ID3v23FieldKey.LYRICIST);
        tagFieldToId3.put(FieldKey.LYRICS, ID3v23FieldKey.LYRICS);
        tagFieldToId3.put(FieldKey.MEDIA, ID3v23FieldKey.MEDIA);
        tagFieldToId3.put(FieldKey.MIXER, ID3v23FieldKey.MIXER);
        tagFieldToId3.put(FieldKey.MOOD,ID3v23FieldKey.MOOD);
        tagFieldToId3.put(FieldKey.MOOD_ACOUSTIC, ID3v23FieldKey.MOOD_ACOUSTIC);
        tagFieldToId3.put(FieldKey.MOOD_AGGRESSIVE, ID3v23FieldKey.MOOD_AGGRESSIVE);
        tagFieldToId3.put(FieldKey.MOOD_AROUSAL, ID3v23FieldKey.MOOD_AROUSAL);
        tagFieldToId3.put(FieldKey.MOOD_DANCEABILITY, ID3v23FieldKey.MOOD_DANCEABILITY);
        tagFieldToId3.put(FieldKey.MOOD_HAPPY, ID3v23FieldKey.MOOD_HAPPY);
        tagFieldToId3.put(FieldKey.MOOD_INSTRUMENTAL, ID3v23FieldKey.MOOD_INSTRUMENTAL);
        tagFieldToId3.put(FieldKey.MOOD_PARTY, ID3v23FieldKey.MOOD_PARTY);
        tagFieldToId3.put(FieldKey.MOOD_RELAXED, ID3v23FieldKey.MOOD_RELAXED);
        tagFieldToId3.put(FieldKey.MOOD_SAD, ID3v23FieldKey.MOOD_SAD);
        tagFieldToId3.put(FieldKey.MOOD_VALENCE, ID3v23FieldKey.MOOD_VALENCE);
        tagFieldToId3.put(FieldKey.MOVEMENT, ID3v23FieldKey.MOVEMENT);
        tagFieldToId3.put(FieldKey.MOVEMENT_NO, ID3v23FieldKey.MOVEMENT_NO);
        tagFieldToId3.put(FieldKey.MOVEMENT_TOTAL, ID3v23FieldKey.MOVEMENT_TOTAL);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_ARTISTID, ID3v23FieldKey.MUSICBRAINZ_ARTISTID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_DISC_ID, ID3v23FieldKey.MUSICBRAINZ_DISC_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_ORIGINAL_RELEASE_ID, ID3v23FieldKey.MUSICBRAINZ_ORIGINAL_RELEASEID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASEARTISTID, ID3v23FieldKey.MUSICBRAINZ_RELEASEARTISTID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASEID, ID3v23FieldKey.MUSICBRAINZ_RELEASEID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASE_COUNTRY, ID3v23FieldKey.MUSICBRAINZ_RELEASE_COUNTRY);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASE_GROUP_ID, ID3v23FieldKey.MUSICBRAINZ_RELEASE_GROUP_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASE_STATUS, ID3v23FieldKey.MUSICBRAINZ_RELEASE_STATUS);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASE_TRACK_ID, ID3v23FieldKey.MUSICBRAINZ_RELEASE_TRACK_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_RELEASE_TYPE, ID3v23FieldKey.MUSICBRAINZ_RELEASE_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_TRACK_ID, ID3v23FieldKey.MUSICBRAINZ_TRACK_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK, ID3v23FieldKey.MUSICBRAINZ_WORK);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_ID, ID3v23FieldKey.MUSICBRAINZ_WORK_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_COMPOSITION_ID, ID3v23FieldKey.MUSICBRAINZ_WORK_COMPOSITION_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_ID, ID3v23FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_ID, ID3v23FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_ID, ID3v23FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_ID, ID3v23FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_ID, ID3v23FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_ID);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_ID, ID3v23FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_ID);
        tagFieldToId3.put(FieldKey.MUSICIP_ID, ID3v23FieldKey.MUSICIP_ID);
        tagFieldToId3.put(FieldKey.OCCASION, ID3v23FieldKey.OCCASION);
        tagFieldToId3.put(FieldKey.OPUS, ID3v23FieldKey.OPUS);
        tagFieldToId3.put(FieldKey.ORCHESTRA, ID3v23FieldKey.ORCHESTRA);
        tagFieldToId3.put(FieldKey.ORCHESTRA_SORT, ID3v23FieldKey.ORCHESTRA_SORT);
        tagFieldToId3.put(FieldKey.ORIGINAL_ALBUM, ID3v23FieldKey.ORIGINAL_ALBUM);
        tagFieldToId3.put(FieldKey.ORIGINAL_ARTIST, ID3v23FieldKey.ORIGINAL_ARTIST);
        tagFieldToId3.put(FieldKey.ORIGINAL_LYRICIST, ID3v23FieldKey.ORIGINAL_LYRICIST);
        tagFieldToId3.put(FieldKey.ORIGINAL_YEAR, ID3v23FieldKey.ORIGINAL_YEAR);
        tagFieldToId3.put(FieldKey.PART, ID3v23FieldKey.PART);
        tagFieldToId3.put(FieldKey.PART_NUMBER, ID3v23FieldKey.PART_NUMBER);
        tagFieldToId3.put(FieldKey.PART_TYPE, ID3v23FieldKey.PART_TYPE);
        tagFieldToId3.put(FieldKey.PERFORMER, ID3v23FieldKey.PERFORMER);
        tagFieldToId3.put(FieldKey.PERFORMER_NAME, ID3v23FieldKey.PERFORMER_NAME);
        tagFieldToId3.put(FieldKey.PERFORMER_NAME_SORT, ID3v23FieldKey.PERFORMER_NAME_SORT);

        tagFieldToId3.put(FieldKey.PERIOD, ID3v23FieldKey.PERIOD);
        tagFieldToId3.put(FieldKey.PRODUCER, ID3v23FieldKey.PRODUCER);
        tagFieldToId3.put(FieldKey.QUALITY, ID3v23FieldKey.QUALITY);
        tagFieldToId3.put(FieldKey.RANKING, ID3v23FieldKey.RANKING);
        tagFieldToId3.put(FieldKey.RATING, ID3v23FieldKey.RATING);
        tagFieldToId3.put(FieldKey.RECORD_LABEL, ID3v23FieldKey.RECORD_LABEL);
        tagFieldToId3.put(FieldKey.REMIXER, ID3v23FieldKey.REMIXER);
        tagFieldToId3.put(FieldKey.SCRIPT, ID3v23FieldKey.SCRIPT);
        tagFieldToId3.put(FieldKey.SINGLE_DISC_TRACK_NO, ID3v23FieldKey.SINGLE_DISC_TRACK_NO);
        tagFieldToId3.put(FieldKey.SUBTITLE, ID3v23FieldKey.SUBTITLE);
        tagFieldToId3.put(FieldKey.TAGS, ID3v23FieldKey.TAGS);
        tagFieldToId3.put(FieldKey.TEMPO, ID3v23FieldKey.TEMPO);
        tagFieldToId3.put(FieldKey.TIMBRE, ID3v23FieldKey.TIMBRE);
        tagFieldToId3.put(FieldKey.TITLE, ID3v23FieldKey.TITLE);
        tagFieldToId3.put(FieldKey.TITLE_MOVEMENT, ID3v23FieldKey.TITLE_MOVEMENT);
        tagFieldToId3.put(FieldKey.TITLE_SORT, ID3v23FieldKey.TITLE_SORT);
        tagFieldToId3.put(FieldKey.TONALITY, ID3v23FieldKey.TONALITY);
        tagFieldToId3.put(FieldKey.TRACK, ID3v23FieldKey.TRACK);
        tagFieldToId3.put(FieldKey.TRACK_TOTAL, ID3v23FieldKey.TRACK_TOTAL);
        tagFieldToId3.put(FieldKey.URL_DISCOGS_ARTIST_SITE, ID3v23FieldKey.URL_DISCOGS_ARTIST_SITE);
        tagFieldToId3.put(FieldKey.URL_DISCOGS_RELEASE_SITE, ID3v23FieldKey.URL_DISCOGS_RELEASE_SITE);
        tagFieldToId3.put(FieldKey.URL_LYRICS_SITE, ID3v23FieldKey.URL_LYRICS_SITE);
        tagFieldToId3.put(FieldKey.URL_OFFICIAL_ARTIST_SITE, ID3v23FieldKey.URL_OFFICIAL_ARTIST_SITE);
        tagFieldToId3.put(FieldKey.URL_OFFICIAL_RELEASE_SITE, ID3v23FieldKey.URL_OFFICIAL_RELEASE_SITE);
        tagFieldToId3.put(FieldKey.URL_WIKIPEDIA_ARTIST_SITE, ID3v23FieldKey.URL_WIKIPEDIA_ARTIST_SITE);
        tagFieldToId3.put(FieldKey.URL_WIKIPEDIA_RELEASE_SITE, ID3v23FieldKey.URL_WIKIPEDIA_RELEASE_SITE);
        tagFieldToId3.put(FieldKey.WORK, ID3v23FieldKey.WORK);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_COMPOSITION, ID3v23FieldKey.MUSICBRAINZ_WORK_COMPOSITION);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1, ID3v23FieldKey.WORK_PART_LEVEL1);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL1_TYPE, ID3v23FieldKey.WORK_PART_LEVEL1_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2, ID3v23FieldKey.WORK_PART_LEVEL2);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL2_TYPE, ID3v23FieldKey.WORK_PART_LEVEL2_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3, ID3v23FieldKey.WORK_PART_LEVEL3);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL3_TYPE, ID3v23FieldKey.WORK_PART_LEVEL3_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4, ID3v23FieldKey.WORK_PART_LEVEL4);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL4_TYPE, ID3v23FieldKey.WORK_PART_LEVEL4_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5, ID3v23FieldKey.WORK_PART_LEVEL5);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL5_TYPE, ID3v23FieldKey.WORK_PART_LEVEL5_TYPE);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6, ID3v23FieldKey.WORK_PART_LEVEL6);
        tagFieldToId3.put(FieldKey.MUSICBRAINZ_WORK_PART_LEVEL6_TYPE, ID3v23FieldKey.WORK_PART_LEVEL6_TYPE);
        tagFieldToId3.put(FieldKey.WORK_TYPE, ID3v23FieldKey.WORK_TYPE);
        tagFieldToId3.put(FieldKey.YEAR, ID3v23FieldKey.YEAR);

        for(Map.Entry<FieldKey,ID3v23FieldKey> next:tagFieldToId3.entrySet())
        {
            id3ToTagField.put(next.getValue(), next.getKey());
        }
    }


    /**
     * @param genericKey
     * @return id3 key for generic key
     */
    public ID3v23FieldKey getId3KeyFromGenericKey(FieldKey genericKey)
    {
        return tagFieldToId3.get(genericKey);
    }

    /**
     * Get generic key for ID3 field key
     * @param fieldKey
     * @return
     */
    public FieldKey getGenericKeyFromId3(ID3v23FieldKey fieldKey)
    {
        return id3ToTagField.get(fieldKey);
    }
}
