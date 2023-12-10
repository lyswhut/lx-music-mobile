package org.jaudiotagger.tag.id3;

import org.jaudiotagger.tag.TagOptionSingleton;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;

import java.util.logging.Logger;

/**
 * Functions to encode text according to encodingoptions and ID3 version
 */
public class ID3TextEncodingConversion
{
    //Logger
    public static Logger logger = Logger.getLogger("org.jaudiotagger.tag.id3");


    /**
     * Check the text encoding is valid for this header type and is appropriate for
     * user text encoding options.                                             *
     *
     * This is called before writing any frames that use text encoding
     *
     * @param header       used to identify the ID3tagtype
     * @param textEncoding currently set
     * @return valid encoding according to version type and user options
     */
    public static byte  getTextEncoding(AbstractTagFrame header, byte textEncoding)
    {

        //Should not happen, assume v23 and provide a warning
        if (header == null)
        {
            logger.warning("Header has not yet been set for this framebody");

            if (TagOptionSingleton.getInstance().isResetTextEncodingForExistingFrames())
            {
                return TagOptionSingleton.getInstance().getId3v23DefaultTextEncoding();
            }
            else
            {
                return convertV24textEncodingToV23textEncoding(textEncoding);
            }
        }
        else if (header instanceof ID3v24Frame)
        {
            if (TagOptionSingleton.getInstance().isResetTextEncodingForExistingFrames())
            {
                //Replace with default
                return TagOptionSingleton.getInstance().getId3v24DefaultTextEncoding();
            }
            else
            {
                //All text encodings supported nothing to do
                return textEncoding;
            }
        }
        else
        {
            if (TagOptionSingleton.getInstance().isResetTextEncodingForExistingFrames())
            {
                //Replace with default
                return TagOptionSingleton.getInstance().getId3v23DefaultTextEncoding();
            }
            else
            {
                //If text encoding is an unsupported v24 one we use unicode v23 equivalent
                return convertV24textEncodingToV23textEncoding(textEncoding);
            }
        }
    }

    /**
     * Sets the text encoding to best Unicode type for the version
     *
     * @param header
     * @return
     */
    public static byte getUnicodeTextEncoding(AbstractTagFrame header)
    {
        if (header == null)
        {
            logger.warning("Header has not yet been set for this framebody");
            return TextEncoding.UTF_16;
        }
        else if (header instanceof ID3v24Frame)
        {
            return TagOptionSingleton.getInstance().getId3v24UnicodeTextEncoding();
        }
        else
        {
            return TextEncoding.UTF_16;
        }
    }

    /**
     * Convert v24 text encoding to a valid v23 encoding
     *
     * @param textEncoding
     * @return valid encoding
     */
    private static byte convertV24textEncodingToV23textEncoding(byte textEncoding)
    {
        //Convert to equivalent UTF16 format
        if (textEncoding == TextEncoding.UTF_16BE)
        {
            return TextEncoding.UTF_16;
        }
        //UTF-8 is not supported in ID3v23 and UTF-16 Format can be problematic on ID3v23 so change
        //to ISO-8859-1, a check before writing data will check the format is capable of writing the data 
        else if (textEncoding == TextEncoding.UTF_8)
        {
            return TextEncoding.ISO_8859_1;
        }
        else
        {
            return textEncoding;
        }
    }


}
