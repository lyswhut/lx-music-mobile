package org.jaudiotagger.tag.asf;

import org.jaudiotagger.audio.asf.data.AsfHeader;
import org.jaudiotagger.audio.asf.data.MetadataDescriptor;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.id3.valuepair.ImageFormats;

import java.io.ByteArrayOutputStream;
import java.io.UnsupportedEncodingException;
import java.util.logging.Logger;

/**
 * Encapsulates the WM/Pictures provides some convenience methods for decoding
 * the binary data it contains
 *
 * The value of a WM/Pictures metadata descriptor is as follows:
 *
 * byte0 Picture Type byte1-4 Length of the image data mime type encoded as
 * UTF-16LE null byte null byte description encoded as UTF-16LE (optional) null
 * byte null byte image data
 */
public class AsfTagCoverField extends AbstractAsfTagImageField
{
    /**
     * Logger Object
     */
    public final static Logger LOGGER = Logger
            .getLogger("org.jaudiotagger.audio.asf.tag");

    /**
     * Description
     */
    private String description;

    /**
     * We need this to retrieve the buffered image, if required
     */
    private int endOfName = 0;

    /**
     * Image Data Size as read
     */
    private int imageDataSize;

    /**
     * Mimetype of binary
     */
    private String mimeType;

    /**
     * Picture Type
     */
    private int pictureType;

    /**
     * Create New Image Field
     * 
     * @param imageData
     * @param pictureType
     * @param description
     * @param mimeType
     */
    public AsfTagCoverField(final byte[] imageData, final int pictureType,
            final String description, final String mimeType) {
        super(new MetadataDescriptor(AsfFieldKey.COVER_ART.getFieldName(),
                MetadataDescriptor.TYPE_BINARY));
        this.getDescriptor()
                .setBinaryValue(
                        createRawContent(imageData, pictureType, description,
                                mimeType));
    }

    /**
     * Creates an instance from a metadata descriptor
     * 
     * @param source
     *            The metadata descriptor, whose content is published.<br>
     */
    public AsfTagCoverField(final MetadataDescriptor source) {
        super(source);

        if (!source.getName().equals(AsfFieldKey.COVER_ART.getFieldName())) {
            throw new IllegalArgumentException(
                    "Descriptor description must be WM/Picture");
        }
        if (source.getType() != MetadataDescriptor.TYPE_BINARY) {
            throw new IllegalArgumentException("Descriptor type must be binary");
        }

        try {
            processRawContent();
        } catch (final UnsupportedEncodingException uee) {
            // Should never happen
            throw new RuntimeException(uee); // NOPMD by Christian Laireiter on 5/9/09 5:45 PM
        }
    }

    private byte[] createRawContent(final byte[] data, final int pictureType,
            final String description, String mimeType) { // NOPMD by Christian Laireiter on 5/9/09 5:46 PM
        this.description = description;
        this.imageDataSize = data.length;
        this.pictureType = pictureType;
        this.mimeType = mimeType;

        // Get Mimetype from data if not already setField
        if (mimeType == null) {
            mimeType = ImageFormats.getMimeTypeForBinarySignature(data);
            // Couldnt identify lets default to png because probably error in
            // code because not 100% sure how to identify
            // formats
            if (mimeType == null) {
                LOGGER.warning(ErrorMessage.GENERAL_UNIDENITIFED_IMAGE_FORMAT
                        .getMsg());
                mimeType = ImageFormats.MIME_TYPE_PNG;
            }
        }

        final ByteArrayOutputStream baos = new ByteArrayOutputStream();

        // PictureType
        baos.write(pictureType);

        // ImageDataSize
        baos.write(org.jaudiotagger.audio.generic.Utils
                .getSizeLEInt32(data.length), 0, 4);

        // mimetype
        byte[] mimeTypeData;
        try {
            mimeTypeData = mimeType.getBytes(AsfHeader.ASF_CHARSET.name());
        } catch (final UnsupportedEncodingException uee) {
            // Should never happen
            throw new RuntimeException("Unable to find encoding:" // NOPMD by Christian Laireiter on 5/9/09 5:45 PM
                    + AsfHeader.ASF_CHARSET.name());
        }
        baos.write(mimeTypeData, 0, mimeTypeData.length);

        // Seperator
        baos.write(0x00);
        baos.write(0x00);

        // description
        if (description != null && description.length() > 0) {
            byte[] descriptionData;
            try {
                descriptionData = description.getBytes(AsfHeader.ASF_CHARSET
                        .name());
            } catch (final UnsupportedEncodingException uee) {
                // Should never happen
                throw new RuntimeException("Unable to find encoding:" // NOPMD by Christian Laireiter on 5/9/09 5:45 PM
                        + AsfHeader.ASF_CHARSET.name());
            }
            baos.write(descriptionData, 0, descriptionData.length);
        }

        // Seperator (always write whther or not we have descriptor field)
        baos.write(0x00);
        baos.write(0x00);

        // Image data
        baos.write(data, 0, data.length);

        return baos.toByteArray();
    }

    public String getDescription() {
        return this.description;
    }

    @Override
    public int getImageDataSize() {
        return this.imageDataSize;
    }

    public String getMimeType() {
        return this.mimeType;
    }

    public int getPictureType() {
        return this.pictureType;
    }

    /**
     * @return the raw image data only
     */
    @Override
    public byte[] getRawImageData() {
        final ByteArrayOutputStream baos = new ByteArrayOutputStream();
        baos.write(getRawContent(), this.endOfName, this.toWrap
                .getRawDataSize()
                - this.endOfName);
        return baos.toByteArray();
    }

    private void processRawContent() throws UnsupportedEncodingException {
        // PictureType
        this.pictureType = this.getRawContent()[0];

        // ImageDataSize
        this.imageDataSize = org.jaudiotagger.audio.generic.Utils.getIntLE(this
                .getRawContent(), 1, 2);

        // Set Count to after picture type,datasize and two byte nulls
        int count = 5;
        this.mimeType = null;
        this.description = null; // Optional
        int endOfMimeType = 0;

        while (count < this.getRawContent().length - 1) {
            if (getRawContent()[count] == 0 && getRawContent()[count + 1] == 0) {
                if (this.mimeType == null) {
                    this.mimeType = new String(getRawContent(), 5, (count) - 5,
                            "UTF-16LE");
                    endOfMimeType = count + 2;
                } else if (this.description == null) {
                    this.description = new String(getRawContent(),
                            endOfMimeType, count - endOfMimeType, "UTF-16LE");
                    this.endOfName = count + 2;
                    break;
                }
            }
            count += 2; // keep on two byte word boundary
        }
    }

}
