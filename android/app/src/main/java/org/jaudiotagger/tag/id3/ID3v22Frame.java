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

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.mp3.MP3File;
import org.jaudiotagger.tag.EmptyFrameException;
import org.jaudiotagger.tag.InvalidDataTypeException;
import org.jaudiotagger.tag.InvalidFrameException;
import org.jaudiotagger.tag.InvalidFrameIdentifierException;
import org.jaudiotagger.tag.id3.framebody.AbstractID3v2FrameBody;
import org.jaudiotagger.tag.id3.framebody.FrameBodyDeprecated;
import org.jaudiotagger.tag.id3.framebody.FrameBodyUnsupported;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;
import org.jaudiotagger.utils.EqualsUtil;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.logging.Level;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Represents an ID3v2.2 frame.
 *
 * @author : Paul Taylor
 * @author : Eric Farng
 * @version $Id$
 */
public class ID3v22Frame extends AbstractID3v2Frame
{
    private static Pattern validFrameIdentifier = Pattern.compile("[A-Z][0-9A-Z]{2}");

    protected static final int FRAME_ID_SIZE = 3;
    protected static final int FRAME_SIZE_SIZE = 3;
    protected static final int FRAME_HEADER_SIZE = FRAME_ID_SIZE + FRAME_SIZE_SIZE;

    public ID3v22Frame()
    {

    }

    protected int getFrameIdSize()
    {
        return FRAME_ID_SIZE;
    }

    protected int getFrameSizeSize()
    {
        return FRAME_SIZE_SIZE;
    }

    protected int getFrameHeaderSize()
    {
        return FRAME_HEADER_SIZE;
    }

    /**
     * Creates a new ID3v22 Frame with given body
     *
     * @param body New body and frame is based on this
     */
    public ID3v22Frame(AbstractID3v2FrameBody body)
    {
        super(body);
    }

     /**
     * Compare for equality
     * To be deemed equal obj must be a IDv23Frame with the same identifier
     * and the same flags.
     * containing the same body,datatype list ectera.
     * equals() method is made up from all the various components
     *
     * @param obj
     * @return if true if this object is equivalent to obj
     */
    public boolean equals(Object obj)
    {
        if ( this == obj ) return true;

        if (!(obj instanceof ID3v22Frame))
        {
            return false;
        }
        ID3v22Frame that = (ID3v22Frame) obj;


        return
              EqualsUtil.areEqual(this.statusFlags, that.statusFlags) &&
              EqualsUtil.areEqual(this.encodingFlags, that.encodingFlags) &&
              super.equals(that);

    }

    /**
     * Creates a new ID3v22 Frame of type identifier.
     *
     * An empty body of the correct type will be automatically created. This constructor should be used when wish to
     * create a new frame from scratch using user values
     * @param identifier
     */
    @SuppressWarnings("unchecked")
    public ID3v22Frame(String identifier)
    {

        logger.config("Creating empty frame of type" + identifier);
        String bodyIdentifier = identifier;
        this.identifier = identifier;

        //If dealing with v22 identifier (Note this constructor is used by all three tag versions)
        if (ID3Tags.isID3v22FrameIdentifier(bodyIdentifier))
        {
            //Does it have its own framebody (PIC,CRM) or are we using v23/v24 body (the normal case)
            if (ID3Tags.forceFrameID22To23(bodyIdentifier) != null)
            {
                //Do not convert
            }
            else if(bodyIdentifier.equals("CRM"))
            {
                //Do not convert.
                //TODO we don't have a way of converting this to v23 which is why its not in the ForceMap
            }
            //TODO Improve messy fix for datetime
            //TODO need to check in case v22 body does exist before using V23 body(e.g PIC)
            else if ((bodyIdentifier.equals(ID3v22Frames.FRAME_ID_V2_TYER)) || (bodyIdentifier.equals(ID3v22Frames.FRAME_ID_V2_TIME)))
            {
                bodyIdentifier = ID3v24Frames.FRAME_ID_YEAR;
            }
            // Have to check for v22 because most don't have own body they use v23 or v24
            // body to hold the data, the frame is identified by its identifier, the body identifier
            // is just to create a body suitable for writing the data to
            else if (ID3Tags.isID3v22FrameIdentifier(bodyIdentifier))
            {
                bodyIdentifier = ID3Tags.convertFrameID22To23(bodyIdentifier);
            }
        }

        // Use reflection to map id to frame body, which makes things much easier
        // to keep things up to date.
        try
        {
            Class<AbstractID3v2FrameBody> c = (Class<AbstractID3v2FrameBody>) Class.forName("org.jaudiotagger.tag.id3.framebody.FrameBody" + bodyIdentifier);
            frameBody = c.newInstance();
        }
        catch (ClassNotFoundException cnfe)
        {
            logger.log(Level.SEVERE, cnfe.getMessage(), cnfe);
            frameBody = new FrameBodyUnsupported(identifier);
        }
        //Instantiate Interface/Abstract should not happen
        catch (InstantiationException ie)
        {
            logger.log(Level.SEVERE, ie.getMessage(), ie);
            throw new RuntimeException(ie);
        }
        //Private Constructor shouild not happen
        catch (IllegalAccessException iae)
        {
            logger.log(Level.SEVERE, iae.getMessage(), iae);
            throw new RuntimeException(iae);
        }
        frameBody.setHeader(this);
        logger.config("Created empty frame of type" + this.identifier + "with frame body of" + bodyIdentifier);

    }

    /**
     * Copy Constructor
     *
     * Creates a new v22 frame based on another v22 frame
     * @param frame
     */
    public ID3v22Frame(ID3v22Frame frame)
    {
        super(frame);
        logger.config("Creating frame from a frame of same version");
    }

    private void createV22FrameFromV23Frame(ID3v23Frame frame) throws InvalidFrameException
    {
        identifier = ID3Tags.convertFrameID23To22(frame.getIdentifier());
        if (identifier != null)
        {
            logger.config("V2:Orig id is:" + frame.getIdentifier() + ":New id is:" + identifier);
            this.frameBody = (AbstractID3v2FrameBody) ID3Tags.copyObject(frame.getBody());
        }
        // Is it a known v3 frame which needs forcing to v2 frame e.g. APIC - PIC
        else if (ID3Tags.isID3v23FrameIdentifier(frame.getIdentifier()))
        {
            identifier = ID3Tags.forceFrameID23To22(frame.getIdentifier());
            if (identifier != null)
            {
                logger.config("V2:Force:Orig id is:" + frame.getIdentifier() + ":New id is:" + identifier);
                this.frameBody = this.readBody(identifier, (AbstractID3v2FrameBody) frame.getBody());
            }
            // No mechanism exists to convert it to a v22 frame
            else
            {
                throw new InvalidFrameException("Unable to convert v23 frame:" + frame.getIdentifier() + " to a v22 frame");
            }
        }
        //Deprecated frame for v23
        else if (frame.getBody() instanceof FrameBodyDeprecated)
        {
            //Was it valid for this tag version, if so try and reconstruct
            if (ID3Tags.isID3v22FrameIdentifier(frame.getIdentifier()))
            {
                this.frameBody = frame.getBody();
                identifier = frame.getIdentifier();
                logger.config("DEPRECATED:Orig id is:" + frame.getIdentifier() + ":New id is:" + identifier);
            }
            //or was it still deprecated, if so leave as is
            else
            {
                this.frameBody = new FrameBodyDeprecated((FrameBodyDeprecated) frame.getBody());
                identifier = frame.getIdentifier();
                logger.config("DEPRECATED:Orig id is:" + frame.getIdentifier() + ":New id is:" + identifier);
            }
        }
        // Unknown Frame e.g NCON
        else
        {
            this.frameBody = new FrameBodyUnsupported((FrameBodyUnsupported) frame.getBody());
            identifier = frame.getIdentifier();
            logger.config("v2:UNKNOWN:Orig id is:" + frame.getIdentifier() + ":New id is:" + identifier);
        }
    }

    /**
     * Creates a new ID3v22 Frame from another frame of a different tag version
     *
     * @param frame to construct the new frame from
     * @throws org.jaudiotagger.tag.InvalidFrameException
     */
    public ID3v22Frame(AbstractID3v2Frame frame) throws InvalidFrameException
    {
        logger.config("Creating frame from a frame of a different version");
        if (frame instanceof ID3v22Frame)
        {
            throw new UnsupportedOperationException("Copy Constructor not called. Please type cast the argument");
        }

        // If it is a v24 frame is it possible to convert it into a v23 frame, and then convert from that
        if (frame instanceof ID3v24Frame)
        {
            ID3v23Frame v23Frame = new ID3v23Frame(frame);
            createV22FrameFromV23Frame(v23Frame);
        }
        //If it is a v23 frame is it possible to convert it into a v22 frame
        else if (frame instanceof ID3v23Frame)
        {
            createV22FrameFromV23Frame((ID3v23Frame) frame);
        }
        this.frameBody.setHeader(this);
        logger.config("Created frame from a frame of a different version");
    }

    /**
     * Creates a new ID3v22Frame datatype by reading from byteBuffer.
     *
     * @param byteBuffer to read from
     * @param loggingFilename
     * @throws org.jaudiotagger.tag.InvalidFrameException
     */
    public ID3v22Frame(ByteBuffer byteBuffer, String loggingFilename) throws InvalidFrameException, InvalidDataTypeException
    {
        setLoggingFilename(loggingFilename);
        read(byteBuffer);
    }

    /**
     * Creates a new ID3v23Frame datatype by reading from byteBuffer.
     *
     * @param byteBuffer to read from
     * @deprecated use {@link #ID3v22Frame(ByteBuffer,String)} instead
     * @throws org.jaudiotagger.tag.InvalidFrameException
     */
    public ID3v22Frame(ByteBuffer byteBuffer) throws InvalidFrameException, InvalidDataTypeException
    {
        this(byteBuffer, "");
    }

    /**
     * Return size of frame
     *
     * @return int size of frame
     */
    public int getSize()
    {
        return frameBody.getSize() + getFrameHeaderSize();
    }

    @Override 
    protected boolean isPadding(byte[] buffer)
    {
        if(
                (buffer[0]=='\0')&&
                (buffer[1]=='\0')&&
                (buffer[2]=='\0')
           )
        {
            return true;
        }
        return false;
    }

    /**
     * Read frame from file.
     * Read the frame header then delegate reading of data to frame body.
     *
     * @param byteBuffer
     */
    public void read(ByteBuffer byteBuffer) throws InvalidFrameException, InvalidDataTypeException
    {
        String identifier = readIdentifier(byteBuffer);

        byte[] buffer = new byte[getFrameSizeSize()];

        // Is this a valid identifier?
        if (!isValidID3v2FrameIdentifier(identifier))
        {
            logger.config("Invalid identifier:" + identifier);
            byteBuffer.position(byteBuffer.position() - (getFrameIdSize() - 1));
            throw new InvalidFrameIdentifierException(getLoggingFilename() + ":" + identifier + ":is not a valid ID3v2.20 frame");
        }
        //Read Frame Size (same size as Frame Id so reuse buffer)
        byteBuffer.get(buffer, 0, getFrameSizeSize());
        frameSize = decodeSize(buffer);
        if (frameSize < 0)
        {
            throw new InvalidFrameException(identifier + " has invalid size of:" + frameSize);
        }
        else if (frameSize == 0)
        {
            //We dont process this frame or add to framemap becuase contains no useful information
            logger.warning("Empty Frame:" + identifier);
            throw new EmptyFrameException(identifier + " is empty frame");
        }
        else if (frameSize > byteBuffer.remaining())
        {
            logger.warning("Invalid Frame size larger than size before mp3 audio:" + identifier);
            throw new InvalidFrameException(identifier + " is invalid frame");
        }
        else
        {
            logger.fine("Frame Size Is:" + frameSize);
            //Convert v2.2 to v2.4 id just for reading the data
            String id = ID3Tags.convertFrameID22To24(identifier);
            if (id == null)
            {
                //OK,it may be convertable to a v.3 id even though not valid v.4
                id = ID3Tags.convertFrameID22To23(identifier);
                if (id == null)
                {
                    // Is it a valid v22 identifier so should be able to find a
                    // frame body for it.
                    if (ID3Tags.isID3v22FrameIdentifier(identifier))
                    {
                        id = identifier;
                    }
                    // Unknown so will be created as FrameBodyUnsupported
                    else
                    {
                        id = UNSUPPORTED_ID;
                    }
                }
            }
            logger.fine("Identifier was:" + identifier + " reading using:" + id);

            //Create Buffer that only contains the body of this frame rather than the remainder of tag
            ByteBuffer frameBodyBuffer = byteBuffer.slice();
            frameBodyBuffer.limit(frameSize);

            try
            {
                frameBody = readBody(id, frameBodyBuffer, frameSize);
            }
            finally
            {
                //Update position of main buffer, so no attempt is made to reread these bytes
                byteBuffer.position(byteBuffer.position() + frameSize);
            }
        }
    }

    /**
     * Read Frame Size, which has to be decoded
     * @param buffer
     * @return
     */
    private int decodeSize(byte[] buffer)
    {
        BigInteger bi = new BigInteger(buffer);
        int tmpSize = bi.intValue();
        if (tmpSize < 0)
        {
            logger.warning("Invalid Frame Size of:" + tmpSize + "Decoded from bin:" + Integer.toBinaryString(tmpSize) + "Decoded from hex:" + Integer.toHexString(tmpSize));
        }
        return tmpSize;
    }


    /**
     * Write Frame raw data
     *
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        logger.config("Write Frame to Buffer" + getIdentifier());
        //This is where we will write header, move position to where we can
        //write body
        ByteBuffer headerBuffer = ByteBuffer.allocate(getFrameHeaderSize());

        //Write Frame Body Data
        ByteArrayOutputStream bodyOutputStream = new ByteArrayOutputStream();
        ((AbstractID3v2FrameBody) frameBody).write(bodyOutputStream);

        //Write Frame Header
        //Write Frame ID must adjust can only be 3 bytes long
        headerBuffer.put(getIdentifier().getBytes(StandardCharsets.ISO_8859_1), 0, getFrameIdSize());
        encodeSize(headerBuffer, frameBody.getSize());

        //Add header to the Byte Array Output Stream
        try
        {
            tagBuffer.write(headerBuffer.array());

            //Add body to the Byte Array Output Stream
            tagBuffer.write(bodyOutputStream.toByteArray());
        }
        catch (IOException ioe)
        {
            //This could never happen coz not writing to file, so convert to RuntimeException
            throw new RuntimeException(ioe);
        }
    }

    /**
     * Write Frame Size (can now be accurately calculated, have to convert 4 byte int
     * to 3 byte format.
     * @param headerBuffer
     * @param size
     */
    private void encodeSize(ByteBuffer headerBuffer, int size)
    {
        headerBuffer.put((byte) ((size & 0x00FF0000) >> 16));
        headerBuffer.put((byte) ((size & 0x0000FF00) >> 8));
        headerBuffer.put((byte) (size & 0x000000FF));
        logger.fine("Frame Size Is Actual:" + size + ":Encoded bin:" + Integer.toBinaryString(size) + ":Encoded Hex" + Integer.toHexString(size));
    }

    /**
     * Does the frame identifier meet the syntax for a idv3v2 frame identifier.
     * must start with a capital letter and only contain capital letters and numbers
     *
     * @param identifier
     * @return
     */
    public boolean isValidID3v2FrameIdentifier(String identifier)
    {
        Matcher m = ID3v22Frame.validFrameIdentifier.matcher(identifier);
        return m.matches();
    }

    /**
     * Return String Representation of body
     */
    public void createStructure()
    {
        MP3File.getStructureFormatter().openHeadingElement(TYPE_FRAME, getIdentifier());
        MP3File.getStructureFormatter().addElement(TYPE_FRAME_SIZE, frameSize);
        frameBody.createStructure();
        MP3File.getStructureFormatter().closeHeadingElement(TYPE_FRAME);
    }

    /**
     * @return true if considered a common frame
     */
    public boolean isCommon()
    {
        return ID3v22Frames.getInstanceOf().isCommon(getId());
    }

    /**
     * @return true if considered a common frame
     */
    public boolean isBinary()
    {
        return ID3v22Frames.getInstanceOf().isBinary(getId());
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
            if(encodingId <2)
            {
                this.getBody().setTextEncoding(encodingId.byteValue());
            }
        }
    }
}
