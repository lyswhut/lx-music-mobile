package org.jaudiotagger.tag.mp4.field;

import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.mp4.atom.Mp4BoxHeader;
import org.jaudiotagger.tag.FieldDataInvalidException;
import org.jaudiotagger.tag.mp4.Mp4FieldKey;
import org.jaudiotagger.tag.mp4.atom.Mp4DataBox;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;

/**
 * Represents a single byte as a number
 *
 * <p>Usually single byte fields are used as a boolean field, but not always so we dont do this conversion
 */
public class Mp4TagByteField extends Mp4TagTextField
{
    public static String TRUE_VALUE="1";  //when using this field to hold a boolean
    public static String FALSE_VALUE="0";
    //Holds the actual size of the data content as held in the databoxitem, this is required when creating new
    //items because we cant accurately work out the size by looking at the content because sometimes field must be longer
    //than is actually required to hold the value
    //e.g byte data length seems to be 1 for pgap and cpil but 2 for tmpo, so we stored the dataSize
    //when we loaded the value so if greater than 1 we pad the value.
    private int realDataLength;

    //Preserved from data from file
    private byte[] bytedata;

    /**
     * Create new field
     *
     * Assume length of 1 which is correct for most but not all byte fields
     *
     * @param id
     * @param value is a String representation of a number
     * @throws org.jaudiotagger.tag.FieldDataInvalidException
     */
    public Mp4TagByteField(Mp4FieldKey id, String value) throws FieldDataInvalidException
    {
        this(id, value, 1);
    }

    /**
     * Create new field with known length
     *
     * @param id
     * @param value is a String representation of a number
     * @param realDataLength
     * @throws org.jaudiotagger.tag.FieldDataInvalidException
     */
    public Mp4TagByteField(Mp4FieldKey id, String value, int realDataLength) throws FieldDataInvalidException
    {
        super(id.getFieldName(), value);
        this.realDataLength = realDataLength;
        //Check that can actually be stored numercially, otherwise will have big problems
        //when try and save the field
        try
        {
            Long.parseLong(value);
        }
        catch (NumberFormatException nfe)
        {
            throw new FieldDataInvalidException("Value of:" + value + " is invalid for field:" + id);
        }
    }

    /**
     * Construct from rawdata from audio file
     *
     * @param id
     * @param raw
     * @throws UnsupportedEncodingException
     */
    public Mp4TagByteField(String id, ByteBuffer raw) throws UnsupportedEncodingException
    {
        super(id, raw);
    }

    public Mp4FieldType getFieldType()
    {
        return Mp4FieldType.INTEGER;
    }

    /**
     * Return raw data bytes
     *
     * TODO this code should be done better so generalised to any length
     *
     * @return
     * @throws UnsupportedEncodingException
     */
    protected byte[] getDataBytes() throws UnsupportedEncodingException
    {

        //Write original data
        if (bytedata != null)
        {
            return bytedata;
        }

        //new field, lets hope the realDataLength is correct
        switch (realDataLength)
        {
            case 2:
            {
                //Save as two bytes
                Short shortValue = new Short(content);
                byte rawData[] = Utils.getSizeBEInt16(shortValue);
                return rawData;
            }
            case 1:
            {
                //Save as 1 bytes
                Short shortValue = new Short(content);
                byte rawData[] = new byte[1];
                rawData[0] = shortValue.byteValue();
                return rawData;
            }
            case 4:
            {
                //Assume could be int
                Integer intValue = new Integer(content);
                byte rawData[] = Utils.getSizeBEInt32(intValue);
                return rawData;
            }
            default:
            {
                //TODO
                throw new RuntimeException(id + ":" + realDataLength + ":" + "Dont know how to write byte fields of this length");
            }
        }

    }

    protected void build(ByteBuffer data) throws UnsupportedEncodingException
    {
        //Data actually contains a 'Data' Box so process data using this
        Mp4BoxHeader header = new Mp4BoxHeader(data);
        Mp4DataBox databox = new Mp4DataBox(header, data);
        dataSize = header.getDataLength();
        //Needed for subsequent write
        realDataLength = dataSize - Mp4DataBox.PRE_DATA_LENGTH;
        bytedata = databox.getByteData();
        content = databox.getContent();

    }
}
