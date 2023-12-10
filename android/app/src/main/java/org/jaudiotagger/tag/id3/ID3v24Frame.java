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
 *  you can get a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
package org.jaudiotagger.tag.id3;

import org.jaudiotagger.FileConstants;
import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.mp3.MP3File;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.logging.Hex;
import org.jaudiotagger.tag.*;
import org.jaudiotagger.tag.datatype.Lyrics3Line;
import org.jaudiotagger.tag.id3.framebody.*;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;
import org.jaudiotagger.tag.lyrics3.*;
import org.jaudiotagger.utils.EqualsUtil;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.Iterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Represents an ID3v2.4 frame.
 *
 * @author : Paul Taylor
 * @author : Eric Farng
 * @version $Id$
 */
public class ID3v24Frame extends AbstractID3v2Frame
{
    private static Pattern validFrameIdentifier = Pattern.compile("[A-Z][0-9A-Z]{3}");

    protected static final int FRAME_DATA_LENGTH_SIZE = 4;

    protected static final int FRAME_ID_SIZE = 4;
    protected static final int FRAME_FLAGS_SIZE = 2;
    protected static final int FRAME_SIZE_SIZE = 4;
    protected static final int FRAME_ENCRYPTION_INDICATOR_SIZE = 1;
    protected static final int FRAME_GROUPING_INDICATOR_SIZE = 1;

    protected static final int FRAME_HEADER_SIZE = FRAME_ID_SIZE + FRAME_SIZE_SIZE + FRAME_FLAGS_SIZE;

    /**
     * If the frame is encrypted then the encryption method is stored in this byte
     */
    private int encryptionMethod;

    /**
     * If the frame belongs in a group with other frames then the group identifier byte is stored
     */
    private int groupIdentifier;

    protected int getFrameIdSize()
    {
        return FRAME_ID_SIZE;
    }

    protected int getFrameSizeSize()
    {
        return FRAME_SIZE_SIZE;
    }

    protected int getFrameFlagsSize()
    {
        return FRAME_FLAGS_SIZE;
    }

    protected int getFrameHeaderSize()
    {
        return FRAME_HEADER_SIZE;
    }


    public ID3v24Frame()
    {
    }

    /**
     * Creates a new ID3v2_4Frame of type identifier. An empty
     * body of the correct type will be automatically created.
     * This constructor should be used when wish to create a new
     * frame from scratch using user input
     *
     * @param identifier defines the type of body to be created
     */
    public ID3v24Frame(String identifier)
    {
        //Super Constructor creates a frame with empty body of type specified
        super(identifier);
        statusFlags = new StatusFlags();
        encodingFlags = new EncodingFlags();

    }

    /**
     * Copy Constructor:Creates a new ID3v24 frame datatype based on another frame.
     *
     * @param frame
     */
    public ID3v24Frame(ID3v24Frame frame)
    {
        super(frame);
        statusFlags = new StatusFlags(frame.getStatusFlags().getOriginalFlags());
        encodingFlags = new EncodingFlags(frame.getEncodingFlags().getFlags());
    }

    private void createV24FrameFromV23Frame(ID3v23Frame frame) throws InvalidFrameException
    {
        // Is it a straight conversion e.g TALB - TALB
        identifier = ID3Tags.convertFrameID23To24(frame.getIdentifier());
        logger.finer("Creating V24frame from v23:" + frame.getIdentifier() + ":" + identifier);


        //We cant convert unsupported bodies properly
        if (frame.getBody() instanceof FrameBodyUnsupported)
        {
            this.frameBody = new FrameBodyUnsupported((FrameBodyUnsupported) frame.getBody());
            this.frameBody.setHeader(this);
            identifier = frame.getIdentifier();
            logger.finer("V3:UnsupportedBody:Orig id is:" + frame.getIdentifier() + ":New id is:" + identifier);
        }//Simple Copy
        else if (identifier != null)
        {
            //Special Case
            if ((frame.getIdentifier().equals(ID3v23Frames.FRAME_ID_V3_USER_DEFINED_INFO)) && (((FrameBodyTXXX) frame.getBody()).getDescription().equals(FrameBodyTXXX.MOOD)))
            {
                this.frameBody = new FrameBodyTMOO((FrameBodyTXXX) frame.getBody());
                this.frameBody.setHeader(this);
                identifier = frameBody.getIdentifier();
            }
            else
            {
                logger.finer("V3:Orig id is:" + frame.getIdentifier() + ":New id is:" + identifier);
                this.frameBody = (AbstractTagFrameBody) ID3Tags.copyObject(frame.getBody());
                this.frameBody.setHeader(this);
            }
        }
        // Is it a known v3 frame which needs forcing to v4 frame e.g. TYER - TDRC
        else if (ID3Tags.isID3v23FrameIdentifier(frame.getIdentifier()))
        {
            identifier = ID3Tags.forceFrameID23To24(frame.getIdentifier());
            if (identifier != null)
            {
                logger.config("V3:Orig id is:" + frame.getIdentifier() + ":New id is:" + identifier);
                this.frameBody = this.readBody(identifier, (AbstractID3v2FrameBody) frame.getBody());
                this.frameBody.setHeader(this);
            }
            // No mechanism exists to convert it to a v24 frame, e.g deprecated frame e.g TSIZ, so hold
            // as a deprecated frame consisting of an array of bytes*/
            else
            {
                this.frameBody = new FrameBodyDeprecated((AbstractID3v2FrameBody) frame.getBody());
                this.frameBody.setHeader(this);
                identifier = frame.getIdentifier();
                logger.finer("V3:Deprecated:Orig id is:" + frame.getIdentifier() + ":New id is:" + identifier);
            }
        }
        // Unknown Frame e.g NCON or TDRL (because TDRL unknown to V23)
        else
        {
            this.frameBody = new FrameBodyUnsupported((FrameBodyUnsupported) frame.getBody());
            this.frameBody.setHeader(this);
            identifier = frame.getIdentifier();
            logger.finer("V3:Unknown:Orig id is:" + frame.getIdentifier() + ":New id is:" + identifier);
        }
    }

    /**
     * Partially construct ID3v24 Frame form an IS3v23Frame
     *
     * Used for Special Cases
     *
     * @param frame
     * @param identifier
     * @throws InvalidFrameException
     */
    protected ID3v24Frame(ID3v23Frame frame, String identifier) throws InvalidFrameException
    {
        this.identifier=identifier;
        statusFlags = new StatusFlags((ID3v23Frame.StatusFlags) frame.getStatusFlags());
        encodingFlags = new EncodingFlags(frame.getEncodingFlags().getFlags());
    }

    /**
     * Creates a new ID3v24 frame datatype based on another frame of different version
     * Converts the framebody to the equivalent v24 framebody or to UnsupportedFrameBody if identifier
     * is unknown.
     *
     * @param frame to construct a new frame from
     * @throws org.jaudiotagger.tag.InvalidFrameException
     *
     */
    public ID3v24Frame(AbstractID3v2Frame frame) throws InvalidFrameException
    {
        //Should not be called
        if ((frame instanceof ID3v24Frame))
        {
            throw new UnsupportedOperationException("Copy Constructor not called. Please type cast the argument");
        }
        else if (frame instanceof ID3v23Frame)
        {
            statusFlags = new StatusFlags((ID3v23Frame.StatusFlags) frame.getStatusFlags());
            encodingFlags = new EncodingFlags(frame.getEncodingFlags().getFlags());
        }
        else if (frame instanceof ID3v22Frame)
        {
            statusFlags = new StatusFlags();
            encodingFlags = new EncodingFlags();
        }

        // Convert Identifier. If the id was a known id for the original
        // version we should be able to convert it to an v24 frame, although it may mean minor
        // modification to the data. If it was not recognised originally it should remain
        // unknown.
        if (frame instanceof ID3v23Frame)
        {
            createV24FrameFromV23Frame((ID3v23Frame) frame);
        }
        else if (frame instanceof ID3v22Frame)
        {
            ID3v23Frame v23Frame = new ID3v23Frame(frame);
            createV24FrameFromV23Frame(v23Frame);
        }
        this.frameBody.setHeader(this);
    }



    /**
     * Creates a new ID3v2_4Frame datatype based on Lyrics3.
     *
     * @param field
     * @throws InvalidTagException
     */
    public ID3v24Frame(Lyrics3v2Field field) throws InvalidTagException
    {
        String id = field.getIdentifier();
        String value;
        if (id.equals("IND"))
        {
            throw new InvalidTagException("Cannot create ID3v2.40 frame from Lyrics3 indications field.");
        }
        else if (id.equals("LYR"))
        {
            FieldFrameBodyLYR lyric = (FieldFrameBodyLYR) field.getBody();
            Lyrics3Line line;
            Iterator<Lyrics3Line> iterator = lyric.iterator();
            FrameBodySYLT sync;
            FrameBodyUSLT unsync;
            boolean hasTimeStamp = lyric.hasTimeStamp();
            // we'll create only one frame here.
            // if there is any timestamp at all, we will create a sync'ed frame.
            sync = new FrameBodySYLT((byte) 0, "ENG", (byte) 2, (byte) 1, "", new byte[0]);
            unsync = new FrameBodyUSLT((byte) 0, "ENG", "", "");
            while (iterator.hasNext())
            {
                line = iterator.next();
                if (hasTimeStamp)
                {
                    // sync.addLyric(line);
                }
                else
                {
                    unsync.addLyric(line);
                }
            }
            if (hasTimeStamp)
            {
                this.frameBody = sync;
                this.frameBody.setHeader(this);
            }
            else
            {
                this.frameBody = unsync;
                this.frameBody.setHeader(this);
            }
        }
        else if (id.equals("INF"))
        {
            value = ((FieldFrameBodyINF) field.getBody()).getAdditionalInformation();
            this.frameBody = new FrameBodyCOMM((byte) 0, "ENG", "", value);
            this.frameBody.setHeader(this);
        }
        else if (id.equals("AUT"))
        {
            value = ((FieldFrameBodyAUT) field.getBody()).getAuthor();
            this.frameBody = new FrameBodyTCOM((byte) 0, value);
            this.frameBody.setHeader(this);
        }
        else if (id.equals("EAL"))
        {
            value = ((FieldFrameBodyEAL) field.getBody()).getAlbum();
            this.frameBody = new FrameBodyTALB((byte) 0, value);
            this.frameBody.setHeader(this);
        }
        else if (id.equals("EAR"))
        {
            value = ((FieldFrameBodyEAR) field.getBody()).getArtist();
            this.frameBody = new FrameBodyTPE1((byte) 0, value);
            this.frameBody.setHeader(this);
        }
        else if (id.equals("ETT"))
        {
            value = ((FieldFrameBodyETT) field.getBody()).getTitle();
            this.frameBody = new FrameBodyTIT2((byte) 0, value);
            this.frameBody.setHeader(this);
        }
        else if (id.equals("IMG"))
        {
            throw new InvalidTagException("Cannot create ID3v2.40 frame from Lyrics3 image field.");
        }
        else
        {
            throw new InvalidTagException("Cannot caret ID3v2.40 frame from " + id + " Lyrics3 field");
        }
    }

    /**
     * Creates a new ID3v24Frame datatype by reading from byteBuffer.
     *
     * @param byteBuffer      to read from
     * @param loggingFilename
     * @throws org.jaudiotagger.tag.InvalidFrameException
     *
     */
    public ID3v24Frame(ByteBuffer byteBuffer, String loggingFilename) throws InvalidFrameException, InvalidDataTypeException
    {
        setLoggingFilename(loggingFilename);
        read(byteBuffer);
    }

    /**
     * Creates a new ID3v24Frame datatype by reading from byteBuffer.
     *
     * @param byteBuffer to read from
     * @throws org.jaudiotagger.tag.InvalidFrameException
     *
     * @deprecated use {@link #ID3v24Frame(ByteBuffer,String)} instead
     */
    public ID3v24Frame(ByteBuffer byteBuffer) throws InvalidFrameException, InvalidDataTypeException
    {
        this(byteBuffer, "");
    }

    /**
     * @param obj
     * @return if obj is equivalent to this frame
     */
    public boolean equals(Object obj)
    {

        if (this == obj) return true;

        if (!(obj instanceof ID3v24Frame))
        {
            return false;
        }
        ID3v24Frame that = (ID3v24Frame) obj;


        return EqualsUtil.areEqual(this.statusFlags, that.statusFlags) && EqualsUtil.areEqual(this.encodingFlags, that.encodingFlags) && super.equals(that);
    }


    /**
     * Return size of frame
     *
     * @return int frame size
     */
    public int getSize()
    {
        return frameBody.getSize() + ID3v24Frame.FRAME_HEADER_SIZE;
    }

    /**
     * If frame is greater than certain size it will be decoded differently if unsynchronized to if synchronized
     * Frames with certain byte sequences should be unsynchronized but sometimes editors do not
     * unsynchronize them so this method checks both cases and goes with the option that fits best with the data
     *
     * @param byteBuffer
     * @throws InvalidFrameException
     */
    private void checkIfFrameSizeThatIsNotSyncSafe(ByteBuffer byteBuffer)
            throws InvalidFrameException
    {
        if (frameSize > ID3SyncSafeInteger.MAX_SAFE_SIZE)
        {
            //Set Just after size field this is where we want to be when we leave this if statement
            int currentPosition = byteBuffer.position();

            //Read as nonsync safe integer
            byteBuffer.position(currentPosition - getFrameIdSize());
            int nonSyncSafeFrameSize = byteBuffer.getInt();

            //Is the frame size syncsafe, should always be BUT some encoders such as Itunes do not do it properly
            //so do an easy check now.
            byteBuffer.position(currentPosition - getFrameIdSize());
            boolean isNotSyncSafe = ID3SyncSafeInteger.isBufferNotSyncSafe(byteBuffer);

            //not relative so need to move position
            byteBuffer.position(currentPosition);

            if (isNotSyncSafe)
            {
                logger.warning(getLoggingFilename() + ":" + "Frame size is NOT stored as a sync safe integer:" + identifier);

                //This will return a larger frame size so need to check against buffer size if too large then we are
                //buggered , give up
                if (nonSyncSafeFrameSize > (byteBuffer.remaining() - -getFrameFlagsSize()))
                {
                    logger.warning(getLoggingFilename() + ":" + "Invalid Frame size larger than size before mp3 audio:" + identifier);
                    throw new InvalidFrameException(identifier + " is invalid frame");
                }
                else
                {
                    frameSize = nonSyncSafeFrameSize;
                }
            }
            else
            {
                //appears to be sync safe but lets look at the bytes just after the reported end of this
                //frame to see if find a valid frame header

                //Read the Frame Identifier
                byte[] readAheadbuffer = new byte[getFrameIdSize()];
                byteBuffer.position(currentPosition + frameSize + getFrameFlagsSize());

                if (byteBuffer.remaining() < getFrameIdSize())
                {
                    //There is no padding or framedata we are at end so assume syncsafe
                    //reset position to just after framesize
                    byteBuffer.position(currentPosition);
                }
                else
                {
                    byteBuffer.get(readAheadbuffer, 0, getFrameIdSize());

                    //reset position to just after framesize
                    byteBuffer.position(currentPosition);

                    String readAheadIdentifier = new String(readAheadbuffer);
                    if (isValidID3v2FrameIdentifier(readAheadIdentifier))
                    {
                        //Everything ok, so continue
                    }
                    else if (ID3SyncSafeInteger.isBufferEmpty(readAheadbuffer))
                    {
                        //no data found so assume entered padding in which case assume it is last
                        //frame and we are ok
                    }
                    //haven't found identifier so maybe not syncsafe or maybe there are no more frames, just padding
                    else
                    {
                        //Ok lets try using a non-syncsafe integer

                        //size returned will be larger so is it valid
                        if (nonSyncSafeFrameSize > byteBuffer.remaining() - getFrameFlagsSize())
                        {
                            //invalid so assume syncsafe
                            byteBuffer.position(currentPosition);
                        }
                        else
                        {
                            readAheadbuffer = new byte[getFrameIdSize()];
                            byteBuffer.position(currentPosition + nonSyncSafeFrameSize + getFrameFlagsSize());

                            if (byteBuffer.remaining() >= getFrameIdSize())
                            {
                                byteBuffer.get(readAheadbuffer, 0, getFrameIdSize());
                                readAheadIdentifier = new String(readAheadbuffer);

                                //reset position to just after framesize
                                byteBuffer.position(currentPosition);

                                //ok found a valid identifier using non-syncsafe so assume non-syncsafe size
                                //and continue
                                if (isValidID3v2FrameIdentifier(readAheadIdentifier))
                                {
                                    frameSize = nonSyncSafeFrameSize;
                                    logger.warning(getLoggingFilename() + ":" + "Assuming frame size is NOT stored as a sync safe integer:" + identifier);
                                }
                                //no data found so assume entered padding in which case assume it is last
                                //frame and we are ok whereas we didn't hit padding when using syncsafe integer
                                //or we wouldn't have got to this point. So assume syncsafe integer ended within
                                //the frame data whereas this has reached end of frames.
                                else if (ID3SyncSafeInteger.isBufferEmpty(readAheadbuffer))
                                {
                                    frameSize = nonSyncSafeFrameSize;
                                    logger.warning(getLoggingFilename() + ":" + "Assuming frame size is NOT stored as a sync safe integer:" + identifier);
                                }
                                //invalid so assume syncsafe as that is is the standard
                                else
                                {

                                }
                            }
                            else
                            {
                                //reset position to just after framesize
                                byteBuffer.position(currentPosition);

                                //If the unsync framesize matches exactly the remaining bytes then assume it has the
                                //correct size for the last frame
                                if (byteBuffer.remaining() == 0)
                                {
                                    frameSize = nonSyncSafeFrameSize;
                                }
                                //Inconclusive stick with syncsafe
                                else
                                {
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Read the frame size form the header, check okay , if not try to fix
     * or just throw exception
     *
     * @param byteBuffer
     * @throws InvalidFrameException
     */
    private void getFrameSize(ByteBuffer byteBuffer)
            throws InvalidFrameException
    {
         //Read frame size as syncsafe integer
        frameSize = ID3SyncSafeInteger.bufferToValue(byteBuffer);

        if (frameSize < 0)
        {
            logger.warning(getLoggingFilename() + ":" + "Invalid Frame size:" + identifier);
            throw new InvalidFrameException(identifier + " is invalid frame");
        }
        else if (frameSize == 0)
        {
            logger.warning(getLoggingFilename() + ":" + "Empty Frame:" + identifier);
            //We dont process this frame or add to framemap becuase contains no useful information
            //Skip the two flag bytes so in correct position for subsequent frames
            byteBuffer.get();
            byteBuffer.get();
            throw new EmptyFrameException(identifier + " is empty frame");
        }
        else if (frameSize > (byteBuffer.remaining() - FRAME_FLAGS_SIZE))
        {
            logger.warning(getLoggingFilename() + ":" + "Invalid Frame size larger than size before mp3 audio:" + identifier);
            throw new InvalidFrameException(identifier + " is invalid frame");
        }

        checkIfFrameSizeThatIsNotSyncSafe(byteBuffer);
    }

    /**
     * Read the frame from the specified file.
     * Read the frame header then delegate reading of data to frame body.
     *
     * @param byteBuffer to read the frame from
     */
    public void read(ByteBuffer byteBuffer) throws InvalidFrameException, InvalidDataTypeException
    {
        String identifier = readIdentifier(byteBuffer);

        //Is this a valid identifier?
        if (!isValidID3v2FrameIdentifier(identifier))
        {
            //If not valid move file pointer back to one byte after
            //the original check so can try again.
            logger.config(getLoggingFilename() + ":" + "Invalid identifier:" + identifier);
            byteBuffer.position(byteBuffer.position() - (getFrameIdSize() - 1));
            throw new InvalidFrameIdentifierException(getLoggingFilename() + ":" + identifier + ":is not a valid ID3v2.30 frame");
        }

        //Get the frame size, adjusted as necessary
        getFrameSize(byteBuffer);

        //Read the flag bytes
        statusFlags = new StatusFlags(byteBuffer.get());
        encodingFlags = new EncodingFlags(byteBuffer.get());

        //Read extra bits appended to frame header for various encodings
        //These are not included in header size but are included in frame size but wont be read when we actually
        //try to read the frame body data
        int extraHeaderBytesCount = 0;
        int dataLengthSize = -1;
        if (((EncodingFlags) encodingFlags).isGrouping())
        {
            extraHeaderBytesCount = ID3v24Frame.FRAME_GROUPING_INDICATOR_SIZE;
            groupIdentifier=byteBuffer.get();
        }

        if (((EncodingFlags) encodingFlags).isEncryption())
        {
            //Read the Encryption byte, but do nothing with it
            extraHeaderBytesCount += ID3v24Frame.FRAME_ENCRYPTION_INDICATOR_SIZE;
            encryptionMethod=byteBuffer.get();
        }

        if (((EncodingFlags) encodingFlags).isDataLengthIndicator())
        {
            //Read the sync safe size field
            dataLengthSize = ID3SyncSafeInteger.bufferToValue(byteBuffer);
            extraHeaderBytesCount += FRAME_DATA_LENGTH_SIZE;
            logger.config(getLoggingFilename() + ":" + "Frame Size Is:" + frameSize + " Data Length Size:" + dataLengthSize);
        }

        //Work out the real size of the frameBody data
        int realFrameSize = frameSize - extraHeaderBytesCount;

        //Create Buffer that only contains the body of this frame rather than the remainder of tag
        ByteBuffer frameBodyBuffer = byteBuffer.slice();
        frameBodyBuffer.limit(realFrameSize);

        //Do we need to synchronize the frame body
        int syncSize = realFrameSize;
        if (((EncodingFlags) encodingFlags).isUnsynchronised())
        {
            //We only want to synchronize the buffer up to the end of this frame (remember this
            //buffer contains the remainder of this tag not just this frame), and we cannot just
            //create a new buffer because when this method returns the position of the buffer is used
            //to look for the next frame, so we need to modify the buffer. The action of synchronizing causes
            //bytes to be dropped so the existing buffer is large enough to hold the modifications
            frameBodyBuffer = ID3Unsynchronization.synchronize(frameBodyBuffer);
            syncSize = frameBodyBuffer.limit();
            logger.config(getLoggingFilename() + ":" + "Frame Size After Syncing is:" + syncSize);
        }

        //Read the body data
        try
        {
            if (((EncodingFlags) encodingFlags).isCompression())
            {
                frameBodyBuffer = ID3Compression.uncompress(identifier, getLoggingFilename(), byteBuffer, dataLengthSize, realFrameSize);
                if(((EncodingFlags) encodingFlags).isEncryption())
                {
                    frameBody = readEncryptedBody(identifier, frameBodyBuffer, dataLengthSize);
                }
                else
                {
                    frameBody = readBody(identifier, frameBodyBuffer, dataLengthSize);
                }
            }
            else if (((EncodingFlags) encodingFlags).isEncryption())
            {
                frameBodyBuffer = byteBuffer.slice();
                frameBodyBuffer.limit(realFrameSize);
                frameBody = readEncryptedBody(identifier, byteBuffer,frameSize);
            }
            else
            {
                frameBody = readBody(identifier, frameBodyBuffer, syncSize);
            }
            if (!(frameBody instanceof ID3v24FrameBody))
            {
                logger.config(getLoggingFilename() + ":" + "Converted frame body with:" + identifier + " to deprecated framebody");
                frameBody = new FrameBodyDeprecated((AbstractID3v2FrameBody) frameBody);
            }
        }
        finally
        {
            //Update position of main buffer, so no attempt is made to reread these bytes
            byteBuffer.position(byteBuffer.position() + realFrameSize);
        }
    }

    /**
     * Write the frame. Writes the frame header but writing the data is delegated to the
     * frame body.
     *
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        boolean unsynchronization;

        logger.config("Writing frame to file:" + getIdentifier());

        //This is where we will write header, move position to where we can
        //write bodybuffer
        ByteBuffer headerBuffer = ByteBuffer.allocate(FRAME_HEADER_SIZE);

        //Write Frame Body Data to a new stream
        ByteArrayOutputStream bodyOutputStream = new ByteArrayOutputStream();
        ((AbstractID3v2FrameBody) frameBody).write(bodyOutputStream);

        //Does it need unsynchronizing, and are we allowing unsychronizing
        byte[] bodyBuffer = bodyOutputStream.toByteArray();
        unsynchronization = TagOptionSingleton.getInstance().isUnsyncTags() && ID3Unsynchronization.requiresUnsynchronization(bodyBuffer);
        if (unsynchronization)
        {
            bodyBuffer = ID3Unsynchronization.unsynchronize(bodyBuffer);
            logger.config("bodybytebuffer:sizeafterunsynchronisation:" + bodyBuffer.length);
        }

        //Write Frame Header
        //Write Frame ID, the identifier must be 4 bytes bytes long it may not be
        //because converted an unknown v2.2 id (only 3 bytes long)
        if (getIdentifier().length() == 3)
        {
            identifier = identifier + ' ';
        }
        headerBuffer.put(getIdentifier().getBytes(StandardCharsets.ISO_8859_1), 0, FRAME_ID_SIZE);

        //Write Frame Size based on size of body buffer (if it has been unsynced then it size
        //will have increased accordingly
        int size = bodyBuffer.length;
        logger.fine("Frame Size Is:" + size);
        headerBuffer.put(ID3SyncSafeInteger.valueToBuffer(size));

        //Write the Flags
        //Status Flags:leave as they were when we read
        headerBuffer.put(statusFlags.getWriteFlags());

        //Remove any non standard flags
        ((EncodingFlags) encodingFlags).unsetNonStandardFlags();
                
        //Encoding we only support unsynchronization
        if (unsynchronization)
        {
            ((EncodingFlags) encodingFlags).setUnsynchronised();
        }
        else
        {
            ((EncodingFlags) encodingFlags).unsetUnsynchronised();
        }
        //These are not currently supported on write
        ((EncodingFlags) encodingFlags).unsetCompression();
        ((EncodingFlags) encodingFlags).unsetDataLengthIndicator();
        headerBuffer.put(encodingFlags.getFlags());

        try
        {
            //Add header to the Byte Array Output Stream
            tagBuffer.write(headerBuffer.array());

            if (((EncodingFlags) encodingFlags).isEncryption())
            {
               tagBuffer.write(encryptionMethod);
            }

            if (((EncodingFlags) encodingFlags).isGrouping())
            {
                tagBuffer.write(groupIdentifier);
            }

            //Add bodybuffer to the Byte Array Output Stream
            tagBuffer.write(bodyBuffer);
        }
        catch (IOException ioe)
        {
            //This could never happen coz not writing to file, so convert to RuntimeException
            throw new RuntimeException(ioe);
        }
    }

    /**
     * Get Status Flags Object
     */
    public AbstractID3v2Frame.StatusFlags getStatusFlags()
    {
        return statusFlags;
    }

    /**
     * Get Encoding Flags Object
     */
    public AbstractID3v2Frame.EncodingFlags getEncodingFlags()
    {
        return encodingFlags;
    }

    public int getEncryptionMethod()
    {
        return encryptionMethod;
    }

    public int getGroupIdentifier()
    {
        return groupIdentifier;
    }

    /**
     * Member Class This represents a frame headers Status Flags
     * Make adjustments if necessary based on frame type and specification.
     */
    public class StatusFlags extends AbstractID3v2Frame.StatusFlags
    {
        public static final String TYPE_TAGALTERPRESERVATION = "typeTagAlterPreservation";
        public static final String TYPE_FILEALTERPRESERVATION = "typeFileAlterPreservation";
        public static final String TYPE_READONLY = "typeReadOnly";


        /**
         * Discard frame if tag altered
         */
        public static final int MASK_TAG_ALTER_PRESERVATION = FileConstants.BIT6;

        /**
         * Discard frame if audio part of file altered
         */
        public static final int MASK_FILE_ALTER_PRESERVATION = FileConstants.BIT5;

        /**
         * Frame tagged as read only
         */
        public static final int MASK_READ_ONLY = FileConstants.BIT4;

        /**
         * Use this when creating a frame from scratch
         */
        StatusFlags()
        {
            super();
        }

        /**
         * Use this constructor when reading from file or from another v4 frame
         *
         * @param flags
         */
        StatusFlags(byte flags)
        {
            originalFlags = flags;
            writeFlags = flags;
            modifyFlags();
        }

        /**
         * Use this constructor when convert a v23 frame
         *
         * @param statusFlags
         */
        StatusFlags(ID3v23Frame.StatusFlags statusFlags)
        {
            originalFlags = convertV3ToV4Flags(statusFlags.getOriginalFlags());
            writeFlags = originalFlags;
            modifyFlags();
        }

        /**
         * Convert V3 Flags to equivalent V4 Flags
         *
         * @param v3Flag
         * @return
         */
        private byte convertV3ToV4Flags(byte v3Flag)
        {
            byte v4Flag = (byte) 0;
            if ((v3Flag & ID3v23Frame.StatusFlags.MASK_FILE_ALTER_PRESERVATION) != 0)
            {
                v4Flag |= (byte) MASK_FILE_ALTER_PRESERVATION;
            }
            if ((v3Flag & ID3v23Frame.StatusFlags.MASK_TAG_ALTER_PRESERVATION) != 0)
            {
                v4Flag |= (byte) MASK_TAG_ALTER_PRESERVATION;
            }
            return v4Flag;
        }

        /**
         * Makes modifications to flags based on specification and frameid
         */
        protected void modifyFlags()
        {
            String str = getIdentifier();
            if (ID3v24Frames.getInstanceOf().isDiscardIfFileAltered(str))
            {
                writeFlags |= (byte) MASK_FILE_ALTER_PRESERVATION;
                writeFlags &= (byte) ~MASK_TAG_ALTER_PRESERVATION;
            }
            else
            {
                writeFlags &= (byte) ~MASK_FILE_ALTER_PRESERVATION;
                writeFlags &= (byte) ~MASK_TAG_ALTER_PRESERVATION;
            }
        }

        public void createStructure()
        {
            MP3File.getStructureFormatter().openHeadingElement(TYPE_FLAGS, "");
            MP3File.getStructureFormatter().addElement(TYPE_TAGALTERPRESERVATION, originalFlags & MASK_TAG_ALTER_PRESERVATION);
            MP3File.getStructureFormatter().addElement(TYPE_FILEALTERPRESERVATION, originalFlags & MASK_FILE_ALTER_PRESERVATION);
            MP3File.getStructureFormatter().addElement(TYPE_READONLY, originalFlags & MASK_READ_ONLY);
            MP3File.getStructureFormatter().closeHeadingElement(TYPE_FLAGS);
        }


    }

    /**
     * This represents a frame headers Encoding Flags
     */
    class EncodingFlags extends AbstractID3v2Frame.EncodingFlags
    {
        public static final String TYPE_COMPRESSION = "compression";
        public static final String TYPE_ENCRYPTION = "encryption";
        public static final String TYPE_GROUPIDENTITY = "groupidentity";
        public static final String TYPE_FRAMEUNSYNCHRONIZATION = "frameUnsynchronisation";
        public static final String TYPE_DATALENGTHINDICATOR = "dataLengthIndicator";

        /**
         * Frame is part of a group
         */
        public static final int MASK_GROUPING_IDENTITY = FileConstants.BIT6;

        /**
         * Frame is compressed
         */
        public static final int MASK_COMPRESSION = FileConstants.BIT3;

        /**
         * Frame is encrypted
         */
        public static final int MASK_ENCRYPTION = FileConstants.BIT2;

        /**
         * Unsynchronisation
         */
        public static final int MASK_FRAME_UNSYNCHRONIZATION = FileConstants.BIT1;

        /**
         * Length
         */
        public static final int MASK_DATA_LENGTH_INDICATOR = FileConstants.BIT0;

        /**
         * Use this when creating a frame from scratch
         */
        EncodingFlags()
        {
            super();
        }

        /**
         * Use this when creating a frame from existing flags in another v4 frame
         *
         * @param flags
         */
        EncodingFlags(byte flags)
        {
            super(flags);
            logEnabledFlags();
        }

        public void logEnabledFlags()
        {
            if(isNonStandardFlags())
            {
                logger.warning(getLoggingFilename() + ":" + identifier + ":Unknown Encoding Flags:"+ Hex.asHex(flags));
            }
            if (isCompression())
            {
                logger.warning(ErrorMessage.MP3_FRAME_IS_COMPRESSED.getMsg(getLoggingFilename(), identifier));
            }

            if (isEncryption())
            {
                logger.warning(ErrorMessage.MP3_FRAME_IS_ENCRYPTED.getMsg(getLoggingFilename(), identifier));
            }

            if (isGrouping())
            {
                logger.config(ErrorMessage.MP3_FRAME_IS_GROUPED.getMsg(getLoggingFilename(), identifier));
            }

            if (isUnsynchronised())
            {
                logger.config(ErrorMessage.MP3_FRAME_IS_UNSYNCHRONISED.getMsg(getLoggingFilename(), identifier));
            }

            if (isDataLengthIndicator())
            {
                logger.config(ErrorMessage.MP3_FRAME_IS_DATA_LENGTH_INDICATOR.getMsg(getLoggingFilename(), identifier));
            }
        }

        public byte getFlags()
        {
            return flags;
        }

        public boolean isCompression()
        {
            return (flags & MASK_COMPRESSION) > 0;
        }

        public boolean isEncryption()
        {
            return (flags & MASK_ENCRYPTION) > 0;
        }

        public boolean isGrouping()
        {
            return (flags & MASK_GROUPING_IDENTITY) > 0;
        }

        public boolean isUnsynchronised()
        {
            return (flags & MASK_FRAME_UNSYNCHRONIZATION) > 0;
        }

        public boolean isDataLengthIndicator()
        {
            return (flags & MASK_DATA_LENGTH_INDICATOR) > 0;
        }

        public void setCompression()
        {
            flags |= MASK_COMPRESSION;
        }

        public void setEncryption()
        {
            flags |= MASK_ENCRYPTION;
        }

         public void setGrouping()
        {
            flags |= MASK_GROUPING_IDENTITY;
        }

        public void setUnsynchronised()
        {
            flags |= MASK_FRAME_UNSYNCHRONIZATION;
        }

        public void setDataLengthIndicator()
        {
            flags |= MASK_DATA_LENGTH_INDICATOR;
        }

        public void unsetCompression()
        {
            flags &= (byte) ~MASK_COMPRESSION;
        }

        public void unsetEncryption()
        {
            flags &= (byte) ~MASK_ENCRYPTION;
        }

        public void unsetGrouping()
        {
            flags &= (byte) ~MASK_GROUPING_IDENTITY;
        }

        public void unsetUnsynchronised()
        {
            flags &= (byte) ~MASK_FRAME_UNSYNCHRONIZATION;
        }

        public void unsetDataLengthIndicator()
        {
            flags &= (byte) ~MASK_DATA_LENGTH_INDICATOR;
        }

        public boolean isNonStandardFlags()
        {
            return ((flags & FileConstants.BIT7) > 0) ||
                   ((flags & FileConstants.BIT5) > 0) ||
                   ((flags & FileConstants.BIT4) > 0);
        }

        public void unsetNonStandardFlags()
        {
            if(isNonStandardFlags())
            {
                logger.warning(getLoggingFilename() + ":" + getIdentifier() + ":Unsetting Unknown Encoding Flags:"+  Hex.asHex(flags));
                flags &= (byte) ~FileConstants.BIT7;
                flags &= (byte) ~FileConstants.BIT5;
                flags &= (byte) ~FileConstants.BIT4;
            }
        }

        public void createStructure()
        {
            MP3File.getStructureFormatter().openHeadingElement(TYPE_FLAGS, "");
            MP3File.getStructureFormatter().addElement(TYPE_COMPRESSION, flags & MASK_COMPRESSION);
            MP3File.getStructureFormatter().addElement(TYPE_ENCRYPTION, flags & MASK_ENCRYPTION);
            MP3File.getStructureFormatter().addElement(TYPE_GROUPIDENTITY, flags & MASK_GROUPING_IDENTITY);
            MP3File.getStructureFormatter().addElement(TYPE_FRAMEUNSYNCHRONIZATION, flags & MASK_FRAME_UNSYNCHRONIZATION);
            MP3File.getStructureFormatter().addElement(TYPE_DATALENGTHINDICATOR, flags & MASK_DATA_LENGTH_INDICATOR);
            MP3File.getStructureFormatter().closeHeadingElement(TYPE_FLAGS);
        }
    }

    /**
     * Does the frame identifier meet the syntax for a idv3v2 frame identifier.
     * must start with a capital letter and only contain capital letters and numbers
     *
     * @param identifier to be checked
     * @return whether the identifier is valid
     */
    public boolean isValidID3v2FrameIdentifier(String identifier)
    {
        Matcher m = ID3v24Frame.validFrameIdentifier.matcher(identifier);
        return m.matches();
    }

    /**
     * Return String Representation of body
     */
    public void createStructure()
    {
        MP3File.getStructureFormatter().openHeadingElement(TYPE_FRAME, getIdentifier());
        MP3File.getStructureFormatter().addElement(TYPE_FRAME_SIZE, frameSize);
        statusFlags.createStructure();
        encodingFlags.createStructure();
        frameBody.createStructure();
        MP3File.getStructureFormatter().closeHeadingElement(TYPE_FRAME);
    }

    /**
     * @return true if considered a common frame
     */
    public boolean isCommon()
    {
        return ID3v24Frames.getInstanceOf().isCommon(getId());
    }

    /**
     * @return true if considered a common frame
     */
    public boolean isBinary()
    {
        return ID3v24Frames.getInstanceOf().isBinary(getId());
    }

     /**
     * Sets the charset encoding used by the field.
     *
      * @param encoding charset.
      */
    public void setEncoding(final Charset encoding)
    {
        Integer encodingId = TextEncoding.getInstanceOf().getIdForCharset(encoding);
        if(encodingId!=null)
        {
            if(encodingId <4)
            {
                this.getBody().setTextEncoding(encodingId.byteValue());
            }
        }
    }
}