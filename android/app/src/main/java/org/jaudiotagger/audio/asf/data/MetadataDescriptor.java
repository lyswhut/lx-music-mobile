/*
 * Entagged Audio Tag library
 * Copyright (c) 2004-2005 Christian Laireiter <liree@web.de>
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *  
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
package org.jaudiotagger.audio.asf.data;

import org.jaudiotagger.audio.asf.util.Utils;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.TagOptionSingleton;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.logging.Logger;

/**
 * This structure represents metadata objects in ASF {@link MetadataContainer}.<br>
 * The values are
 * {@linkplain ContainerType#assertConstraints(String, byte[], int, int, int)
 * checked} against the capability introduced by the given
 * {@link ContainerType} at construction.<br>
 * <br>
 * <b>Limitation</b>: Even though some container types do not restrict the data
 * size to {@link Integer#MAX_VALUE}, this implementation does it (due to java
 * nature).<br>
 * 2 GiB of data should suffice, and even be to large for normal java heap.
 *
 * @author Christian Laireiter
 */
public class MetadataDescriptor implements Comparable<MetadataDescriptor>, Cloneable
{

    /**
     * Maximum value for WORD.
     */
    public static final long DWORD_MAXVALUE = new BigInteger("FFFFFFFF", 16).longValue();

    /**
     * Logger instance.
     */
    private static final Logger LOGGER = Logger.getLogger("org.jaudiotagger.audio.asf.data");

    /**
     * The maximum language index allowed. (exclusive)
     */
    public static final int MAX_LANG_INDEX = 127;

    /**
     * Maximum stream number. (inclusive)
     */
    public static final int MAX_STREAM_NUMBER = 127;

    /**
     * Maximum value for a QWORD value (64 bit unsigned).<br>
     */
    public static final BigInteger QWORD_MAXVALUE = new BigInteger("FFFFFFFFFFFFFFFF", 16);

    /**
     * Constant for the metadata descriptor-type for binary data.
     */
    public final static int TYPE_BINARY = 1;

    /**
     * Constant for the metadata descriptor-type for booleans.
     */
    public final static int TYPE_BOOLEAN = 2;

    /**
     * Constant for the metadata descriptor-type for DWORD (32-bit unsigned). <br>
     */
    public final static int TYPE_DWORD = 3;

    /**
     * Constant for the metadata descriptor-type for GUIDs (128-bit).<br>
     */
    public final static int TYPE_GUID = 6;

    /**
     * Constant for the metadata descriptor-type for QWORD (64-bit unsinged). <br>
     */
    public final static int TYPE_QWORD = 4;

    /**
     * Constant for the metadata descriptor-type for Strings.
     */
    public final static int TYPE_STRING = 0;

    /**
     * Constant for the metadata descriptor-type for WORD (16-bit unsigned). <br>
     */
    public final static int TYPE_WORD = 5;

    /**
     * Maximum value for WORD.
     */
    public static final int WORD_MAXVALUE = 65535;

    /**
     * Stores the containerType of the descriptor.
     */
    private final ContainerType containerType;

    /**
     * The binary representation of the value.
     */
    /*
     * Note: The maximum data length could be up to a 64-Bit number (unsigned),
     * but java for now handles just int sized byte[]. Since this class stores
     * all data in primitive byte[] this size restriction is cascaded to all
     * dependent implementations.
     */
    private byte[] content = new byte[0];

    /**
     * This field shows the type of the metadata descriptor. <br>
     *
     * @see #TYPE_BINARY
     * @see #TYPE_BOOLEAN
     * @see #TYPE_DWORD
     * @see #TYPE_GUID
     * @see #TYPE_QWORD
     * @see #TYPE_STRING
     * @see #TYPE_WORD
     */
    private int descriptorType;

    /**
     * the index of the language in the {@linkplain LanguageList language list}
     * this descriptor applies to.<br>
     */
    private int languageIndex = 0;

    /**
     * The name of the metadata descriptor.
     */
    private final String name;

    /**
     * The number of the stream, this descriptor applies to.<br>
     */
    private int streamNumber = 0;

    /**
     * Creates an Instance.<br>
     *
     * @param type     the container type, this descriptor is resctricted to.
     * @param propName Name of the MetadataDescriptor.
     * @param propType Type of the metadata descriptor. See {@link #descriptorType}
     */
    public MetadataDescriptor(final ContainerType type, final String propName, final int propType)
    {
        this(type, propName, propType, 0, 0);
    }

    /**
     * Creates an Instance.
     *
     * @param type     The container type the values (the whole descriptor) is
     *                 restricted to.
     * @param propName Name of the MetadataDescriptor.
     * @param propType Type of the metadata descriptor. See {@link #descriptorType}
     * @param stream   the number of the stream the descriptor refers to.
     * @param language the index of the language entry in a {@link LanguageList} this
     *                 descriptor refers to.<br>
     *                 <b>Consider</b>: No checks performed if language entry exists.
     */
    public MetadataDescriptor(final ContainerType type, final String propName, final int propType, final int stream, final int language)
    {
        assert type != null;
        type.assertConstraints(propName, new byte[0], propType, stream, language);
        this.containerType = type;
        this.name = propName;
        this.descriptorType = propType;
        this.streamNumber = stream;
        this.languageIndex = language;
    }

    /**
     * Creates an instance.<br>
     * Capabilities are set to {@link ContainerType#METADATA_LIBRARY_OBJECT}.<br>
     *
     * @param propName name of the metadata descriptor.
     */
    public MetadataDescriptor(final String propName)
    {
        this(propName, TYPE_STRING);
    }

    /**
     * Creates an Instance.<br>
     * Capabilities are set to {@link ContainerType#METADATA_LIBRARY_OBJECT}.<br>
     *
     * @param propName Name of the MetadataDescriptor.
     * @param propType Type of the metadata descriptor. See {@link #descriptorType}
     */
    public MetadataDescriptor(final String propName, final int propType)
    {
        this(ContainerType.METADATA_LIBRARY_OBJECT, propName, propType, 0, 0);
    }

    /**
     * Converts the descriptors value into a number if possible.<br>
     * A boolean will be converted to &quot;1&quot; if <code>true</code>,
     * otherwise &quot;0&quot;.<br>
     * String will be interpreted as number with radix &quot;10&quot;.<br>
     * Binary data will be interpreted as the default WORD,DWORD or QWORD binary
     * representation, but only if the data does not exceed 8 bytes. This
     * precaution is done to prevent creating a number of a multi kilobyte
     * image.<br>
     * A GUID cannot be converted in any case.
     *
     * @return number representation.
     * @throws NumberFormatException If no conversion is supported.
     */
    public BigInteger asNumber()
    {
        BigInteger result = null;
        switch (this.descriptorType)
        {
            case TYPE_BOOLEAN:
            case TYPE_WORD:
            case TYPE_DWORD:
            case TYPE_QWORD:
            case TYPE_BINARY:
                if (this.content.length > 8)
                {
                    throw new NumberFormatException("Binary data would exceed QWORD");
                }
                break;
            case TYPE_GUID:
                throw new NumberFormatException("GUID cannot be converted to a number.");
            case TYPE_STRING:
                result = new BigInteger(getString(), 10);
                break;
            default:
                throw new IllegalStateException();
        }
        if (result == null)
        {
            final byte[] copy = new byte[this.content.length];
            for (int i = 0; i < copy.length; i++)
            {
                copy[i] = this.content[this.content.length - (i + 1)];
            }
            result = new BigInteger(1, copy);
        }
        return result;
    }

    /**
     * (overridden)
     *
     * @see Object#clone()
     */
    @Override
    public Object clone() throws CloneNotSupportedException
    {
        return super.clone();
    }

    /**
     * {@inheritDoc}
     */
    public int compareTo(final MetadataDescriptor other)
    {
        return getName().compareTo(other.getName());
    }

    /**
     * This method creates a copy of the current object. <br>
     * All data will be copied, too. <br>
     *
     * @return A new metadata descriptor containing the same values as the
     * current one.
     */
    public MetadataDescriptor createCopy()
    {
        final MetadataDescriptor result = new MetadataDescriptor(this.containerType, this.name, this.descriptorType, this.streamNumber, this.languageIndex);
        result.content = getRawData();
        return result;
    }

    /**
     * (overridden)
     *
     * @see Object#equals(Object)
     */
    @Override
    public boolean equals(final Object obj)
    {
        boolean result = false;
        if (obj instanceof MetadataDescriptor)
        {
            if (obj == this)
            {
                result = true;
            }
            else
            {
                final MetadataDescriptor other = (MetadataDescriptor) obj;
                result = other.getName().equals(getName()) && other.descriptorType == this.descriptorType && other.languageIndex == this.languageIndex && other.streamNumber == this.streamNumber && Arrays.equals(this.content, other.content);
            }
        }
        return result;
    }

    /**
     * Returns the value of the MetadataDescriptor as a Boolean. <br>
     * If no Conversion is Possible false is returned. <br>
     * <code>true</code> if first byte of {@link #content}is not zero.
     *
     * @return boolean representation of the current value.
     */
    public boolean getBoolean()
    {
        return this.content.length > 0 && this.content[0] != 0;
    }

    /**
     * This method will return a byte array, which can directly be written into
     * an "Extended Content Description"-chunk. <br>
     *
     * @return byte[] with the data, that occurs in ASF files.
     * @deprecated {@link #writeInto(OutputStream, ContainerType)} is used
     */
    @Deprecated
    public byte[] getBytes()
    {
        final ByteArrayOutputStream result = new ByteArrayOutputStream();
        try
        {
            writeInto(result, this.containerType);
        }
        catch (final IOException e)
        {
            LOGGER.warning(e.getMessage());
        }
        return result.toByteArray();
    }

    /**
     * Returns the container type this descriptor ist restricted to.
     *
     * @return the container type
     */
    public ContainerType getContainerType()
    {
        return this.containerType;
    }

    /**
     * Returns the size (in bytes) this descriptor will take when written to an
     * ASF file.<br>
     *
     * @param type the container type for which the size is calculated.
     * @return size of the descriptor in an ASF file.
     */
    public int getCurrentAsfSize(final ContainerType type)
    {
        /*
         * 2 bytes name length, 2 bytes name zero term, 2 bytes type, 2 bytes
         * content length
         */
        int result = 8;

        if (type != ContainerType.EXTENDED_CONTENT)
        {
            // Stream number and language index (respectively reserved field).
            // And +2 bytes, because data type is 32 bit, not 16
            result += 6;
        }
        result += getName().length() * 2;

        if (this.getType() == TYPE_BOOLEAN)
        {
            result += 2;
            if (type == ContainerType.EXTENDED_CONTENT)
            {
                // Extended content description boolean values are stored with
                // 32-bit
                result += 2;
            }
        }
        else
        {

            result += this.content.length;
            if (TYPE_STRING == this.getType())
            {
                result += 2; // zero term of content string.
            }
        }
        return result;
    }

    /**
     * Returns the GUID value, if content could represent one.
     *
     * @return GUID value
     */
    public GUID getGuid()
    {
        GUID result = null;
        if (getType() == TYPE_GUID && this.content.length == GUID.GUID_LENGTH)
        {
            result = new GUID(this.content);
        }
        return result;
    }

    /**
     * Returns the index of the language that is referred (see
     * {@link LanguageList}):
     *
     * @return the language index
     */
    public int getLanguageIndex()
    {
        return this.languageIndex;
    }

    /**
     * This method returns the name of the metadata descriptor.
     *
     * @return Name.
     */
    public String getName()
    {
        return this.name;
    }

    /**
     * This method returns the value of the metadata descriptor as a long. <br>
     * Converts the needed amount of byte out of {@link #content}to a number. <br>
     * Only possible if {@link #getType()}equals on of the following: <br>
     *
     * @return integer value.
     * @see #TYPE_BOOLEAN
     * @see #TYPE_DWORD
     * @see #TYPE_QWORD
     * @see #TYPE_WORD
     */
    public long getNumber()
    {
        int bytesNeeded;
        switch (getType())
        {
            case TYPE_BOOLEAN:
                bytesNeeded = 1;
                break;
            case TYPE_DWORD:
                bytesNeeded = 4;
                break;
            case TYPE_QWORD:
                bytesNeeded = 8;
                break;
            case TYPE_WORD:
                bytesNeeded = 2;
                break;
            default:
                throw new UnsupportedOperationException("The current type doesn't allow an interpretation as a number. (" + getType() + ")");
        }
        if (bytesNeeded > this.content.length)
        {
            throw new IllegalStateException("The stored data cannot represent the type of current object.");
        }
        long result = 0;
        for (int i = 0; i < bytesNeeded; i++)
        {
            result |= (((long) this.content[i] & 0xFF) << (i * 8));
        }
        return result;
    }

    /**
     * This method returns a copy of the content of the descriptor. <br>
     *
     * @return The content in binary representation, as it would be written to
     * asf file. <br>
     */
    public byte[] getRawData()
    {
        final byte[] copy = new byte[this.content.length];
        System.arraycopy(this.content, 0, copy, 0, this.content.length);
        return copy;
    }

    /**
     * Returns the size (in bytes) the binary representation of the content
     * uses. (length of {@link #getRawData()})<br>
     *
     * @return size of binary representation of the content.
     */
    public int getRawDataSize()
    {
        return this.content.length;
    }

    /**
     * Returns the stream number this descriptor applies to.<br>
     *
     * @return the stream number.
     */
    public int getStreamNumber()
    {
        return this.streamNumber;
    }

    /**
     * Returns the value of the MetadataDescriptor as a String. <br>
     *
     * @return String - Representation Value
     */
    public String getString()
    {
        String result = null;
        switch (getType())
        {
            case TYPE_BINARY:
                result = "binary data";
                break;
            case TYPE_BOOLEAN:
                result = String.valueOf(getBoolean());
                break;
            case TYPE_GUID:
                result = getGuid() == null ? "Invalid GUID" : getGuid().toString();
                break;
            case TYPE_QWORD:
            case TYPE_DWORD:
            case TYPE_WORD:
                result = String.valueOf(getNumber());
                break;
            case TYPE_STRING:
                try
                {
                    result = new String(this.content, "UTF-16LE");
                }
                catch (final UnsupportedEncodingException e)
                {
                    LOGGER.warning(e.getMessage());
                }
                break;
            default:
                throw new IllegalStateException("Current type is not known.");
        }
        return result;
    }

    /**
     * Returns the type of the metadata descriptor. <br>
     *
     * @return the value of {@link #descriptorType}
     * @see #TYPE_BINARY
     * @see #TYPE_BOOLEAN
     * @see #TYPE_DWORD
     * @see #TYPE_GUID
     * @see #TYPE_QWORD
     * @see #TYPE_STRING
     * @see #TYPE_WORD
     */
    public int getType()
    {
        return this.descriptorType;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int hashCode()
    {
        return this.name.hashCode();
    }

    /**
     * This method checks if the binary data is empty. <br>
     * Disregarding the type of the descriptor its content is stored as a byte
     * array.
     *
     * @return <code>true</code> if no value is set.
     */
    public boolean isEmpty()
    {
        return this.content.length == 0;
    }

    /**
     * Sets the Value of the current metadata descriptor. <br>
     * Using this method will change {@link #descriptorType}to
     * {@link #TYPE_BINARY}.<br>
     *
     * @param data Value to set.
     * @throws IllegalArgumentException if data is invalid for {@linkplain #getContainerType()
     *                                  container}.
     */
    public void setBinaryValue(final byte[] data) throws IllegalArgumentException
    {
        this.containerType.assertConstraints(this.name, data, this.descriptorType, this.streamNumber, this.languageIndex);
        this.content = data.clone();
        this.descriptorType = TYPE_BINARY;
    }

    /**
     * Sets the Value of the current metadata descriptor. <br>
     * Using this method will change {@link #descriptorType}to
     * {@link #TYPE_BOOLEAN}.<br>
     *
     * @param value Value to set.
     */
    public void setBooleanValue(final boolean value)
    {
        this.content = new byte[]{value ? (byte) 1 : 0};
        this.descriptorType = TYPE_BOOLEAN;
    }

    /**
     * Sets the Value of the current metadata descriptor. <br>
     * Using this method will change {@link #descriptorType}to
     * {@link #TYPE_DWORD}.
     *
     * @param value Value to set.
     */
    public void setDWordValue(final long value)
    {
        if (value < 0 || value > DWORD_MAXVALUE)
        {
            throw new IllegalArgumentException("value out of range (0-" + DWORD_MAXVALUE + ")");
        }
        this.content = Utils.getBytes(value, 4);
        this.descriptorType = TYPE_DWORD;
    }

    /**
     * Sets the value of the metadata descriptor.<br>
     * Using this method will change {@link #descriptorType} to
     * {@link #TYPE_GUID}
     *
     * @param value value to set.
     */
    public void setGUIDValue(final GUID value)
    {
        this.containerType.assertConstraints(this.name, value.getBytes(), TYPE_GUID, this.streamNumber, this.languageIndex);
        this.content = value.getBytes();
        this.descriptorType = TYPE_GUID;
    }

    /**
     * Sets the index of the referred language (see {@link LanguageList}).<br>
     * <b>Consider</b>: The {@linkplain #containerType requirements} must be
     * held.
     *
     * @param language the language index to set
     */
    public void setLanguageIndex(final int language)
    {
        this.containerType.assertConstraints(this.name, this.content, this.descriptorType, this.streamNumber, language);
        this.languageIndex = language;
    }

    /**
     * Sets the Value of the current metadata descriptor. <br>
     * Using this method will change {@link #descriptorType}to
     * {@link #TYPE_QWORD}
     *
     * @param value Value to set.
     * @throws NumberFormatException    on <code>null</code> values.
     * @throws IllegalArgumentException on illegal values or values exceeding range.
     */
    public void setQWordValue(final BigInteger value) throws IllegalArgumentException
    {
        if (value == null)
        {
            throw new NumberFormatException("null");
        }
        if (BigInteger.ZERO.compareTo(value) > 0)
        {
            throw new IllegalArgumentException("Only unsigned values allowed (no negative)");
        }
        if (MetadataDescriptor.QWORD_MAXVALUE.compareTo(value) < 0)
        {
            throw new IllegalArgumentException("Value exceeds QWORD (64 bit unsigned)");
        }
        this.content = new byte[8];
        final byte[] valuesBytes = value.toByteArray();
        if (valuesBytes.length <= 8)
        {
            for (int i = valuesBytes.length - 1; i >= 0; i--)
            {
                this.content[valuesBytes.length - (i + 1)] = valuesBytes[i];
            }
        }
        else
        {
            /*
             * In case of 64-Bit set
             */
            Arrays.fill(this.content, (byte) 0xFF);
        }
        this.descriptorType = TYPE_QWORD;
    }

    /**
     * Sets the Value of the current metadata descriptor. <br>
     * Using this method will change {@link #descriptorType}to
     * {@link #TYPE_QWORD}
     *
     * @param value Value to set.
     */
    public void setQWordValue(final long value)
    {
        if (value < 0)
        {
            throw new IllegalArgumentException("value out of range (0-" + MetadataDescriptor.QWORD_MAXVALUE.toString() + ")");
        }
        this.content = Utils.getBytes(value, 8);
        this.descriptorType = TYPE_QWORD;
    }

    /**
     * Sets the stream number the descriptor applies to.<br>
     * <b>Consider</b>: The {@linkplain #containerType requirements} must be
     * held.
     *
     * @param stream the stream number to set
     */
    public void setStreamNumber(final int stream)
    {
        this.containerType.assertConstraints(this.name, this.content, this.descriptorType, stream, this.languageIndex);
        this.streamNumber = stream;
    }

    /**
     * This method converts the given string value into the current
     * {@linkplain #getType() data type}.
     *
     * @param value value to set.
     * @throws IllegalArgumentException If conversion was impossible.
     */
    public void setString(final String value) throws IllegalArgumentException
    {
        try
        {
            switch (getType())
            {
                case TYPE_BINARY:
                    throw new IllegalArgumentException("Cannot interpret binary as string.");
                case TYPE_BOOLEAN:
                    setBooleanValue(Boolean.parseBoolean(value));
                    break;
                case TYPE_DWORD:
                    setDWordValue(Long.parseLong(value));
                    break;
                case TYPE_QWORD:
                    setQWordValue(new BigInteger(value, 10));
                    break;
                case TYPE_WORD:
                    setWordValue(Integer.parseInt(value));
                    break;
                case TYPE_GUID:
                    setGUIDValue(GUID.parseGUID(value));
                    break;
                case TYPE_STRING:
                    setStringValue(value);
                    break;
                default:
                    // new Type added but not handled.
                    throw new IllegalStateException();
            }
        }
        catch (final NumberFormatException nfe)
        {
            throw new IllegalArgumentException("Value cannot be parsed as Number or is out of range (\"" + value + "\")", nfe);
        }
    }

    /**
     * Sets the Value of the current metadata descriptor. <br>
     * Using this method will change {@link #descriptorType}to
     * {@link #TYPE_STRING}.
     *
     * @param value Value to set.
     * @throws IllegalArgumentException If byte representation would take more than 65535 Bytes.
     */
    // TODO Test
    public void setStringValue(final String value) throws IllegalArgumentException
    {
        if (value == null)
        {
            this.content = new byte[0];
        }
        else
        {
            final byte[] tmp = Utils.getBytes(value, AsfHeader.ASF_CHARSET);
            if (getContainerType().isWithinValueRange(tmp.length))
            {
                // Everything is fine here, data can be stored.
                this.content = tmp;
            }
            else
            {
                // Normally a size violation, check if JAudiotagger my truncate
                // the string
                if (TagOptionSingleton.getInstance().isTruncateTextWithoutErrors())
                {
                    // truncate the string
                    final int copyBytes = (int) getContainerType().getMaximumDataLength().longValue();
                    this.content = new byte[copyBytes % 2 == 0 ? copyBytes : copyBytes - 1];
                    System.arraycopy(tmp, 0, this.content, 0, this.content.length);
                }
                else
                {
                    // We may not truncate, so its an error
                    throw new IllegalArgumentException(ErrorMessage.WMA_LENGTH_OF_DATA_IS_TOO_LARGE.getMsg(tmp.length, getContainerType().getMaximumDataLength(), getContainerType().getContainerGUID().getDescription())
                    );
                }
            }
        }
        this.descriptorType = TYPE_STRING;
    }

    /**
     * Sets the Value of the current metadata descriptor. <br>
     * Using this method will change {@link #descriptorType}to
     * {@link #TYPE_WORD}
     *
     * @param value Value to set.
     * @throws IllegalArgumentException on negative values. ASF just supports unsigned values.
     */
    public void setWordValue(final int value) throws IllegalArgumentException
    {
        if (value < 0 || value > WORD_MAXVALUE)
        {
            throw new IllegalArgumentException("value out of range (0-" + WORD_MAXVALUE + ")");
        }
        this.content = Utils.getBytes(value, 2);
        this.descriptorType = TYPE_WORD;
    }

    /**
     * (overridden)
     *
     * @see Object#toString()
     */
    @Override
    public String toString()
    {
        return getName() + " : " + new String[]{"String: ", "Binary: ", "Boolean: ", "DWORD: ", "QWORD:", "WORD:", "GUID:"}[this.descriptorType] + getString() + " (language: " + this.languageIndex + " / stream: " + this.streamNumber + ")";
    }

    /**
     * Writes this descriptor into the specified output stream.<br>
     *
     * @param out      stream to write into.
     * @param contType the container type this descriptor is written to.
     * @return amount of bytes written.
     * @throws IOException on I/O Errors
     */
    public int writeInto(final OutputStream out, final ContainerType contType) throws IOException
    {
        final int size = getCurrentAsfSize(contType);
        /*
         * Booleans are stored as one byte, if a boolean is written, the data
         * must be converted according to the container type.
         */
        byte[] binaryData;
        if (this.descriptorType == TYPE_BOOLEAN)
        {
            binaryData = new byte[contType == ContainerType.EXTENDED_CONTENT ? 4 : 2];
            binaryData[0] = (byte) (getBoolean() ? 1 : 0);
        }
        else
        {
            binaryData = this.content;
        }
        // for Metadata objects the stream number and language index
        if (contType != ContainerType.EXTENDED_CONTENT)
        {
            Utils.writeUINT16(getLanguageIndex(), out);
            Utils.writeUINT16(getStreamNumber(), out);
        }
        Utils.writeUINT16(getName().length() * 2 + 2, out);

        // The name for the metadata objects come later
        if (contType == ContainerType.EXTENDED_CONTENT)
        {
            out.write(Utils.getBytes(getName(), AsfHeader.ASF_CHARSET));
            out.write(AsfHeader.ZERO_TERM);
        }

        // type and content len follow up are identical
        final int type = getType();
        Utils.writeUINT16(type, out);
        int contentLen = binaryData.length;
        if (TYPE_STRING == type)
        {
            contentLen += 2; // Zero Term
        }

        if (contType == ContainerType.EXTENDED_CONTENT)
        {
            Utils.writeUINT16(contentLen, out);
        }
        else
        {
            Utils.writeUINT32(contentLen, out);
        }

        // Metadata objects now write their descriptor name
        if (contType != ContainerType.EXTENDED_CONTENT)
        {
            out.write(Utils.getBytes(getName(), AsfHeader.ASF_CHARSET));
            out.write(AsfHeader.ZERO_TERM);
        }

        // The content.
        out.write(binaryData);
        if (TYPE_STRING == type)
        {
            out.write(AsfHeader.ZERO_TERM);
        }
        return size;
    }
}