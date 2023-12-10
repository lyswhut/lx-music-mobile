package org.jaudiotagger.tag.mp4.field;

import org.jaudiotagger.audio.mp4.atom.Mp4BoxHeader;
import org.jaudiotagger.tag.FieldDataInvalidException;
import org.jaudiotagger.tag.mp4.Mp4FieldKey;
import org.jaudiotagger.tag.mp4.atom.Mp4DataBox;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.util.ArrayList;

/**
 * Represents the Disc No field
 *
 * <p>Contains some reserved fields that we currently ignore
 *
 * Reserved:2 bytes
 * Disc Number:2 bytes
 * Total no of Discs:2 bytes
 *
 */
public class Mp4DiscNoField extends Mp4TagTextNumberField
{
    private static final int NONE_VALUE_INDEX = 0;
    private static final int DISC_NO_INDEX = 1;
    private static final int DISC_TOTAL_INDEX = 2;

    /**
     * Create new Disc Field parsing the String for the discno/total
     *
     * @param discValue
     * @throws org.jaudiotagger.tag.FieldDataInvalidException
     */
    public Mp4DiscNoField(String discValue) throws FieldDataInvalidException
    {
        super(Mp4FieldKey.DISCNUMBER.getFieldName(), discValue);

        numbers = new ArrayList<Short>();
        numbers.add(new Short("0"));

        String values[] = discValue.split("/");
        switch (values.length)
        {
            case 1:

                try
                {
                    numbers.add(Short.parseShort(values[0]));
                }
                catch (NumberFormatException nfe)
                {
                    throw new FieldDataInvalidException("Value of:" + values[0] + " is invalid for field:" + id);
                }
                numbers.add(new Short("0"));
                break;

            case 2:
                try
                {
                    numbers.add(Short.parseShort(values[0]));
                }
                catch (NumberFormatException nfe)
                {
                    throw new FieldDataInvalidException("Value of:" + values[0] + " is invalid for field:" + id);
                }
                try
                {
                    numbers.add(Short.parseShort(values[1]));
                }
                catch (NumberFormatException nfe)
                {
                    throw new FieldDataInvalidException("Value of:" + values[1] + " is invalid for field:" + id);
                }
                break;

            default:
                throw new FieldDataInvalidException("Value is invalid for field:" + id);
        }
    }


    /**
     * Create new Disc No field with only discNo
     *
     * @param discNo
     */
    public Mp4DiscNoField(int discNo)
    {
        super(Mp4FieldKey.DISCNUMBER.getFieldName(), String.valueOf(discNo));
        numbers = new ArrayList<Short>();
        numbers.add(new Short("0"));
        numbers.add((short) discNo);
        numbers.add(new Short("0"));
    }

    /**
     * Create new Disc No Field with Disc No and total number of discs
     *
     * @param discNo
     * @param total
     */
    public Mp4DiscNoField(int discNo, int total)
    {
        super(Mp4FieldKey.DISCNUMBER.getFieldName(), String.valueOf(discNo));
        numbers = new ArrayList<Short>();
        numbers.add(new Short("0"));
        numbers.add((short) discNo);
        numbers.add((short) total);
    }

    public Mp4DiscNoField(String id, ByteBuffer data) throws UnsupportedEncodingException
    {
        super(id, data);
    }

    protected void build(ByteBuffer data) throws UnsupportedEncodingException
    {
        //Data actually contains a 'Data' Box so process data using this
        Mp4BoxHeader header = new Mp4BoxHeader(data);
        Mp4DataBox databox = new Mp4DataBox(header, data);
        dataSize = header.getDataLength();
        numbers = databox.getNumbers();

        //Disc number always hold four values, we can discard the first one and last one, the second one is the disc no
        //and the third is the total no of discs so only use if not zero
        StringBuffer sb = new StringBuffer();
        if ((numbers.size() > DISC_NO_INDEX) && (numbers.get(DISC_NO_INDEX) > 0))
        {
            sb.append(numbers.get(DISC_NO_INDEX));
        }
        if ((numbers.size() > DISC_TOTAL_INDEX) && (numbers.get(DISC_TOTAL_INDEX) > 0))
        {
            sb.append("/").append(numbers.get(DISC_TOTAL_INDEX));
        }
        content = sb.toString();
    }

    /**
     * @return
     */
    public Short getDiscNo()
    {
        return numbers.get(DISC_NO_INDEX);
    }

    /**
     * Set Disc No
     *
     * @param discNo
     */
    public void setDiscNo(int discNo)
    {
        numbers.set(DISC_NO_INDEX, (short) discNo);
    }

    /**
     * @return
     */
    public Short getDiscTotal()
    {
        if(numbers.size()<=DISC_TOTAL_INDEX)
        {
            return 0;
        }
        return numbers.get(DISC_TOTAL_INDEX);
    }

    /**
     * Set total number of discs
     *
     * @param discTotal
     */
    public void setDiscTotal(int discTotal)
    {
        numbers.set(DISC_TOTAL_INDEX, (short) discTotal);
    }
}
