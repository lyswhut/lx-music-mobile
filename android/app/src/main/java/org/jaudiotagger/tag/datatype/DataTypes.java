/**
 *  @author : Paul Taylor
 *  @author : Eric Farng
 *
 *  Version @version:$Id$
 *
 *  MusicTag Copyright (C)2003,2004
 *
 *  This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 *  General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 *  or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 *  the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *  See the GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License along with this library; if not,
 *  you can get a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * Description:
 * Object Types,all types used by the various frame bodies and associated objects are defined here
 * this works better than putting them with their associated bodies because bodies dont all fall
 * the neccessary hierachy, and values are also required in some Objects (which were previously
 * defined seperately).
 *
 * Warning:Values should not be seperated by space as this will break XML display of tag.
 *
 */
package org.jaudiotagger.tag.datatype;


public class DataTypes
{
    /**
     * Represents a text encoding, now only IDv2Frames not Lyrics3 tags use
     * text encoding objects but both use Object Strings and these check
     * for a text encoding. The method below returns a default if one not set.
     */
    public static final String OBJ_TEXT_ENCODING = "TextEncoding";
    //Reference to datatype holding the main textual data
    public static final String OBJ_TEXT = "Text";
    //Reference to datatype holding non textual textual data
    public static final String OBJ_DATA = "Data";
    //Reference to datatype holding a description of the textual data
    public static final String OBJ_DESCRIPTION = "Description";
    //Reference to datatype holding reference to owner of frame.
    public static final String OBJ_OWNER = "Owner";
    //Reference to datatype holding a number
    public static final String OBJ_NUMBER = "Number";
    //Reference to timestamps
    public static final String OBJ_DATETIME = "DateTime";
    /**
     *
     */
    public static final String OBJ_GENRE = "Genre";
    /**
     *
     */
    public static final String OBJ_ID3V2_FRAME_DESCRIPTION = "ID3v2FrameDescription";

    //ETCO Frame
    public static final String OBJ_TYPE_OF_EVENT = "TypeOfEvent";
    public static final String OBJ_TIMED_EVENT = "TimedEvent";
    public static final String OBJ_TIMED_EVENT_LIST = "TimedEventList";
    //SYTC Frame
    public static final String OBJ_SYNCHRONISED_TEMPO_DATA = "SynchronisedTempoData";
    public static final String OBJ_SYNCHRONISED_TEMPO = "SynchronisedTempo";
    public static final String OBJ_SYNCHRONISED_TEMPO_LIST = "SynchronisedTempoList";
    /**
     *
     */
    public static final String OBJ_TIME_STAMP_FORMAT = "TimeStampFormat";
    /**
     *
     */
    public static final String OBJ_TYPE_OF_CHANNEL = "TypeOfChannel";
    /**
     *
     */
    public static final String OBJ_RECIEVED_AS = "RecievedAs";

    //APIC Frame
    public static final String OBJ_PICTURE_TYPE = "PictureType";
    public static final String OBJ_PICTURE_DATA = "PictureData";
    public static final String OBJ_MIME_TYPE = "MIMEType";
    public static final String OBJ_IMAGE_FORMAT = "ImageType";

    //AENC Frame
    public static final String OBJ_PREVIEW_START = "PreviewStart";
    public static final String OBJ_PREVIEW_LENGTH = "PreviewLength";
    public static final String OBJ_ENCRYPTION_INFO = "EncryptionInfo";

    //COMR Frame
    public static final String OBJ_PRICE_STRING = "PriceString";
    public static final String OBJ_VALID_UNTIL = "ValidUntil";
    public static final String OBJ_CONTACT_URL = "ContactURL";
    public static final String OBJ_SELLER_NAME = "SellerName";
    public static final String OBJ_SELLER_LOGO = "SellerLogo";

    //CRM Frame
    public static final String OBJ_ENCRYPTED_DATABLOCK = "EncryptedDataBlock";

    //ENCR Frame
    public static final String OBJ_METHOD_SYMBOL = "MethodSymbol";

    //EQU2 Frame
    public static final String OBJ_FREQUENCY = "Frequency";
    public static final String OBJ_VOLUME_ADJUSTMENT = "Volume Adjustment";
    public static final String OBJ_INTERPOLATION_METHOD = "InterpolationMethod";

    public static final String OBJ_FILENAME = "Filename";

    //GRID Frame
    public static final String OBJ_GROUP_SYMBOL = "GroupSymbol";
    public static final String OBJ_GROUP_DATA = "GroupData";

    //LINK Frame
    public static final String OBJ_URL = "URL";
    public static final String OBJ_ID = "ID";

    //OWNE Frame
    public static final String OBJ_PRICE_PAID = "PricePaid";
    public static final String OBJ_PURCHASE_DATE = "PurchaseDate";

    //POPM Frame
    public static final String OBJ_EMAIL = "Email";
    public static final String OBJ_RATING = "Rating";
    public static final String OBJ_COUNTER = "Counter";

    //POSS Frame
    public static final String OBJ_POSITION = "Position";

    //RBUF Frame
    public static final String OBJ_BUFFER_SIZE = "BufferSize";
    public static final String OBJ_EMBED_FLAG = "EmbedFlag";
    public static final String OBJ_OFFSET = "Offset";

    //RVRB Frame
    public static final String OBJ_REVERB_LEFT = "ReverbLeft";
    public static final String OBJ_REVERB_RIGHT = "ReverbRight";
    public static final String OBJ_REVERB_BOUNCE_LEFT = "ReverbBounceLeft";
    public static final String OBJ_REVERB_BOUNCE_RIGHT = "ReverbBounceRight";
    public static final String OBJ_REVERB_FEEDBACK_LEFT_TO_LEFT = "ReverbFeedbackLeftToLeft";
    public static final String OBJ_REVERB_FEEDBACK_LEFT_TO_RIGHT = "ReverbFeedbackLeftToRight";
    public static final String OBJ_REVERB_FEEDBACK_RIGHT_TO_RIGHT = "ReverbFeedbackRightToRight";
    public static final String OBJ_REVERB_FEEDBACK_RIGHT_TO_LEFT = "ReverbFeedbackRightToLeft";
    public static final String OBJ_PREMIX_LEFT_TO_RIGHT = "PremixLeftToRight";
    public static final String OBJ_PREMIX_RIGHT_TO_LEFT = "PremixRightToLeft";

    //SIGN Frame
    public static final String OBJ_SIGNATURE = "Signature";

    //SYLT Frame
    public static final String OBJ_CONTENT_TYPE = "contentType";

    //ULST Frame
    public static final String OBJ_LANGUAGE = "Language";
    public static final String OBJ_LYRICS = "Lyrics";
    public static final String OBJ_URLLINK = "URLLink";

    //CHAP Frame
    public static final String OBJ_ELEMENT_ID = "ElementID";
    public static final String OBJ_START_TIME = "StartTime";
    public static final String OBJ_END_TIME = "EndTime";
    public static final String OBJ_START_OFFSET = "StartOffset";
    public static final String OBJ_END_OFFSET = "EndOffset";

    //CTOC Frame
}
