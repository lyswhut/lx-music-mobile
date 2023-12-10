package org.jaudiotagger.tag.datatype;

import org.jaudiotagger.tag.InvalidDataTypeException;
import org.jaudiotagger.tag.id3.AbstractTagFrameBody;
import org.jaudiotagger.utils.EqualsUtil;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;

/**
 * Represents a data type that allow multiple Strings but they should be paired as key values, i.e should be 2,4,6..
 * But keys are not unique so we don't store as a map, so could have same key pointing to two different values
 * such as two ENGINEER keys
 *
 */
public class PairedTextEncodedStringNullTerminated extends AbstractDataType
{
    public PairedTextEncodedStringNullTerminated(String identifier, AbstractTagFrameBody frameBody)
    {
        super(identifier, frameBody);
        value = new ValuePairs();
    }

    public PairedTextEncodedStringNullTerminated(TextEncodedStringSizeTerminated object)
    {
        super(object);
        value = new ValuePairs();
    }

    public PairedTextEncodedStringNullTerminated(PairedTextEncodedStringNullTerminated object)
    {
        super(object);
    }

    public boolean equals(Object obj)
    {
        if (obj == this)
        {
            return true;
        }

        if (!(obj instanceof PairedTextEncodedStringNullTerminated))
        {
            return false;
        }

        PairedTextEncodedStringNullTerminated that = (PairedTextEncodedStringNullTerminated) obj;

        return EqualsUtil.areEqual(value, that.value);
    }

      /**
     * Returns the size in bytes of this dataType when written to file
     *
     * @return size of this dataType
     */
    public int getSize()
    {
        return size;
    }

    /**
     * Check the value can be encoded with the specified encoding
     *
     * @return
     */
    public boolean canBeEncoded()
    {
        for (Pair entry : ((ValuePairs) value).mapping)
        {
            TextEncodedStringNullTerminated next = new TextEncodedStringNullTerminated(identifier, frameBody, entry.getValue());
            if (!next.canBeEncoded())
            {
                return false;
            }
        }
        return true;
    }

    /**
     * Read Null Terminated Strings from the array starting at offset, continue until unable to find any null terminated
     * Strings or until reached the end of the array. The offset should be set to byte after the last null terminated
     * String found.
     *
     * @param arr    to read the Strings from
     * @param offset in the array to start reading from
     * @throws InvalidDataTypeException if unable to find any null terminated Strings
     */
    public void readByteArray(byte[] arr, int offset) throws InvalidDataTypeException
    {
        logger.finer("Reading PairTextEncodedStringNullTerminated from array from offset:" + offset);
        //Continue until unable to read a null terminated String
        while (true)
        {
            try
            {
                //Read Key
                TextEncodedStringNullTerminated key = new TextEncodedStringNullTerminated(identifier, frameBody);
                key.readByteArray(arr, offset);
                size   += key.getSize();
                offset += key.getSize();
                if (key.getSize() == 0)
                {
                    break;
                }

                try
                {
                    //Read Value
                    TextEncodedStringNullTerminated result = new TextEncodedStringNullTerminated(identifier, frameBody);
                    result.readByteArray(arr, offset);
                    size   += result.getSize();
                    offset += result.getSize();
                    if (result.getSize() == 0)
                    {
                        break;
                    }
                    //Add to value
                    ((ValuePairs) value).add((String) key.getValue(),(String) result.getValue());
                }
                catch (InvalidDataTypeException idte)
                {
                    //Value may not be null terminated if it is the last value
                    //Read Value
                    if(offset>=arr.length)
                    {
                        break;
                    }
                    TextEncodedStringSizeTerminated result = new TextEncodedStringSizeTerminated(identifier, frameBody);
                    result.readByteArray(arr, offset);
                    size   += result.getSize();
                    offset += result.getSize();
                    if (result.getSize() == 0)
                    {
                        break;
                    }
                    //Add to value
                    ((ValuePairs) value).add((String) key.getValue(),(String) result.getValue());
                    break;
                }
            }
            catch (InvalidDataTypeException idte)
            {
                break;
            }

            if (size == 0)
            {
                logger.warning("No null terminated Strings found");
                throw new InvalidDataTypeException("No null terminated Strings found");
            }
        }
        logger.finer("Read  PairTextEncodedStringNullTerminated:" + value + " size:" + size);
    }


    /**
     * For every String write to byteBuffer
     *
     * @return byteBuffer that should be written to file to persist this dataType.
     */
    public byte[] writeByteArray()
    {
        logger.finer("Writing PairTextEncodedStringNullTerminated");

        int localSize = 0;
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try
        {
            for (Pair pair : ((ValuePairs) value).mapping)
            {
                {
                    TextEncodedStringNullTerminated next = new TextEncodedStringNullTerminated(identifier, frameBody, pair.getKey());
                    buffer.write(next.writeByteArray());
                    localSize += next.getSize();
                }
                {
                    TextEncodedStringNullTerminated next = new TextEncodedStringNullTerminated(identifier, frameBody, pair.getValue());
                    buffer.write(next.writeByteArray());
                    localSize += next.getSize();
                }
            }
        }
        catch (IOException ioe)
        {
            //This should never happen because the write is internal with the JVM it is not to a file
            logger.log(Level.SEVERE, "IOException in MultipleTextEncodedStringNullTerminated when writing byte array", ioe);
            throw new RuntimeException(ioe);
        }

        //Update size member variable
        size = localSize;

        logger.finer("Written PairTextEncodedStringNullTerminated");
        return buffer.toByteArray();
    }

    public String toString()
    {
        return value.toString();
    }

    /**
     * This holds the values held by this PairedTextEncodedDataType, always held as pairs of values
     */
    public static class ValuePairs
    {
        private List<Pair> mapping = new ArrayList<Pair>();

        public ValuePairs()
        {
            super();
        }

        public void add(Pair pair)
        {
            mapping.add(pair);
        }
        /**
         * Add String Data type to the value list
         *
         * @param value to add to the list
         */
        public void add(String key, String value)
        {
            mapping.add(new Pair(key,value));
        }


        /**
         * Return the list of values
         *
         * @return the list of values
         */
        public List<Pair> getMapping()
        {
            return mapping;
        }

        /**
         * @return no of values
         */
        public int getNumberOfValues()
        {
            return mapping.size();
        }

        /**
         * Return the list of values as a single string separated by a colon,comma
         *
         * @return a string representation of the value
         */
        public String toString()
        {
            StringBuffer sb = new StringBuffer();
            for(Pair next:mapping)
            {
                sb.append(next.getKey()+':'+next.getValue()+',');
            }
            if(sb.length()>0)
            {
                sb.setLength(sb.length() - 1);
            }
            return sb.toString();
        }

        /**
         * @return no of values
         */
        public int getNumberOfPairs()
        {
            return mapping.size();
        }

        public boolean equals(Object obj)
        {
            if (obj == this)
            {
                return true;
            }

            if (!(obj instanceof ValuePairs))
            {
                return false;
            }

            ValuePairs that = (ValuePairs) obj;

            return EqualsUtil.areEqual(getNumberOfValues(), that.getNumberOfValues());
        }
    }

    public ValuePairs getValue()
    {
        return (ValuePairs) value;
    }
}
