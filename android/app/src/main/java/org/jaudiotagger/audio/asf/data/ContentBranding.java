package org.jaudiotagger.audio.asf.data;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigInteger;
import java.util.HashSet;
import java.util.Set;

/**
 * This structure represents the value of the content branding object, which
 * stores the banner image, the banner image URL and the copyright URL.<br>
 *
 * @author Christian Laireiter
 */
public final class ContentBranding extends MetadataContainer
{

    /**
     * Stores the allowed {@linkplain MetadataDescriptor#getName() descriptor
     * keys}.
     */
    public final static Set<String> ALLOWED;

    /**
     * Descriptor key representing the banner image.
     */
    public final static String KEY_BANNER_IMAGE = "BANNER_IMAGE";

    /**
     * Descriptor key representing the banner image type.<br>
     * <br>
     * <b>Known/valid values are:</b>
     * <ol>
     * <li>0: there is no image present</li>
     * <li>1: there is a BMP image</li>
     * <li>2: there is a JPEG image</li>
     * <li>3: there is a GIF image</li>
     * </ol>
     */
    public final static String KEY_BANNER_TYPE = "BANNER_IMAGE_TYPE";

    /**
     * Descriptor key representing the banner image URL.
     */
    public final static String KEY_BANNER_URL = "BANNER_IMAGE_URL";

    /**
     * Descriptor key representing the copyright URL.
     */
    public final static String KEY_COPYRIGHT_URL = "COPYRIGHT_URL";

    static
    {
        ALLOWED = new HashSet<String>();
        ALLOWED.add(KEY_BANNER_IMAGE);
        ALLOWED.add(KEY_BANNER_TYPE);
        ALLOWED.add(KEY_BANNER_URL);
        ALLOWED.add(KEY_COPYRIGHT_URL);
    }

    /**
     * Creates an instance.
     */
    public ContentBranding()
    {
        this(0, BigInteger.ZERO);
    }

    /**
     * Creates an instance.
     *
     * @param pos  Position of content description within file or stream
     * @param size Length of content description.
     */
    public ContentBranding(final long pos, final BigInteger size)
    {
        super(ContainerType.CONTENT_BRANDING, pos, size);
    }

    /**
     * Returns the banner image URL.
     *
     * @return the banner image URL.
     */
    public String getBannerImageURL()
    {
        return getValueFor(KEY_BANNER_URL);
    }

    /**
     * Returns the copyright URL.
     *
     * @return the banner image URL.
     */
    public String getCopyRightURL()
    {
        return getValueFor(KEY_COPYRIGHT_URL);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public long getCurrentAsfChunkSize()
    {
        // GUID, size, image type, image data size, image url data size,
        // copyright data size
        long result = 40;
        result += assertDescriptor(KEY_BANNER_IMAGE, MetadataDescriptor.TYPE_BINARY).getRawDataSize();
        result += getBannerImageURL().length();
        result += getCopyRightURL().length();
        return result;
    }

    /**
     * Returns the binary image data.
     *
     * @return binary image data.
     */
    public byte[] getImageData()
    {
        return assertDescriptor(KEY_BANNER_IMAGE, MetadataDescriptor.TYPE_BINARY).getRawData();
    }

    /**
     * Returns the image type.<br>
     *
     * @return image type
     * @see #KEY_BANNER_TYPE for known/valid values.
     */
    public long getImageType()
    {
        if (!hasDescriptor(KEY_BANNER_TYPE))
        {
            final MetadataDescriptor descriptor = new MetadataDescriptor(ContainerType.CONTENT_BRANDING, KEY_BANNER_TYPE, MetadataDescriptor.TYPE_DWORD);
            descriptor.setDWordValue(0);
            addDescriptor(descriptor);
        }
        return assertDescriptor(KEY_BANNER_TYPE).getNumber();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean isAddSupported(final MetadataDescriptor descriptor)
    {
        return ALLOWED.contains(descriptor.getName()) && super.isAddSupported(descriptor);
    }

    /**
     * This method sets the banner image URL, if <code>imageURL</code> is not
     * blank.<br>
     *
     * @param imageURL image URL to set.
     */
    public void setBannerImageURL(final String imageURL)
    {
        if (Utils.isBlank(imageURL))
        {
            removeDescriptorsByName(KEY_BANNER_URL);
        }
        else
        {
            assertDescriptor(KEY_BANNER_URL).setStringValue(imageURL);
        }
    }

    /**
     * This method sets the copyright URL, if <code>copyRight</code> is not
     * blank.<br>
     *
     * @param copyRight copyright URL to set.
     */
    public void setCopyRightURL(final String copyRight)
    {
        if (Utils.isBlank(copyRight))
        {
            removeDescriptorsByName(KEY_COPYRIGHT_URL);
        }
        else
        {
            assertDescriptor(KEY_COPYRIGHT_URL).setStringValue(copyRight);
        }
    }

    /**
     * @param imageType
     * @param imageData
     */
    public void setImage(final long imageType, final byte[] imageData)
    {
        assert imageType >= 0 && imageType <= 3;
        assert imageType > 0 || imageData.length == 0;
        assertDescriptor(KEY_BANNER_TYPE, MetadataDescriptor.TYPE_DWORD).setDWordValue(imageType);
        assertDescriptor(KEY_BANNER_IMAGE, MetadataDescriptor.TYPE_BINARY).setBinaryValue(imageData);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public long writeInto(final OutputStream out) throws IOException
    {
        final long chunkSize = getCurrentAsfChunkSize();
        out.write(getGuid().getBytes());
        Utils.writeUINT64(chunkSize, out);
        Utils.writeUINT32(getImageType(), out);
        assert getImageType() >= 0 && getImageType() <= 3;
        final byte[] imageData = getImageData();
        assert getImageType() > 0 || imageData.length == 0;
        Utils.writeUINT32(imageData.length, out);
        out.write(imageData);
        Utils.writeUINT32(getBannerImageURL().length(), out);
        out.write(getBannerImageURL().getBytes(StandardCharsets.US_ASCII));
        Utils.writeUINT32(getCopyRightURL().length(), out);
        out.write(getCopyRightURL().getBytes(StandardCharsets.US_ASCII));
        return chunkSize;
    }

}
