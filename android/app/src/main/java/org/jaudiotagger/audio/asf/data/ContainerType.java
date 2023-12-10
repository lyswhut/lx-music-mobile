package org.jaudiotagger.audio.asf.data;

import org.jaudiotagger.audio.asf.util.Utils;
import org.jaudiotagger.logging.ErrorMessage;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.List;

/**
 * Enumerates capabilities, respectively uses, of metadata descriptors.<br>
 * <br>
 * The {@link #METADATA_LIBRARY_OBJECT} allows the most variations of data, as
 * well as no size limitation (if it can be stored within a DWORD amount of
 * bytes).<br>
 *
 * @author Christian Laireiter
 */
public enum ContainerType
{

    /**
     * The descriptor is used in the content branding object (chunk)
     */
    CONTENT_BRANDING(GUID.GUID_CONTENT_BRANDING, 32, false, false, false, false),

    /**
     * The descriptor is used in the content description object (chunk), so
     * {@linkplain MetadataDescriptor#DWORD_MAXVALUE maximum data length}
     * applies, no language index and stream number are allowed, as well as no
     * multiple values.
     */
    CONTENT_DESCRIPTION(GUID.GUID_CONTENTDESCRIPTION, 16, false, false, false, false),
    /**
     * The descriptor is used in an extended content description object, so the
     * {@linkplain MetadataDescriptor#DWORD_MAXVALUE maximum data size} applies,
     * and no language index and stream number other than &quot;0&quot; is
     * allowed. Additionally no multiple values are permitted.
     */
    EXTENDED_CONTENT(GUID.GUID_EXTENDED_CONTENT_DESCRIPTION, 16, false, false, false, false),
    /**
     * The descriptor is used in a metadata library object. No real size limit
     * (except DWORD range) applies. Stream numbers and language indexes can be
     * specified.
     */
    METADATA_LIBRARY_OBJECT(GUID.GUID_METADATA_LIBRARY, 32, true, true, true, true),
    /**
     * The descriptor is used in a metadata object. The
     * {@linkplain MetadataDescriptor#DWORD_MAXVALUE maximum data size} applies.
     * Stream numbers can be specified. But no language index (always
     * &quot;0&quot;).
     */
    METADATA_OBJECT(GUID.GUID_METADATA, 16, false, true, false, true);

    /**
     * Determines if low has index as high, in respect to
     * {@link #getOrdered()}
     *
     * @param low
     * @param high
     * @return <code>true</code> if in correct order.
     */
    public static boolean areInCorrectOrder(final ContainerType low, final ContainerType high)
    {
        final List<ContainerType> asList = Arrays.asList(getOrdered());
        return asList.indexOf(low) <= asList.indexOf(high);
    }

    /**
     * Returns the elements in an order, that indicates more capabilities
     * (ascending).<br>
     *
     * @return capability ordered types
     */
    public static ContainerType[] getOrdered()
    {
        return new ContainerType[]{CONTENT_DESCRIPTION, CONTENT_BRANDING, EXTENDED_CONTENT, METADATA_OBJECT, METADATA_LIBRARY_OBJECT};
    }

    /**
     * Stores the guid that identifies ASF chunks which store metadata of the
     * current type.
     */
    private final GUID containerGUID;

    /**
     * <code>true</code> if the descriptor field can store {@link GUID} values.
     */
    private final boolean guidEnabled;

    /**
     * <code>true</code> if descriptor field can refer to a language.
     */
    private final boolean languageEnabled;

    /**
     * The maximum amount of bytes the descriptor data may consume.<br>
     */
    private final BigInteger maximumDataLength;

    /**
     * <code>true</code> if the container may store multiple values of the same
     * metadata descriptor specification (equality on name, language, and
     * stream).<br>
     * WindowsMedia players advanced tag editor for example stores the
     * WM/Picture attribute once in the extended content description, and all
     * others in the metadata library object.
     */
    private final boolean multiValued;

    /**
     * if <code>-1</code> a size value has to be compared against
     * {@link #maximumDataLength} because {@link Long#MAX_VALUE} is exceeded.<br>
     * Otherwise this is the {@link BigInteger#longValue()} representation.
     */
    private final long perfMaxDataLen;

    /**
     * <code>true</code> if descriptor field can refer to specific streams.
     */
    private final boolean streamEnabled;

    /**
     * Creates an instance
     *
     * @param guid           see {@link #containerGUID}
     * @param maxDataLenBits The amount of bits that is used to represent an unsigned value
     *                       for the containers size descriptors. Will create a maximum
     *                       value for {@link #maximumDataLength}. (2 ^ maxDataLenBits -1)
     * @param guidAllowed    see {@link #guidEnabled}
     * @param stream         see {@link #streamEnabled}
     * @param language       see {@link #languageEnabled}
     * @param multiValue     see {@link #multiValued}
     */
    private ContainerType(final GUID guid, final int maxDataLenBits, final boolean guidAllowed, final boolean stream, final boolean language, final boolean multiValue)
    {
        this.containerGUID = guid;
        this.maximumDataLength = BigInteger.valueOf(2).pow(maxDataLenBits).subtract(BigInteger.ONE);
        if (this.maximumDataLength.compareTo(BigInteger.valueOf(Long.MAX_VALUE)) <= 0)
        {
            this.perfMaxDataLen = this.maximumDataLength.longValue();
        }
        else
        {
            this.perfMaxDataLen = -1;
        }
        this.guidEnabled = guidAllowed;
        this.streamEnabled = stream;
        this.languageEnabled = language;
        this.multiValued = multiValue;
    }

    /**
     * Calls {@link #checkConstraints(String, byte[], int, int, int)} and
     * actually throws the exception if there is one.
     *
     * @param name     name of the descriptor
     * @param data     content
     * @param type     data type
     * @param stream   stream number
     * @param language language index
     */
    public void assertConstraints(final String name, final byte[] data, final int type, final int stream, final int language)
    {
        final RuntimeException result = checkConstraints(name, data, type, stream, language);
        if (result != null)
        {
            throw result;
        }
    }

    /**
     * Checks if the values for a {@linkplain MetadataDescriptor content
     * descriptor} match the contraints of the container type, and returns a
     * {@link RuntimeException} if the requirements aren't met.
     *
     * @param name     name of the descriptor
     * @param data     content
     * @param type     data type
     * @param stream   stream number
     * @param language language index
     * @return <code>null</code> if everything is fine.
     */
    public RuntimeException checkConstraints(final String name, final byte[] data, final int type, final int stream, final int language)
    {
        RuntimeException result = null;
        // TODO generate tests
        if (name == null || data == null)
        {
            result = new IllegalArgumentException("Arguments must not be null.");
        }
        else
        {
            if (!Utils.isStringLengthValidNullSafe(name))
            {
                result = new IllegalArgumentException(ErrorMessage.WMA_LENGTH_OF_STRING_IS_TOO_LARGE.getMsg(name.length()));
            }
        }
        if (result == null && !isWithinValueRange(data.length))
        {
            result = new IllegalArgumentException(ErrorMessage.WMA_LENGTH_OF_DATA_IS_TOO_LARGE.getMsg(data.length, getMaximumDataLength(), getContainerGUID().getDescription()));
        }
        if (result == null && (stream < 0 || stream > MetadataDescriptor.MAX_STREAM_NUMBER || (!isStreamNumberEnabled() && stream != 0)))
        {
            final String streamAllowed = isStreamNumberEnabled() ? "0 to 127" : "0";
            result = new IllegalArgumentException(ErrorMessage.WMA_INVALID_STREAM_REFERNCE.getMsg(stream, streamAllowed, getContainerGUID().getDescription()));
        }
        if (result == null && type == MetadataDescriptor.TYPE_GUID && !isGuidEnabled())
        {
            result = new IllegalArgumentException(ErrorMessage.WMA_INVALID_GUID_USE.getMsg(getContainerGUID().getDescription()));
        }
        if (result == null && ((language != 0 && !isLanguageEnabled()) || (language < 0 || language >= MetadataDescriptor.MAX_LANG_INDEX)))
        {
            final String langAllowed = isStreamNumberEnabled() ? "0 to 126" : "0";
            result = new IllegalArgumentException(ErrorMessage.WMA_INVALID_LANGUAGE_USE.getMsg(language, getContainerGUID().getDescription(), langAllowed));
        }
        if (result == null && this == CONTENT_DESCRIPTION && type != MetadataDescriptor.TYPE_STRING)
        {
            result = new IllegalArgumentException(ErrorMessage.WMA_ONLY_STRING_IN_CD.getMsg());
        }
        return result;
    }

    /**
     * @return the containerGUID
     */
    public GUID getContainerGUID()
    {
        return this.containerGUID;
    }

    /**
     * @return the maximumDataLength
     */
    public BigInteger getMaximumDataLength()
    {
        return this.maximumDataLength;
    }

    /**
     * @return the guidEnabled
     */
    public boolean isGuidEnabled()
    {
        return this.guidEnabled;
    }

    /**
     * @return the languageEnabled
     */
    public boolean isLanguageEnabled()
    {
        return this.languageEnabled;
    }

    /**
     * Tests if the given value is less than or equal to
     * {@link #getMaximumDataLength()}, and greater or equal to zero.<br>
     *
     * @param value The value to test
     * @return <code>true</code> if size restrictions for binary data are met
     * with this container type.
     */
    public boolean isWithinValueRange(final long value)
    {
        return (this.perfMaxDataLen == -1 || this.perfMaxDataLen >= value) && value >= 0;
    }

    /**
     * @return the multiValued
     */
    public boolean isMultiValued()
    {
        return this.multiValued;
    }

    /**
     * @return the streamEnabled
     */
    public boolean isStreamNumberEnabled()
    {
        return this.streamEnabled;
    }
}