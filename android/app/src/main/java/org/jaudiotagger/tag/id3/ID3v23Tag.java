/*
 *  MusicTag Copyright (C)2003,2004
 *
 *  This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 *  General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 *  or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 *  the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *  See the GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License along with this library; if not,
 *  you can getFields a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
package org.jaudiotagger.tag.id3;

import org.jaudiotagger.FileConstants;
import org.jaudiotagger.audio.mp3.MP3File;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.*;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.datatype.Pair;
import org.jaudiotagger.tag.datatype.PairedTextEncodedStringNullTerminated;
import org.jaudiotagger.tag.id3.framebody.*;
import org.jaudiotagger.tag.images.Artwork;
import org.jaudiotagger.tag.images.ArtworkFactory;
import org.jaudiotagger.tag.reference.PictureTypes;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.nio.channels.WritableByteChannel;
import java.util.*;
import java.util.logging.Level;

/**
 * Represents an ID3v2.3 tag.
 *
 * @author : Paul Taylor
 * @author : Eric Farng
 * @version $Id$
 */
public class ID3v23Tag extends AbstractID3v2Tag
{

    protected static final String TYPE_CRCDATA = "crcdata";
    protected static final String TYPE_EXPERIMENTAL = "experimental";
    protected static final String TYPE_EXTENDED = "extended";
    protected static final String TYPE_PADDINGSIZE = "paddingsize";
    protected static final String TYPE_UNSYNCHRONISATION = "unsyncronisation";


    protected static int TAG_EXT_HEADER_LENGTH = 10;
    protected static int TAG_EXT_HEADER_CRC_LENGTH = 4;
    protected static int FIELD_TAG_EXT_SIZE_LENGTH = 4;
    protected static int TAG_EXT_HEADER_DATA_LENGTH = TAG_EXT_HEADER_LENGTH - FIELD_TAG_EXT_SIZE_LENGTH;

    /**
     * ID3v2.3 Header bit mask
     */
    public static final int MASK_V23_UNSYNCHRONIZATION = FileConstants.BIT7;

    /**
     * ID3v2.3 Header bit mask
     */
    public static final int MASK_V23_EXTENDED_HEADER = FileConstants.BIT6;

    /**
     * ID3v2.3 Header bit mask
     */
    public static final int MASK_V23_EXPERIMENTAL = FileConstants.BIT5;

    /**
     * ID3v2.3 Extended Header bit mask
     */
    public static final int MASK_V23_CRC_DATA_PRESENT = FileConstants.BIT7;

    /**
     * ID3v2.3 RBUF frame bit mask
     */
    public static final int MASK_V23_EMBEDDED_INFO_FLAG = FileConstants.BIT1;

    /**
     * CRC Checksum calculated
     */
    protected boolean crcDataFlag = false;

    /**
     * Experiemntal tag
     */
    protected boolean experimental = false;

    /**
     * Contains extended header
     */
    protected boolean extended = false;

    /**
     * Crcdata Checksum in extended header
     */
    private int crc32;

    /**
     * Tag padding
     */
    private int paddingSize = 0;

    /**
     * All frames in the tag uses unsynchronisation
     */
    protected boolean unsynchronization = false;

    /**
     * The tag is compressed
     */
    protected boolean compression = false;


    public static final byte RELEASE = 2;
    public static final byte MAJOR_VERSION = 3;
    public static final byte REVISION = 0;


    /**
     * Retrieve the Release
     */
    public byte getRelease()
    {
        return RELEASE;
    }

    /**
     * Retrieve the Major Version
     */
    public byte getMajorVersion()
    {
        return MAJOR_VERSION;
    }

    /**
     * Retrieve the Revision
     */
    public byte getRevision()
    {
        return REVISION;
    }


    /**
     * @return  Cyclic Redundancy Check 32 Value
     */
    public int getCrc32()
    {
        return crc32;
    }

    /**
     * Creates a new empty ID3v2_3 datatype.
     */
    public ID3v23Tag()
    {
        frameMap = new LinkedHashMap();
        encryptedFrameMap = new LinkedHashMap();
    }

    /**
     * Copy primitives applicable to v2.3
     */
    protected void copyPrimitives(AbstractID3v2Tag copyObj)
    {
        logger.config("Copying primitives");
        super.copyPrimitives(copyObj);

        if (copyObj instanceof ID3v23Tag)
        {
            ID3v23Tag copyObject = (ID3v23Tag) copyObj;
            this.crcDataFlag = copyObject.crcDataFlag;
            this.experimental = copyObject.experimental;
            this.extended = copyObject.extended;
            this.crc32 = copyObject.crc32;
            this.paddingSize = copyObject.paddingSize;
        }
    }

    /**
     * Override to merge TIPL/TMCL into single IPLS frame
     *
     * @param newFrame
     * @param existingFrame
     */
    @Override
    protected void processDuplicateFrame(AbstractID3v2Frame newFrame, AbstractID3v2Frame existingFrame)
    {
        //We dont add this new frame we just add the contents to existing frame
        if(newFrame.getIdentifier().equals(ID3v23Frames.FRAME_ID_V3_INVOLVED_PEOPLE))
        {
            PairedTextEncodedStringNullTerminated.ValuePairs oldVps = ((FrameBodyIPLS)(existingFrame).getBody()).getPairing();
            PairedTextEncodedStringNullTerminated.ValuePairs newVps = ((FrameBodyIPLS)newFrame.getBody()).getPairing();
            for(Pair next:newVps.getMapping())
            {
                oldVps.add(next);
            }
        }
        else
        {
            List<AbstractID3v2Frame> list = new ArrayList<AbstractID3v2Frame>();
            list.add(existingFrame);
            list.add(newFrame);
            frameMap.put(newFrame.getIdentifier(), list);
        }
    }

    @Override
    public void addFrame(AbstractID3v2Frame frame)
    {
        try
        {
            if (frame instanceof ID3v23Frame)
            {
                copyFrameIntoMap(frame.getIdentifier(), frame);
            }
            else
            {
                List<AbstractID3v2Frame> frames = convertFrame(frame);
                for(AbstractID3v2Frame next:frames)
                {
                    copyFrameIntoMap(next.getIdentifier(), next);
                }
            }
        }
        catch (InvalidFrameException ife)
        {
            logger.log(Level.SEVERE, "Unable to convert frame:" + frame.getIdentifier());
        }
    }

    @Override
    protected List<AbstractID3v2Frame> convertFrame(AbstractID3v2Frame frame) throws InvalidFrameException
    {
        List<AbstractID3v2Frame> frames = new ArrayList<AbstractID3v2Frame>();
        if ((frame.getIdentifier().equals(ID3v24Frames.FRAME_ID_YEAR)) && (frame.getBody() instanceof FrameBodyTDRC))
        {
            //TODO will overwrite any existing TYER or TIME frame, do we ever want multiples of these
            FrameBodyTDRC tmpBody = (FrameBodyTDRC) frame.getBody();
            tmpBody.findMatchingMaskAndExtractV3Values();
            ID3v23Frame newFrame;
            if (!tmpBody.getYear().equals(""))
            {
                newFrame = new ID3v23Frame(ID3v23Frames.FRAME_ID_V3_TYER);
                ((FrameBodyTYER) newFrame.getBody()).setText(tmpBody.getYear());
                frames.add(newFrame);
            }
            if (!tmpBody.getDate().equals(""))
            {
                newFrame = new ID3v23Frame(ID3v23Frames.FRAME_ID_V3_TDAT);
                ((FrameBodyTDAT) newFrame.getBody()).setText(tmpBody.getDate());
                ((FrameBodyTDAT) newFrame.getBody()).setMonthOnly(tmpBody.isMonthOnly());
                frames.add(newFrame);
            }
            if (!tmpBody.getTime().equals(""))
            {
                newFrame = new ID3v23Frame(ID3v23Frames.FRAME_ID_V3_TIME);
                ((FrameBodyTIME) newFrame.getBody()).setText(tmpBody.getTime());
                ((FrameBodyTIME) newFrame.getBody()).setHoursOnly(tmpBody.isHoursOnly());
                frames.add(newFrame);
            }
        }
        //If at later stage we have multiple IPLS frames we have to merge
        else if ((frame.getIdentifier().equals(ID3v24Frames.FRAME_ID_INVOLVED_PEOPLE)) && (frame.getBody() instanceof FrameBodyTIPL))
        {
            List<Pair> pairs= ((FrameBodyTIPL)frame.getBody()).getPairing().getMapping();
            AbstractID3v2Frame ipls = new ID3v23Frame((ID3v24Frame)frame,ID3v23Frames.FRAME_ID_V3_INVOLVED_PEOPLE);
            FrameBodyIPLS iplsBody  = new FrameBodyIPLS(frame.getBody().getTextEncoding(),pairs);
            ipls.setBody(iplsBody);
            frames.add(ipls);
        }
        else if ((frame.getIdentifier().equals(ID3v24Frames.FRAME_ID_MUSICIAN_CREDITS)) && (frame.getBody() instanceof FrameBodyTMCL))
        {
            List<Pair> pairs= ((FrameBodyTMCL)frame.getBody()).getPairing().getMapping();
            AbstractID3v2Frame ipls = new ID3v23Frame((ID3v24Frame)frame,ID3v23Frames.FRAME_ID_V3_INVOLVED_PEOPLE);
            FrameBodyIPLS iplsBody  = new FrameBodyIPLS(frame.getBody().getTextEncoding(),pairs);
            ipls.setBody(iplsBody);
            frames.add(ipls);
        }
        else
        {
            frames.add(new ID3v23Frame(frame));
        }
        return frames;
    }

    /**
     * Copy Constructor, creates a new ID3v2_3 Tag based on another ID3v2_3 Tag
     * @param copyObject
     */
    public ID3v23Tag(ID3v23Tag copyObject)
    {
        //This doesn't do anything.
        super(copyObject);
        logger.config("Creating tag from another tag of same type");
        copyPrimitives(copyObject);
        copyFrames(copyObject);

    }

    /**
     * Constructs a new tag based upon another tag of different version/type
     * @param mp3tag
     */
    public ID3v23Tag(AbstractTag mp3tag)
    {
        logger.config("Creating tag from a tag of a different version");
        frameMap = new LinkedHashMap();
        encryptedFrameMap = new LinkedHashMap();

        if (mp3tag != null)
        {
            ID3v24Tag convertedTag;
            //Should use simpler copy constructor
            if (mp3tag instanceof ID3v23Tag)
            {
                throw new UnsupportedOperationException("Copy Constructor not called. Please type cast the argument");
            }
            if (mp3tag instanceof ID3v24Tag)
            {
                convertedTag = (ID3v24Tag) mp3tag;
            }
            //All tags types can be converted to v2.4 so do this to simplify things
            else
            {
                convertedTag = new ID3v24Tag(mp3tag);
            }
            this.setLoggingFilename(convertedTag.getLoggingFilename());
            //Copy Primitives
            copyPrimitives(convertedTag);
            //Copy Frames
            copyFrames(convertedTag);
            logger.config("Created tag from a tag of a different version");
        }
    }

    /**
     * Creates a new ID3v2_3 datatype.
     *
     * @param buffer
     * @param loggingFilename
     * @throws TagException
     */
    public ID3v23Tag(ByteBuffer buffer, String loggingFilename) throws TagException
    {
        setLoggingFilename(loggingFilename);
        this.read(buffer);
    }


    /**
     * Creates a new ID3v2_3 datatype.
     *
     * @param buffer
     * @throws TagException
     * @deprecated use {@link #ID3v23Tag(ByteBuffer,String)} instead
     */
    public ID3v23Tag(ByteBuffer buffer) throws TagException
    {
        this(buffer, "");
    }

    /**
     * @return textual tag identifier
     */
    public String getIdentifier()
    {
        return "ID3v2.30";
    }

    /**
     * Return frame size based upon the sizes of the tags rather than the physical
     * no of bytes between start of ID3Tag and start of Audio Data.
     *
     * TODO this is incorrect, because of subclasses
     *
     * @return size of tag
     */
    public int getSize()
    {
        int size = TAG_HEADER_LENGTH;
        if (extended)
        {
            size += TAG_EXT_HEADER_LENGTH;
            if (crcDataFlag)
            {
                size += TAG_EXT_HEADER_CRC_LENGTH;
            }
        }
        size += super.getSize();
        return size;
    }

    /**
     * Is Tag Equivalent to another tag
     *
     * @param obj
     * @return true if tag is equivalent to another
     */
    public boolean equals(Object obj)
    {
        if (!(obj instanceof ID3v23Tag))
        {
            return false;
        }
        ID3v23Tag object = (ID3v23Tag) obj;
        if (this.crc32 != object.crc32)
        {
            return false;
        }
        if (this.crcDataFlag != object.crcDataFlag)
        {
            return false;
        }
        if (this.experimental != object.experimental)
        {
            return false;
        }
        if (this.extended != object.extended)
        {
            return false;
        }
        return this.paddingSize == object.paddingSize && super.equals(obj);
    }



    /**
     * Read header flags
     *
     * <p>Log info messages for flags that have been set and log warnings when bits have been set for unknown flags
     * @param buffer
     * @throws TagException
     */
    private void readHeaderFlags(ByteBuffer buffer) throws TagException
    {
        //Allowable Flags
        byte flags = buffer.get();
        unsynchronization = (flags & MASK_V23_UNSYNCHRONIZATION) != 0;
        extended = (flags & MASK_V23_EXTENDED_HEADER) != 0;
        experimental = (flags & MASK_V23_EXPERIMENTAL) != 0;

        //Not allowable/Unknown Flags
        if ((flags & FileConstants.BIT4) != 0)
        {
            logger.warning(ErrorMessage.ID3_INVALID_OR_UNKNOWN_FLAG_SET.getMsg(getLoggingFilename(), FileConstants.BIT4));
        }

        if ((flags & FileConstants.BIT3) != 0)
        {
            logger.warning(ErrorMessage.ID3_INVALID_OR_UNKNOWN_FLAG_SET.getMsg(getLoggingFilename(), FileConstants.BIT3));
        }

        if ((flags & FileConstants.BIT2) != 0)
        {
            logger.warning(ErrorMessage.ID3_INVALID_OR_UNKNOWN_FLAG_SET.getMsg(getLoggingFilename(), FileConstants.BIT2));
        }

        if ((flags & FileConstants.BIT1) != 0)
        {
            logger.warning(ErrorMessage.ID3_INVALID_OR_UNKNOWN_FLAG_SET.getMsg(getLoggingFilename(), FileConstants.BIT1));
        }

        if ((flags & FileConstants.BIT0) != 0)
        {
            logger.warning(ErrorMessage.ID3_INVALID_OR_UNKNOWN_FLAG_SET.getMsg(getLoggingFilename(), FileConstants.BIT0));
        }

        if (isUnsynchronization())
        {
            logger.config(ErrorMessage.ID3_TAG_UNSYNCHRONIZED.getMsg(getLoggingFilename()));
        }

        if (extended)
        {
            logger.config(ErrorMessage.ID3_TAG_EXTENDED.getMsg(getLoggingFilename()));
        }

        if (experimental)
        {
            logger.config(ErrorMessage.ID3_TAG_EXPERIMENTAL.getMsg(getLoggingFilename()));
        }
    }

    /**
     * Read the optional extended header
     *
     * @param buffer
     * @param size
     */
    private void readExtendedHeader(ByteBuffer buffer, int size)
    {
        // Int is 4 bytes.
        int extendedHeaderSize = buffer.getInt();
        // Extended header without CRC Data
        if (extendedHeaderSize == TAG_EXT_HEADER_DATA_LENGTH)
        {
            //Flag should not be setField , if is log a warning
            byte extFlag = buffer.get();
            crcDataFlag = (extFlag & MASK_V23_CRC_DATA_PRESENT) != 0;
            if (crcDataFlag)
            {
                logger.warning(ErrorMessage.ID3_TAG_CRC_FLAG_SET_INCORRECTLY.getMsg(getLoggingFilename()));
            }
            //2nd Flag Byte (not used)
            buffer.get();

            //Take padding and ext header size off the size to be read
            paddingSize=buffer.getInt();
            if(paddingSize>0)
            {
                logger.config(ErrorMessage.ID3_TAG_PADDING_SIZE.getMsg(getLoggingFilename(),paddingSize));
            }
            size = size - ( paddingSize + TAG_EXT_HEADER_LENGTH);
        }
        else if (extendedHeaderSize == TAG_EXT_HEADER_DATA_LENGTH + TAG_EXT_HEADER_CRC_LENGTH)
        {
            logger.config(ErrorMessage.ID3_TAG_CRC.getMsg(getLoggingFilename()));

            //Flag should be setField, if nor just act as if it is
            byte extFlag = buffer.get();
            crcDataFlag = (extFlag & MASK_V23_CRC_DATA_PRESENT) != 0;
            if (!crcDataFlag)
            {
                logger.warning(ErrorMessage.ID3_TAG_CRC_FLAG_SET_INCORRECTLY.getMsg(getLoggingFilename()));
            }
            //2nd Flag Byte (not used)
            buffer.get();
            //Take padding size of size to be read
            paddingSize = buffer.getInt();
            if(paddingSize>0)
            {
                logger.config(ErrorMessage.ID3_TAG_PADDING_SIZE.getMsg(getLoggingFilename(),paddingSize));
            }
            size = size - (paddingSize + TAG_EXT_HEADER_LENGTH + TAG_EXT_HEADER_CRC_LENGTH);
            //CRC Data
            crc32 = buffer.getInt();
            logger.config(ErrorMessage.ID3_TAG_CRC_SIZE.getMsg(getLoggingFilename(),crc32));
        }
        //Extended header size is only allowed to be six or ten bytes so this is invalid but instead
        //of giving up lets guess its six bytes and carry on and see if we can read file ok
        else
        {
            logger.warning(ErrorMessage.ID3_EXTENDED_HEADER_SIZE_INVALID.getMsg(getLoggingFilename(), extendedHeaderSize));
            buffer.position(buffer.position() - FIELD_TAG_EXT_SIZE_LENGTH);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void read(ByteBuffer buffer) throws TagException
    {
        int size;
        if (!seek(buffer))
        {
            throw new TagNotFoundException(getIdentifier() + " tag not found");
        }
        logger.config(getLoggingFilename() + ":" + "Reading ID3v23 tag");

        readHeaderFlags(buffer);

        // Read the size, this is size of tag not including the tag header
        size = ID3SyncSafeInteger.bufferToValue(buffer);
        logger.config(ErrorMessage.ID_TAG_SIZE.getMsg(getLoggingFilename(),size));

        //Extended Header
        if (extended)
        {
            readExtendedHeader(buffer, size);
        }

        //Slice Buffer, so position markers tally with size (i.e do not include tagHeader)
        ByteBuffer bufferWithoutHeader = buffer.slice();
        //We need to synchronize the buffer
        if (isUnsynchronization())
        {
            bufferWithoutHeader = ID3Unsynchronization.synchronize(bufferWithoutHeader);
        }

        readFrames(bufferWithoutHeader, size);
        logger.config(getLoggingFilename() + ":Loaded Frames,there are:" + frameMap.keySet().size());

    }


    /**
     * Read the frames
     *
     * Read from byteBuffer upto size
     *
     * @param byteBuffer
     * @param size
     */
    protected void readFrames(ByteBuffer byteBuffer, int size)
    {
        //Now start looking for frames
        ID3v23Frame next;
        frameMap = new LinkedHashMap();
        encryptedFrameMap = new LinkedHashMap();


        //Read the size from the Tag Header
        this.fileReadSize = size;
        logger.finest(getLoggingFilename() + ":Start of frame body at:" + byteBuffer.position() + ",frames data size is:" + size);

        // Read the frames until got to up to the size as specified in header or until
        // we hit an invalid frame identifier or padding
        while (byteBuffer.position() < size)
        {
            String id;
            try
            {
                //Read Frame
                int posBeforeRead = byteBuffer.position();
                logger.config(getLoggingFilename() + ":Looking for next frame at:" + posBeforeRead);
                next = new ID3v23Frame(byteBuffer, getLoggingFilename());
                id = next.getIdentifier();
                logger.config(getLoggingFilename() + ":Found "+ id+ " at frame at:" + posBeforeRead);
                loadFrameIntoMap(id, next);
            }
            //Found Padding, no more frames
            catch (PaddingException ex)
            {
                logger.config(getLoggingFilename() + ":Found padding starting at:" + byteBuffer.position());
                break;
            }
            //Found Empty Frame, log it - empty frames should not exist
            catch (EmptyFrameException ex)
            {
                logger.warning(getLoggingFilename() + ":Empty Frame:" + ex.getMessage());
                this.emptyFrameBytes += ID3v23Frame.FRAME_HEADER_SIZE;
            }
            catch (InvalidFrameIdentifierException ifie)
            {
                logger.warning(getLoggingFilename() + ":Invalid Frame Identifier:" + ifie.getMessage());
                this.invalidFrames++;
                //Don't try and find any more frames
                break;
            }
            //Problem trying to find frame, often just occurs because frameHeader includes padding
            //and we have reached padding
            catch (InvalidFrameException ife)
            {
                logger.warning(getLoggingFilename() + ":Invalid Frame:" + ife.getMessage());
                this.invalidFrames++;
                //Don't try and find any more frames
                break;
            }
            //Failed reading frame but may just have invalid data but correct length so lets carry on
            //in case we can read the next frame
            catch(InvalidDataTypeException idete)
            {
                logger.warning(getLoggingFilename() + ":Corrupt Frame:" + idete.getMessage());
                this.invalidFrames++;
                continue;
            }
        }
    }

    /**
     * Write the ID3 header to the ByteBuffer.
     *
     * TODO Calculate the CYC Data Check
     * TODO Reintroduce Extended Header
     *
     * @param padding is the size of the padding portion of the tag
     * @param size    is the size of the body data
     * @return ByteBuffer
     * @throws IOException
     */
    private ByteBuffer writeHeaderToBuffer(int padding, int size) throws IOException
    {
        // Flags,currently we never calculate the CRC
        // and if we dont calculate them cant keep orig values. Tags are not
        // experimental and we never createField extended header to keep things simple.
        extended = false;
        experimental = false;
        crcDataFlag = false;

        // Create Header Buffer,allocate maximum possible size for the header
        ByteBuffer headerBuffer = ByteBuffer.
                allocate(TAG_HEADER_LENGTH + TAG_EXT_HEADER_LENGTH + TAG_EXT_HEADER_CRC_LENGTH);

        //TAGID
        headerBuffer.put(TAG_ID);

        //Major Version
        headerBuffer.put(getMajorVersion());

        //Minor Version
        headerBuffer.put(getRevision());

        //Flags
        byte flagsByte = 0;
        if (isUnsynchronization())
        {
            flagsByte |= MASK_V23_UNSYNCHRONIZATION;
        }
        if (extended)
        {
            flagsByte |= MASK_V23_EXTENDED_HEADER;
        }
        if (experimental)
        {
            flagsByte |= MASK_V23_EXPERIMENTAL;
        }
        headerBuffer.put(flagsByte);

        //Additional Header Size,(for completeness we never actually write the extended header)
        int additionalHeaderSize = 0;
        if (extended)
        {
            additionalHeaderSize += TAG_EXT_HEADER_LENGTH;
            if (crcDataFlag)
            {
                additionalHeaderSize += TAG_EXT_HEADER_CRC_LENGTH;
            }
        }

        //Size As Recorded in Header, don't include the main header length
        headerBuffer.put(ID3SyncSafeInteger.valueToBuffer(padding + size + additionalHeaderSize));

        //Write Extended Header
        if (extended)
        {
            byte extFlagsByte1 = 0;
            byte extFlagsByte2 = 0;

            //Contains CRCData
            if (crcDataFlag)
            {
                headerBuffer.putInt(TAG_EXT_HEADER_DATA_LENGTH + TAG_EXT_HEADER_CRC_LENGTH);
                extFlagsByte1 |= MASK_V23_CRC_DATA_PRESENT;
                headerBuffer.put(extFlagsByte1);
                headerBuffer.put(extFlagsByte2);
                headerBuffer.putInt(paddingSize);
                headerBuffer.putInt(crc32);
            }
            //Just extended Header
            else
            {
                headerBuffer.putInt(TAG_EXT_HEADER_DATA_LENGTH);
                headerBuffer.put(extFlagsByte1);
                headerBuffer.put(extFlagsByte2);
                //Newly Calculated Padding As Recorded in Extended Header
                headerBuffer.putInt(padding);
            }
        }

        headerBuffer.flip();
        return headerBuffer;
    }


    /**
     * Write tag to file
     *
     * TODO:we currently never write the Extended header , but if we did the size calculation in this
     * method would be slightly incorrect
     *
     * @param file The file to write to
     * @throws IOException
     */
    public long write(File file, long audioStartLocation) throws IOException
    {
        setLoggingFilename(file.getName());
        logger.config("Writing tag to file:"+getLoggingFilename());

        //Write Body Buffer
        byte[] bodyByteBuffer = writeFramesToBuffer().toByteArray();
        logger.config(getLoggingFilename() + ":bodybytebuffer:sizebeforeunsynchronisation:" + bodyByteBuffer.length);

        // Unsynchronize if option enabled and unsync required
        unsynchronization = TagOptionSingleton.getInstance().isUnsyncTags() && ID3Unsynchronization.requiresUnsynchronization(bodyByteBuffer);
        if (isUnsynchronization())
        {
            bodyByteBuffer = ID3Unsynchronization.unsynchronize(bodyByteBuffer);
            logger.config(getLoggingFilename() + ":bodybytebuffer:sizeafterunsynchronisation:" + bodyByteBuffer.length);
        }

        int sizeIncPadding = calculateTagSize(bodyByteBuffer.length + TAG_HEADER_LENGTH, (int) audioStartLocation);
        int padding = sizeIncPadding - (bodyByteBuffer.length + TAG_HEADER_LENGTH);
        logger.config(getLoggingFilename() + ":Current audiostart:" + audioStartLocation);
        logger.config(getLoggingFilename() + ":Size including padding:" + sizeIncPadding);
        logger.config(getLoggingFilename() + ":Padding:" + padding);

        ByteBuffer headerBuffer = writeHeaderToBuffer(padding, bodyByteBuffer.length);
        writeBufferToFile(file, headerBuffer, bodyByteBuffer, padding, sizeIncPadding, audioStartLocation);
        return sizeIncPadding;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void write(WritableByteChannel channel, int currentTagSize) throws IOException
    {
        logger.config(getLoggingFilename() + ":Writing tag to channel");

        byte[] bodyByteBuffer = writeFramesToBuffer().toByteArray();
        logger.config(getLoggingFilename() + ":bodybytebuffer:sizebeforeunsynchronisation:" + bodyByteBuffer.length);

        // Unsynchronize if option enabled and unsync required
        unsynchronization = TagOptionSingleton.getInstance().isUnsyncTags() && ID3Unsynchronization.requiresUnsynchronization(bodyByteBuffer);
        if (isUnsynchronization())
        {
            bodyByteBuffer = ID3Unsynchronization.unsynchronize(bodyByteBuffer);
            logger.config(getLoggingFilename() + ":bodybytebuffer:sizeafterunsynchronisation:" + bodyByteBuffer.length);
        }

        int padding = 0;
        if(currentTagSize > 0)
        {
            int sizeIncPadding = calculateTagSize(bodyByteBuffer.length + TAG_HEADER_LENGTH, (int) currentTagSize);
            padding = sizeIncPadding - (bodyByteBuffer.length + TAG_HEADER_LENGTH);
            logger.config(getLoggingFilename() + ":Padding:"+padding);
        }
        ByteBuffer headerBuffer = writeHeaderToBuffer(padding, bodyByteBuffer.length);

        channel.write(headerBuffer);
        channel.write(ByteBuffer.wrap(bodyByteBuffer));
        writePadding(channel, padding);
    }


    /**
     * For representing the MP3File in an XML Format
     */
    public void createStructure()
    {

        MP3File.getStructureFormatter().openHeadingElement(TYPE_TAG, getIdentifier());

        super.createStructureHeader();

        //Header
        MP3File.getStructureFormatter().openHeadingElement(TYPE_HEADER, "");
        MP3File.getStructureFormatter().addElement(TYPE_UNSYNCHRONISATION, this.isUnsynchronization());
        MP3File.getStructureFormatter().addElement(TYPE_EXTENDED, this.extended);
        MP3File.getStructureFormatter().addElement(TYPE_EXPERIMENTAL, this.experimental);
        MP3File.getStructureFormatter().addElement(TYPE_CRCDATA, this.crc32);
        MP3File.getStructureFormatter().addElement(TYPE_PADDINGSIZE, this.paddingSize);
        MP3File.getStructureFormatter().closeHeadingElement(TYPE_HEADER);
        //Body
        super.createStructureBody();
        MP3File.getStructureFormatter().closeHeadingElement(TYPE_TAG);
    }

    /**
     * @return is tag unsynchronized
     */
    public boolean isUnsynchronization()
    {
        return unsynchronization;
    }

    public ID3v23Frame createFrame(String id)
    {
        return new ID3v23Frame(id);
    }


    /**
     * Create Frame for Id3 Key
     *
     * Only textual data supported at the moment, should only be used with frames that
     * support a simple string argument.
     *
     * @param id3Key
     * @param value
     * @return
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    public TagField createField(ID3v23FieldKey id3Key, String value) throws KeyNotFoundException, FieldDataInvalidException
    {
        if (id3Key == null)
        {
            throw new KeyNotFoundException();
        }
        return super.doCreateTagField(new FrameAndSubId(null, id3Key.getFrameId(), id3Key.getSubId()), value);
    }

    /**
     * Retrieve the first value that exists for this id3v23key
     *
     * @param id3v23FieldKey
     * @return
     * @throws org.jaudiotagger.tag.KeyNotFoundException
     */
    public String getFirst(ID3v23FieldKey id3v23FieldKey) throws KeyNotFoundException
    {
        if (id3v23FieldKey == null)
        {
            throw new KeyNotFoundException();
        }

        FieldKey genericKey = ID3v23Frames.getInstanceOf().getGenericKeyFromId3(id3v23FieldKey);
        if(genericKey!=null)
        {
            return super.getFirst(genericKey);
        }
        else
        {
            FrameAndSubId frameAndSubId = new FrameAndSubId(null, id3v23FieldKey.getFrameId(), id3v23FieldKey.getSubId());
            return super.doGetValueAtIndex(frameAndSubId, 0);
        }
    }

    /**
     * Delete fields with this id3v23FieldKey
     *
     * @param id3v23FieldKey
     * @throws org.jaudiotagger.tag.KeyNotFoundException
     */
    public void deleteField(ID3v23FieldKey id3v23FieldKey) throws KeyNotFoundException
    {
        if (id3v23FieldKey == null)
        {
            throw new KeyNotFoundException();
        }
        super.doDeleteTagField(new FrameAndSubId(null, id3v23FieldKey.getFrameId(), id3v23FieldKey.getSubId()));
    }

     /**
     * Delete fields with this (frame) id
     * @param id
     */
    public void deleteField(String id)
    {
        super.doDeleteTagField(new FrameAndSubId(null, id,null));
    }

    protected FrameAndSubId getFrameAndSubIdFromGenericKey(FieldKey genericKey)
    {
        if (genericKey == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        ID3v23FieldKey id3v23FieldKey = ID3v23Frames.getInstanceOf().getId3KeyFromGenericKey(genericKey);
        if (id3v23FieldKey == null)
        {
            throw new KeyNotFoundException(genericKey.name());
        }
        return new FrameAndSubId(genericKey, id3v23FieldKey.getFrameId(), id3v23FieldKey.getSubId());
    }

    protected ID3Frames getID3Frames()
    {
        return ID3v23Frames.getInstanceOf();
    }

    /**
     * @return comparator used to order frames in preferred order for writing to file
     *         so that most important frames are written first.
     */
    public Comparator getPreferredFrameOrderComparator()
    {
        return ID3v23PreferredFrameOrderComparator.getInstanceof();
    }

    /**
     * {@inheritDoc}
     */
    public List<Artwork> getArtworkList()
    {
        List<TagField> coverartList = getFields(FieldKey.COVER_ART);
        List<Artwork> artworkList = new ArrayList<Artwork>(coverartList.size());

        for (TagField next : coverartList)
        {
            FrameBodyAPIC coverArt = (FrameBodyAPIC) ((AbstractID3v2Frame) next).getBody();
            Artwork artwork = ArtworkFactory.getNew();
            artwork.setMimeType(coverArt.getMimeType());
            artwork.setPictureType(coverArt.getPictureType());
            if (coverArt.isImageUrl())
            {
                artwork.setLinked(true);
                artwork.setImageUrl(coverArt.getImageUrl());
            }
            else
            {
                artwork.setBinaryData(coverArt.getImageData());
            }
            artworkList.add(artwork);
        }
        return artworkList;
    }

    /**
     * {@inheritDoc}
     */    
    public TagField createField(Artwork artwork) throws FieldDataInvalidException
    {
        AbstractID3v2Frame frame = createFrame(getFrameAndSubIdFromGenericKey(FieldKey.COVER_ART).getFrameId());
        FrameBodyAPIC body = (FrameBodyAPIC) frame.getBody();
        if(!artwork.isLinked())
        {
            body.setObjectValue(DataTypes.OBJ_PICTURE_DATA, artwork.getBinaryData());
            body.setObjectValue(DataTypes.OBJ_PICTURE_TYPE, artwork.getPictureType());
            body.setObjectValue(DataTypes.OBJ_MIME_TYPE, artwork.getMimeType());
            body.setObjectValue(DataTypes.OBJ_DESCRIPTION, "");
            return frame;
        }
        else
        {
            try
            {
                body.setObjectValue(DataTypes.OBJ_PICTURE_DATA,artwork.getImageUrl().getBytes("ISO-8859-1"));
            }
            catch(UnsupportedEncodingException uoe)
            {
                throw new RuntimeException(uoe.getMessage());
            }
            body.setObjectValue(DataTypes.OBJ_PICTURE_TYPE, artwork.getPictureType());
            body.setObjectValue(DataTypes.OBJ_MIME_TYPE, FrameBodyAPIC.IMAGE_IS_URL);
            body.setObjectValue(DataTypes.OBJ_DESCRIPTION, "");
            return frame;
        }
    }

    /**
     * Create Artwork
     *
     * @param data
     * @param mimeType of the image
     * @see PictureTypes
     * @return
     */
    public TagField createArtworkField(byte[] data, String mimeType)
    {
        AbstractID3v2Frame frame = createFrame(getFrameAndSubIdFromGenericKey(FieldKey.COVER_ART).getFrameId());
        FrameBodyAPIC body = (FrameBodyAPIC) frame.getBody();

        body.setObjectValue(DataTypes.OBJ_PICTURE_DATA, data);
        body.setObjectValue(DataTypes.OBJ_PICTURE_TYPE, PictureTypes.DEFAULT_ID);
        body.setObjectValue(DataTypes.OBJ_MIME_TYPE, mimeType);
        body.setObjectValue(DataTypes.OBJ_DESCRIPTION, "");
        return frame;
    }

    public int getPaddingSize()
    {
        return paddingSize;
    }

    /**
     * Overridden to allow special handling for mapping YEAR to TYER and TDAT Frames
     *
     * @param genericKey is the generic key
     * @param values      to store
     * @return
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    @Override
    public TagField createField(FieldKey genericKey, String... values) throws KeyNotFoundException, FieldDataInvalidException
    {
        if (genericKey == null)
        {
            throw new KeyNotFoundException();
        }

        if (values == null || values[0] == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }

        String value = values[0];
        if (genericKey == FieldKey.GENRE)
        {
            if (value == null)
            {
                throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
            }
            FrameAndSubId formatKey = getFrameAndSubIdFromGenericKey(genericKey);
            AbstractID3v2Frame frame = createFrame(formatKey.getFrameId());
            FrameBodyTCON framebody = (FrameBodyTCON) frame.getBody();
            framebody.setV23Format();

            if(TagOptionSingleton.getInstance().isWriteMp3GenresAsText())
            {
                framebody.setText(value);
            }
            else
            {
                framebody.setText(FrameBodyTCON.convertGenericToID3v23Genre(value));
            }
            return frame;
        }
        else if (genericKey == FieldKey.YEAR)
        {
            if(value.length()==1)
            {
                AbstractID3v2Frame tyer = createFrame(ID3v23Frames.FRAME_ID_V3_TYER);
                ((AbstractFrameBodyTextInfo) tyer.getBody()).setText("000" + value);
                return tyer;
            }
            else if(value.length()==2)
            {
                AbstractID3v2Frame tyer = createFrame(ID3v23Frames.FRAME_ID_V3_TYER);
                ((AbstractFrameBodyTextInfo) tyer.getBody()).setText("00" + value);
                return tyer;
            }
            else if(value.length()==3)
            {
                AbstractID3v2Frame tyer = createFrame(ID3v23Frames.FRAME_ID_V3_TYER);
                ((AbstractFrameBodyTextInfo) tyer.getBody()).setText("0" + value);
                return tyer;
            }
            else if(value.length()==4)
            {
                AbstractID3v2Frame tyer = createFrame(ID3v23Frames.FRAME_ID_V3_TYER);
                ((AbstractFrameBodyTextInfo) tyer.getBody()).setText(value);
                return tyer;
            }
            else if(value.length()> 4)
            {
                AbstractID3v2Frame tyer = createFrame(ID3v23Frames.FRAME_ID_V3_TYER);
                ((AbstractFrameBodyTextInfo) tyer.getBody()).setText(value.substring(0, 4));

                if(value.length() >= 10)
                {
                    //Have a full yyyy-mm-dd value that needs storing in two frames in ID3
                    String month = value.substring(5,7);
                    String day   = value.substring(8,10);
                    AbstractID3v2Frame tdat = createFrame(ID3v23Frames.FRAME_ID_V3_TDAT);
                    ((AbstractFrameBodyTextInfo) tdat.getBody()).setText(day+month);

                    TyerTdatAggregatedFrame ag = new TyerTdatAggregatedFrame();
                    ag.addFrame(tyer);
                    ag.addFrame(tdat);
                    return ag;
                }
                else if(value.length() >= 7)
                {
                    //TDAT frame requires both month and day so if we only have the month we just have to make
                    //the day up
                    String month = value.substring(5,7);
                    String day   = "01";
                    AbstractID3v2Frame tdat = createFrame(ID3v23Frames.FRAME_ID_V3_TDAT);
                    ((AbstractFrameBodyTextInfo) tdat.getBody()).setText(day+month);

                    TyerTdatAggregatedFrame ag = new TyerTdatAggregatedFrame();
                    ag.addFrame(tyer);
                    ag.addFrame(tdat);
                    return ag;
                }
                else
                {
                    //We only have year data
                    return tyer;
                }
            }
            else
            {
                return null;
            }
        }
        else
        {
            return super.createField(genericKey, values);
        }
    }

    /**
     *
     * @param genericKey
     * @param index
     * @return
     * @throws KeyNotFoundException
     */
    @Override
    public String getValue(FieldKey genericKey, int index) throws KeyNotFoundException
    {
        if (genericKey == null)
        {
            throw new KeyNotFoundException();
        }

        if(genericKey == FieldKey.YEAR)
        {
            AggregatedFrame af = (AggregatedFrame)getFrame(TyerTdatAggregatedFrame.ID_TYER_TDAT);
            if(af!=null)
            {
                return af.getContent();
            }
            else
            {
                return super.getValue(genericKey, index);
            }
        }
        else if(genericKey == FieldKey.GENRE)
        {
            List<TagField> fields = getFields(genericKey);
            if (fields != null && fields.size() > 0)
            {
                AbstractID3v2Frame frame = (AbstractID3v2Frame) fields.get(0);
                FrameBodyTCON body = (FrameBodyTCON)frame.getBody();
                return FrameBodyTCON.convertID3v23GenreToGeneric(body.getValues().get(index));
            }
            return "";
        }
        else
        {
            return super.getValue(genericKey, index);
        }
    }

    protected void loadFrameIntoMap(String frameId, AbstractID3v2Frame next)
    {
        if (next.getBody() instanceof FrameBodyTCON)
        {
            ((FrameBodyTCON)next.getBody()).setV23Format();
        }
        super.loadFrameIntoMap(frameId, next);
    }

    protected void loadFrameIntoSpecifiedMap(HashMap map, String frameId, AbstractID3v2Frame frame)
    {
        if(!(frameId.equals(ID3v23Frames.FRAME_ID_V3_TYER)) && !(frameId.equals(ID3v23Frames.FRAME_ID_V3_TDAT)))
        {
            super.loadFrameIntoSpecifiedMap(map, frameId, frame);
            return;
        }

        if(frameId.equals(ID3v23Frames.FRAME_ID_V3_TDAT))
        {
            if(frame.getContent().length()==0)
            {
                //Discard not useful to complicate by trying to map it
                logger.warning("TDAT is empty so just ignoring");
                return;
            }
        }
        if (map.containsKey(frameId) || map.containsKey(TyerTdatAggregatedFrame.ID_TYER_TDAT))
        {
            //If we have multiple duplicate frames in a tag separate them with semicolons
            if (this.duplicateFrameId.length() > 0)
            {
                this.duplicateFrameId += ";";
            }
            this.duplicateFrameId += frameId;
            this.duplicateBytes += frame.getSize();
        }
        else if(frameId.equals(ID3v23Frames.FRAME_ID_V3_TYER))
        {
            if (map.containsKey(ID3v23Frames.FRAME_ID_V3_TDAT))
            {
                TyerTdatAggregatedFrame ag = new TyerTdatAggregatedFrame();
                ag.addFrame(frame);
                ag.addFrame((AbstractID3v2Frame)map.get(ID3v23Frames.FRAME_ID_V3_TDAT));
                map.remove(ID3v23Frames.FRAME_ID_V3_TDAT);
                map.put(TyerTdatAggregatedFrame.ID_TYER_TDAT, ag);
            }
            else
            {
                map.put(ID3v23Frames.FRAME_ID_V3_TYER, frame);
            }
        }
        else if(frameId.equals(ID3v23Frames.FRAME_ID_V3_TDAT))
        {
            if (map.containsKey(ID3v23Frames.FRAME_ID_V3_TYER))
            {
                TyerTdatAggregatedFrame ag = new TyerTdatAggregatedFrame();
                ag.addFrame((AbstractID3v2Frame)map.get(ID3v23Frames.FRAME_ID_V3_TYER));
                ag.addFrame(frame);
                map.remove(ID3v23Frames.FRAME_ID_V3_TYER);
                map.put(TyerTdatAggregatedFrame.ID_TYER_TDAT, ag);
            }
            else
            {
                map.put(ID3v23Frames.FRAME_ID_V3_TDAT, frame);
            }
        }

    }

    /**
     * Overridden because GENRE can need converting of data to ID3v23 format and
     * YEAR key is specially processed by getFields() for ID3
     *
     * @param genericKey
     * @return
     * @throws KeyNotFoundException
     */
    @Override
    public List<String> getAll(FieldKey genericKey) throws KeyNotFoundException
    {
        if(genericKey == FieldKey.GENRE)
        {
            List<TagField> fields = getFields(genericKey);
            List<String> convertedGenres = new ArrayList<String>();
            if (fields != null && fields.size() > 0)
            {
                AbstractID3v2Frame frame = (AbstractID3v2Frame) fields.get(0);
                FrameBodyTCON body = (FrameBodyTCON)frame.getBody();

                for(String next:body.getValues())
                {
                    convertedGenres.add(FrameBodyTCON.convertID3v23GenreToGeneric(next));
                }
            }
            return convertedGenres;
        }
        else if(genericKey == FieldKey.YEAR)
        {
            List<TagField> fields = getFields(genericKey);
            List<String> results = new ArrayList<String>();
            if (fields != null && fields.size() > 0)
            {
                for(TagField next:fields)
                {
                    if(next instanceof TagTextField)
                    {
                        results.add(((TagTextField)next).getContent());
                    }
                }
            }
            return results;
        }
        else
        {
            return super.getAll(genericKey);
        }
    }

    /**
     * Overridden because YEAR key can be served by TDAT, TYER or special aggreagted frame
     *
     * @param genericKey
     * @return
     * @throws KeyNotFoundException
     */
    @Override
    public List<TagField> getFields(FieldKey genericKey) throws KeyNotFoundException
    {
        if (genericKey == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }

        if(genericKey == FieldKey.YEAR)
        {
            AggregatedFrame af = (AggregatedFrame)getFrame(TyerTdatAggregatedFrame.ID_TYER_TDAT);
            if(af!=null)
            {
                List<TagField> list = new ArrayList<TagField>();
                list.add(af);
                return list;
            }
            else
            {
                return super.getFields(genericKey);
            }
        }
        else
        {
            return super.getFields(genericKey);
        }
    }

}
