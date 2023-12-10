package org.jaudiotagger.tag.datatype;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.tag.InvalidDataTypeException;
import org.jaudiotagger.tag.TagOptionSingleton;
import org.jaudiotagger.tag.id3.AbstractTagFrameBody;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;

import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.*;

/**
 * Represents a String whose size is determined by finding of a null character at the end of the String.
 *
 * The String itself might be of length zero (i.e just consist of the null character). The String will be encoded based
 * upon the text encoding of the frame that it belongs to.
 */
public class TextEncodedStringNullTerminated extends AbstractString
{
    /**
     * Creates a new TextEncodedStringNullTerminated datatype.
     *
     * @param identifier identifies the frame type
     * @param frameBody
     */
    public TextEncodedStringNullTerminated(String identifier, AbstractTagFrameBody frameBody)
    {
        super(identifier, frameBody);
    }

    /**
     * Creates a new TextEncodedStringNullTerminated datatype, with value
     *
     * @param identifier
     * @param frameBody
     * @param value
     */
    public TextEncodedStringNullTerminated(String identifier, AbstractTagFrameBody frameBody, String value)
    {
        super(identifier, frameBody, value);
    }

    public TextEncodedStringNullTerminated(TextEncodedStringNullTerminated object)
    {
        super(object);
    }

    public boolean equals(Object obj)
    {
        return obj instanceof TextEncodedStringNullTerminated && super.equals(obj);
    }

    /**
     * Read a string from buffer upto null character (if exists)
     *
     * Must take into account the text encoding defined in the Encoding Object
     * ID3 Text Frames often allow multiple strings separated by the null char
     * appropriate for the encoding.
     *
     * @param arr    this is the buffer for the frame
     * @param offset this is where to start reading in the buffer for this field
     */
    public void readByteArray(byte[] arr, int offset) throws InvalidDataTypeException
    {
        if(offset>=arr.length)
        {
            throw new InvalidDataTypeException("Unable to find null terminated string");
        }
        int bufferSize;

        logger.finer("Reading from array starting from offset:" + offset);
        int size;

        //Get the Specified Decoder
        final Charset charset = getTextEncodingCharSet();


        //We only want to load up to null terminator, data after this is part of different
        //field and it may not be possible to decode it so do the check before we do
        //do the decoding,encoding dependent.
        ByteBuffer buffer = ByteBuffer.wrap(arr, offset, arr.length - offset);
        int endPosition = 0;

        //Latin-1 and UTF-8 strings are terminated by a single-byte null,
        //while UTF-16 and its variants need two bytes for the null terminator.
        final boolean nullIsOneByte = StandardCharsets.ISO_8859_1 == charset || StandardCharsets.UTF_8 == charset;

        boolean isNullTerminatorFound = false;
        while (buffer.hasRemaining())
        {
            byte nextByte = buffer.get();
            if (nextByte == 0x00)
            {
                if (nullIsOneByte)
                {
                    buffer.mark();
                    buffer.reset();
                    endPosition = buffer.position() - 1;
                    logger.finest("Null terminator found starting at:" + endPosition);

                    isNullTerminatorFound = true;
                    break;
                }
                else
                {
                    // Looking for two-byte null
                    if (buffer.hasRemaining())
                    {
                        nextByte = buffer.get();
                        if (nextByte == 0x00)
                        {
                            buffer.mark();
                            buffer.reset();
                            endPosition = buffer.position() - 2;
                            logger.finest("UTF16:Null terminator found starting  at:" + endPosition);
                            isNullTerminatorFound = true;
                            break;
                        }
                        else
                        {
                            //Nothing to do, we have checked 2nd value of pair it was not a null terminator
                            //so will just start looking again in next invocation of loop
                        }
                    }
                    else
                    {
                        buffer.mark();
                        buffer.reset();
                        endPosition = buffer.position() - 1;
                        logger.warning("UTF16:Should be two null terminator marks but only found one starting at:" + endPosition);

                        isNullTerminatorFound = true;
                        break;
                    }
                }
            }
            else
            {
                //If UTF16, we should only be looking on 2 byte boundaries
                if (!nullIsOneByte)
                {
                    if (buffer.hasRemaining())
                    {
                        buffer.get();
                    }
                }
            }
        }

        if (!isNullTerminatorFound)
        {
            throw new InvalidDataTypeException("Unable to find null terminated string");
        }


        logger.finest("End Position is:" + endPosition + "Offset:" + offset);

        //Set Size so offset is ready for next field (includes the null terminator)
        size = endPosition - offset;
        size++;
        if (!nullIsOneByte)
        {
            size++;
        }
        setSize(size);

        //Decode buffer if runs into problems should throw exception which we
        //catch and then set value to empty string. (We don't read the null terminator
        //because we dont want to display this)
        bufferSize = endPosition - offset;
        logger.finest("Text size is:" + bufferSize);
        if (bufferSize == 0)
        {
            value = "";
        }
        else
        {
            //Decode sliced inBuffer
            ByteBuffer inBuffer = ByteBuffer.wrap(arr, offset, bufferSize).slice();
            CharBuffer outBuffer = CharBuffer.allocate(bufferSize);

            final CharsetDecoder decoder = getCorrectDecoder(inBuffer);
            CoderResult coderResult = decoder.decode(inBuffer, outBuffer, true);
            if (coderResult.isError())
            {
                logger.warning("Problem decoding text encoded null terminated string:" + coderResult.toString());
            }
            decoder.flush(outBuffer);
            outBuffer.flip();
            value = outBuffer.toString();
        }
        //Set Size so offset is ready for next field (includes the null terminator)
        logger.config("Read NullTerminatedString:" + value + " size inc terminator:" + size);
    }

    /**
     * Write String into byte array, adding a null character to the end of the String
     *
     * @return the data as a byte array in format to write to file
     */
    public byte[] writeByteArray()
    {
        logger.config("Writing NullTerminatedString." + value);
        byte[] data;
        //Write to buffer using the CharSet defined by getTextEncodingCharSet()
        //Add a null terminator which will be encoded based on encoding.
        final Charset charset = getTextEncodingCharSet();
        try
        {
            if (StandardCharsets.UTF_16.equals(charset))
            {
                if(TagOptionSingleton.getInstance().isEncodeUTF16BomAsLittleEndian())
                {
                    final CharsetEncoder encoder = StandardCharsets.UTF_16LE.newEncoder();
                    encoder.onMalformedInput(CodingErrorAction.IGNORE);
                    encoder.onUnmappableCharacter(CodingErrorAction.IGNORE);

                    //Note remember LE BOM is ff fe but this is handled by encoder Unicode char is fe ff
                    final ByteBuffer bb = encoder.encode(CharBuffer.wrap('\ufeff' + (String) value + '\0'));
                    data = new byte[bb.limit()];
                    bb.get(data, 0, bb.limit());
                }
                else
                {
                     final CharsetEncoder encoder = StandardCharsets.UTF_16BE.newEncoder();
                     encoder.onMalformedInput(CodingErrorAction.IGNORE);
                     encoder.onUnmappableCharacter(CodingErrorAction.IGNORE);

                     //Note  BE BOM will leave as fe ff
                     final ByteBuffer bb = encoder.encode(CharBuffer.wrap('\ufeff' + (String) value + '\0'));
                     data = new byte[bb.limit()];
                     bb.get(data, 0, bb.limit());
                }
            }
            else
            {
                final CharsetEncoder encoder = charset.newEncoder();
                encoder.onMalformedInput(CodingErrorAction.IGNORE);
                encoder.onUnmappableCharacter(CodingErrorAction.IGNORE);

                final ByteBuffer bb = encoder.encode(CharBuffer.wrap((String) value + '\0'));
                data = new byte[bb.limit()];
                bb.get(data, 0, bb.limit());
            }
        }
        //https://bitbucket.org/ijabz/jaudiotagger/issue/1/encoding-metadata-to-utf-16-can-fail-if
        catch (CharacterCodingException ce)
        {
            logger.severe(ce.getMessage()+":"+charset.name()+":"+value);
            throw new RuntimeException(ce);
        }
        setSize(data.length);
        return data;
    }

    protected Charset getTextEncodingCharSet()
    {
        final byte textEncoding = this.getBody().getTextEncoding();
        final Charset charset = TextEncoding.getInstanceOf().getCharsetForId(textEncoding);
        logger.finest("text encoding:" + textEncoding + " charset:" + charset.name());
        return charset;
    }
}
