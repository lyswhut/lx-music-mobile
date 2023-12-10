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

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * This class is used for representation of GUIDs and as a reference list of all
 * Known GUIDs. <br>
 *
 * @author Christian Laireiter
 */
public final class GUID
{

    /**
     * This constant defines the GUID for stream chunks describing audio
     * streams, indicating the the audio stream has no error concealment. <br>
     */
    public final static GUID GUID_AUDIO_ERROR_CONCEALEMENT_ABSENT = new GUID(new int[]{0x40, 0xA4, 0xF1, 0x49, 0xCE, 0x4E, 0xD0, 0x11, 0xA3, 0xAC, 0x00, 0xA0, 0xC9, 0x03, 0x48, 0xF6}, "Audio error concealment absent.");

    /**
     * This constant defines the GUID for stream chunks describing audio
     * streams, indicating the the audio stream has interleaved error
     * concealment. <br>
     */
    public final static GUID GUID_AUDIO_ERROR_CONCEALEMENT_INTERLEAVED = new GUID(new int[]{0x40, 0xA4, 0xF1, 0x49, 0xCE, 0x4E, 0xD0, 0x11, 0xA3, 0xAC, 0x00, 0xA0, 0xC9, 0x03, 0x48, 0xF6}, "Interleaved audio error concealment.");

    /**
     * This constant stores the GUID indicating that stream type is audio.
     */
    public final static GUID GUID_AUDIOSTREAM = new GUID(new int[]{0x40, 0x9E, 0x69, 0xF8, 0x4D, 0x5B, 0xCF, 0x11, 0xA8, 0xFD, 0x00, 0x80, 0x5F, 0x5C, 0x44, 0x2B}, " Audio stream");

    /**
     * This constant stores the GUID indicating a content branding object.
     */
    public final static GUID GUID_CONTENT_BRANDING = new GUID(new int[]{0xFA, 0xB3, 0x11, 0x22, 0x23, 0xBD, 0xD2, 0x11, 0xB4, 0xB7, 0x00, 0xA0, 0xC9, 0x55, 0xFC, 0x6E}, "Content Branding");

    /**
     * This is for the Content Encryption Object
     * 2211B3FB-BD23-11D2-B4B7-00A0C955FC6E, needs to be little-endian.
     */
    public final static GUID GUID_CONTENT_ENCRYPTION = new GUID(new int[]{0xfb, 0xb3, 0x11, 0x22, 0x23, 0xbd, 0xd2, 0x11, 0xb4, 0xb7, 0x00, 0xa0, 0xc9, 0x55, 0xfc, 0x6e}, "Content Encryption Object");

    /**
     * This constant represents the guidData for a chunk which contains Title,
     * author, copyright, description and rating.
     */
    public final static GUID GUID_CONTENTDESCRIPTION = new GUID(new int[]{0x33, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11, 0xA6, 0xD9, 0x00, 0xAA, 0x00, 0x62, 0xCE, 0x6C}, "Content Description");

    /**
     * This constant stores the GUID for Encoding-Info chunks.
     */
    public final static GUID GUID_ENCODING = new GUID(new int[]{0x40, 0x52, 0xD1, 0x86, 0x1D, 0x31, 0xD0, 0x11, 0xA3, 0xA4, 0x00, 0xA0, 0xC9, 0x03, 0x48, 0xF6}, "Encoding description");

    /**
     * This constant defines the GUID for a WMA "Extended Content Description"
     * chunk. <br>
     */
    public final static GUID GUID_EXTENDED_CONTENT_DESCRIPTION = new GUID(new int[]{0x40, 0xA4, 0xD0, 0xD2, 0x07, 0xE3, 0xD2, 0x11, 0x97, 0xF0, 0x00, 0xA0, 0xC9, 0x5E, 0xA8, 0x50}, "Extended Content Description");

    /**
     * GUID of ASF file header.
     */
    public final static GUID GUID_FILE = new GUID(new int[]{0xA1, 0xDC, 0xAB, 0x8C, 0x47, 0xA9, 0xCF, 0x11, 0x8E, 0xE4, 0x00, 0xC0, 0x0C, 0x20, 0x53, 0x65}, "File header");

    /**
     * This constant defines the GUID of a asf header chunk.
     */
    public final static GUID GUID_HEADER = new GUID(new int[]{0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11, 0xa6, 0xd9, 0x00, 0xaa, 0x00, 0x62, 0xce, 0x6c}, "Asf header");

    /**
     * This constant stores a GUID whose functionality is unknown.
     */
    public final static GUID GUID_HEADER_EXTENSION = new GUID(new int[]{0xB5, 0x03, 0xBF, 0x5F, 0x2E, 0xA9, 0xCF, 0x11, 0x8E, 0xE3, 0x00, 0xC0, 0x0C, 0x20, 0x53, 0x65}, "Header Extension");

    /**
     * This constant stores the GUID indicating the asf language list object.<br>
     */
    public final static GUID GUID_LANGUAGE_LIST = new GUID(new int[]{0xa9, 0x46, 0x43, 0x7c, 0xe0, 0xef, 0xfc, 0x4b, 0xb2, 0x29, 0x39, 0x3e, 0xde, 0x41, 0x5c, 0x85}, "Language List");

    /**
     * This constant stores the length of GUIDs used with ASF streams. <br>
     */
    public final static int GUID_LENGTH = 16;

    /**
     * This constant stores the GUID indicating the asf metadata object.<br>
     */
    public final static GUID GUID_METADATA = new GUID(new int[]{0xea, 0xcb, 0xf8, 0xc5, 0xaf, 0x5b, 0x77, 0x48, 0x84, 0x67, 0xaa, 0x8c, 0x44, 0xfa, 0x4c, 0xca}, "Metadata");

    /**
     * This constant stores the GUID indicating the asf metadata library object.<br>
     */
    public final static GUID GUID_METADATA_LIBRARY = new GUID(new int[]{0x94, 0x1c, 0x23, 0x44, 0x98, 0x94, 0xd1, 0x49, 0xa1, 0x41, 0x1d, 0x13, 0x4e, 0x45, 0x70, 0x54}, "Metadata Library");

    /**
     * The GUID String values format.<br>
     */
    private final static Pattern GUID_PATTERN = Pattern.compile("[a-f0-9]{8}\\-[a-f0-9]{4}\\-[a-f0-9]{4}\\-[a-f0-9]{4}\\-[a-f0-9]{12}", Pattern.CASE_INSENSITIVE);

    /**
     * This constant stores the GUID indicating a stream object.
     */
    public final static GUID GUID_STREAM = new GUID(new int[]{0x91, 0x07, 0xDC, 0xB7, 0xB7, 0xA9, 0xCF, 0x11, 0x8E, 0xE6, 0x00, 0xC0, 0x0C, 0x20, 0x53, 0x65}, "Stream");

    /**
     * This constant stores a GUID indicating a "stream bitrate properties"
     * chunk.
     */
    public final static GUID GUID_STREAM_BITRATE_PROPERTIES = new GUID(new int[]{0xCE, 0x75, 0xF8, 0x7B, 0x8D, 0x46, 0xD1, 0x11, 0x8D, 0x82, 0x00, 0x60, 0x97, 0xC9, 0xA2, 0xB2}, "Stream bitrate properties");

    /**
     * This map is used, to get the description of a GUID instance, which has
     * been created by reading.<br>
     * The map comparison is done against the {@link GUID#guidData} field. But
     * only the {@link #KNOWN_GUIDS} have a description set.
     */
    private final static Map<GUID, GUID> GUID_TO_CONFIGURED;

    /**
     * This constant represents a GUID implementation which can be used for
     * generic implementations, which have to provide a GUID, but do not really
     * require a specific GUID to work.
     */
    public final static GUID GUID_UNSPECIFIED = new GUID(new int[]{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}, "Unspecified");

    /**
     * This constant stores the GUID indicating that stream type is video.
     */
    public final static GUID GUID_VIDEOSTREAM = new GUID(new int[]{0xC0, 0xEF, 0x19, 0xBC, 0x4D, 0x5B, 0xCF, 0x11, 0xA8, 0xFD, 0x00, 0x80, 0x5F, 0x5C, 0x44, 0x2B}, "Video stream");

    /**
     * This field stores all known GUIDs.
     */
    public final static GUID[] KNOWN_GUIDS;

    /**
     * This constant stores the GUID for a &quot;script command object&quot;.<br>
     */
    public final static GUID SCRIPT_COMMAND_OBJECT = new GUID(new int[]{0x30, 0x1a, 0xfb, 0x1e, 0x62, 0x0b, 0xd0, 0x11, 0xa3, 0x9b, 0x00, 0xa0, 0xc9, 0x03, 0x48, 0xf6}, "Script Command Object");

    static
    {
        KNOWN_GUIDS = new GUID[]{GUID_AUDIO_ERROR_CONCEALEMENT_ABSENT, GUID_CONTENTDESCRIPTION, GUID_AUDIOSTREAM, GUID_ENCODING, GUID_FILE, GUID_HEADER, GUID_STREAM, GUID_EXTENDED_CONTENT_DESCRIPTION, GUID_VIDEOSTREAM, GUID_HEADER_EXTENSION, GUID_STREAM_BITRATE_PROPERTIES, SCRIPT_COMMAND_OBJECT, GUID_CONTENT_ENCRYPTION, GUID_CONTENT_BRANDING, GUID_UNSPECIFIED, GUID_METADATA_LIBRARY, GUID_METADATA, GUID_LANGUAGE_LIST};
        GUID_TO_CONFIGURED = new HashMap<GUID, GUID>(KNOWN_GUIDS.length);
        for (final GUID curr : KNOWN_GUIDS)
        {
            assert !GUID_TO_CONFIGURED.containsKey(curr) : "Double definition: \"" + GUID_TO_CONFIGURED.get(curr).getDescription() + "\" <-> \"" + curr.getDescription() + "\"";
            GUID_TO_CONFIGURED.put(curr, curr);
        }
    }

    /**
     * This method checks if the given <code>value</code> is matching the GUID
     * specification of ASF streams. <br>
     *
     * @param value possible GUID.
     * @return <code>true</code> if <code>value</code> matches the specification
     * of a GUID.
     */
    public static boolean assertGUID(final int[] value)
    {
        return value != null && value.length == GUID.GUID_LENGTH;
    }

    /**
     * This method looks up a GUID instance from {@link #KNOWN_GUIDS} which
     * matches the value of the given GUID.
     *
     * @param orig GUID to look up.
     * @return a GUID instance from {@link #KNOWN_GUIDS} if available.
     * <code>null</code> else.
     */
    public static GUID getConfigured(final GUID orig)
    {
        // safe against null
        return GUID_TO_CONFIGURED.get(orig);
    }

    /**
     * This method searches a GUID in {@link #KNOWN_GUIDS}which is equal to the
     * given <code>guidData</code> and returns its description. <br>
     * This method is useful if a GUID was read out of a file and no
     * identification has been done yet.
     *
     * @param guid GUID, which description is needed.
     * @return description of the GUID if found. Else <code>null</code>
     */
    public static String getGuidDescription(final GUID guid)
    {
        String result = null;
        if (guid == null)
        {
            throw new IllegalArgumentException("Argument must not be null.");
        }
        if (getConfigured(guid) != null)
        {
            result = getConfigured(guid).getDescription();
        }
        return result;
    }

    /**
     * This method parses a String as GUID.<br>
     * The format is like the one in the ASF specification.<br>
     * An Example: <code>C5F8CBEA-5BAF-4877-8467-AA8C44FA4CCA</code><br>
     *
     * @param guid the string to parse.
     * @return the GUID.
     * @throws GUIDFormatException If the GUID has an invalid format.
     */
    public static GUID parseGUID(final String guid) throws GUIDFormatException
    {
        if (guid == null)
        {
            throw new GUIDFormatException("null");
        }
        if (!GUID_PATTERN.matcher(guid).matches())
        {
            throw new GUIDFormatException("Invalid guidData format.");
        }
        final int[] bytes = new int[GUID_LENGTH];
        /*
         * Don't laugh, but did not really come up with a nicer solution today
         */
        final int[] arrayIndices = {3, 2, 1, 0, 5, 4, 7, 6, 8, 9, 10, 11, 12, 13, 14, 15};
        int arrayPointer = 0;
        for (int i = 0; i < guid.length(); i++)
        {
            if (guid.charAt(i) == '-')
            {
                continue;
            }
            bytes[arrayIndices[arrayPointer++]] = Integer.parseInt(guid.substring(i, i + 2), 16);
            i++;
        }
        return new GUID(bytes);
    }

    /**
     * Stores an optionally description of the GUID.
     */
    private String description = "";

    /**
     * An instance of this class stores the value of the wrapped GUID in this
     * field. <br>
     */
    private int[] guidData = null;

    /**
     * Stores the hash code of the object.<br>
     * <code>&quot;-1&quot;</code> if not determined yet.
     */
    private int hash;

    /**
     * Creates an instance and assigns given <code>value</code>.<br>
     *
     * @param value GUID, which should be assigned. (will be converted to int[])
     */
    public GUID(final byte[] value)
    {
        assert value != null;
        final int[] tmp = new int[value.length];
        for (int i = 0; i < value.length; i++)
        {
            tmp[i] = (0xFF & value[i]);
        }
        setGUID(tmp);
    }

    /**
     * Creates an instance and assigns given <code>value</code>.<br>
     *
     * @param value GUID, which should be assigned.
     */
    public GUID(final int[] value)
    {
        setGUID(value);
    }

    /**
     * Creates an instance like {@link #GUID(int[])}and sets the optional
     * description. <br>
     *
     * @param value GUID, which should be assigned.
     * @param desc  Description for the GUID.
     */
    public GUID(final int[] value, final String desc)
    {
        this(value);
        if (desc == null)
        {
            throw new IllegalArgumentException("Argument must not be null.");
        }
        this.description = desc;
    }

    /**
     * Creates an instance like {@link #GUID(int[])} and sets the optional
     * description. (the int[] is obtained by {@link GUID#parseGUID(String)}) <br>
     *
     * @param guidString GUID, which should be assigned.
     * @param desc       Description for the GUID.
     */
    public GUID(final String guidString, final String desc)
    {
        this(parseGUID(guidString).getGUID());
        if (desc == null)
        {
            throw new IllegalArgumentException("Argument must not be null.");
        }
        this.description = desc;
    }

    /**
     * This method compares two objects. If the given Object is a {@link GUID},
     * the stored GUID values are compared. <br>
     *
     * @see Object#equals(Object)
     */
    @Override
    public boolean equals(final Object obj)
    {
        boolean result = false;
        if (obj instanceof GUID)
        {
            final GUID other = (GUID) obj;
            result = Arrays.equals(this.getGUID(), other.getGUID());
        }
        return result;
    }

    /**
     * This method returns the GUID as an array of bytes. <br>
     *
     * @return The GUID as a byte array.
     * @see #getGUID()
     */
    public byte[] getBytes()
    {
        final byte[] result = new byte[this.guidData.length];
        for (int i = 0; i < result.length; i++)
        {
            result[i] = (byte) (this.guidData[i] & 0xFF);
        }
        return result;
    }

    /**
     * @return Returns the description.
     */
    public String getDescription()
    {
        return this.description;
    }

    /**
     * This method returns the GUID of this object. <br>
     *
     * @return stored GUID.
     */
    public int[] getGUID()
    {
        final int[] copy = new int[this.guidData.length];
        System.arraycopy(this.guidData, 0, copy, 0, this.guidData.length);
        return copy;
    }

    /**
     * Convenience method to get 2digit hex values of each byte.
     *
     * @param bytes bytes to convert.
     * @return each byte as 2 digit hex.
     */
    private String[] getHex(final byte[] bytes)
    {
        final String[] result = new String[bytes.length];
        final StringBuilder tmp = new StringBuilder();
        for (int i = 0; i < bytes.length; i++)
        {
            tmp.delete(0, tmp.length());
            tmp.append(Integer.toHexString(0xFF & bytes[i]));
            if (tmp.length() == 1)
            {
                tmp.insert(0, "0");
            }
            result[i] = tmp.toString();
        }
        return result;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int hashCode()
    {
        if (this.hash == -1)
        {
            int tmp = 0;
            for (final int curr : getGUID())
            {
                tmp = tmp * 31 + curr;
            }
            this.hash = tmp;
        }
        return this.hash;
    }

    /**
     * This method checks if the currently stored GUID ({@link #guidData}) is
     * correctly filled. <br>
     *
     * @return <code>true</code> if it is.
     */
    public boolean isValid()
    {
        return assertGUID(getGUID());
    }

    /**
     * This method gives a hex formatted representation of {@link #getGUID()}
     *
     * @return hex formatted representation.
     */
    public String prettyPrint()
    {
        final StringBuilder result = new StringBuilder();
        String descr = getDescription();
        if (Utils.isBlank(descr))
        {
            descr = getGuidDescription(this);
        }
        if (!Utils.isBlank(descr))
        {
            result.append("Description: ").append(descr).append(Utils.LINE_SEPARATOR).append("   ");
        }
        result.append(this.toString());
        return result.toString();
    }

    /**
     * This method saves a copy of the given <code>value</code> as the
     * represented value of this object. <br>
     * The given value is checked with {@link #assertGUID(int[])}.<br>
     *
     * @param value GUID to assign.
     */
    private void setGUID(final int[] value)
    {
        if (assertGUID(value))
        {
            this.guidData = new int[GUID_LENGTH];
            System.arraycopy(value, 0, this.guidData, 0, GUID_LENGTH);
        }
        else
        {
            throw new IllegalArgumentException("The given guidData doesn't match the GUID specification.");
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String toString()
    {
        // C5F8CBEA-5BAF-4877-8467-AA8C44FA4CCA
        // 0xea, 0xcb,0xf8, 0xc5, 0xaf, 0x5b, 0x77, 0x48, 0x84, 0x67, 0xaa,
        // 0x8c, 0x44,0xfa, 0x4c, 0xca
        final StringBuilder result = new StringBuilder();
        final String[] bytes = getHex(getBytes());
        result.append(bytes[3]);
        result.append(bytes[2]);
        result.append(bytes[1]);
        result.append(bytes[0]);
        result.append('-');
        result.append(bytes[5]);
        result.append(bytes[4]);
        result.append('-');
        result.append(bytes[7]);
        result.append(bytes[6]);
        result.append('-');
        result.append(bytes[8]);
        result.append(bytes[9]);
        result.append('-');
        result.append(bytes[10]);
        result.append(bytes[11]);
        result.append(bytes[12]);
        result.append(bytes[13]);
        result.append(bytes[14]);
        result.append(bytes[15]);
        return result.toString();
    }

}