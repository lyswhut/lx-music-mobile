/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Raphaël Slinckx <raphael@slinckx.net>
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
package org.jaudiotagger.audio.ogg;

import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.exceptions.CannotWriteException;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.ogg.util.OggCRCFactory;
import org.jaudiotagger.audio.ogg.util.OggPageHeader;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.id3.AbstractID3v1Tag;
import org.jaudiotagger.tag.vorbiscomment.VorbisCommentTag;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.List;
import java.util.logging.Logger;

/**
 * Write Vorbis Tag within an ogg
 *
 * VorbisComment holds the tag information within an ogg file
 */
public class OggVorbisTagWriter
{
    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.ogg");

    private OggVorbisCommentTagCreator tc = new OggVorbisCommentTagCreator();
    private OggVorbisTagReader reader = new OggVorbisTagReader();

    public void delete(RandomAccessFile raf, RandomAccessFile tempRaf) throws IOException, CannotReadException, CannotWriteException
    {
        try
        {
            reader.read(raf);
        }
        catch (CannotReadException e)
        {
            write(VorbisCommentTag.createNewTag(), raf, tempRaf);
            return;
        }

        VorbisCommentTag emptyTag = VorbisCommentTag.createNewTag();

        //Go back to start of file
        raf.seek(0);
        write(emptyTag, raf, tempRaf);
    }

    public void write(Tag tag, RandomAccessFile raf, RandomAccessFile rafTemp) throws CannotReadException, CannotWriteException, IOException
    {
        logger.config("Starting to write file:");

        //1st Page:Identification Header
        logger.fine("Read 1st Page:identificationHeader:");
        OggPageHeader pageHeader = OggPageHeader.read(raf);
        raf.seek(pageHeader.getStartByte());

        //Write 1st page (unchanged) and place writer pointer at end of data
        rafTemp.getChannel().transferFrom(raf.getChannel(), 0, pageHeader.getPageLength() + OggPageHeader.OGG_PAGE_HEADER_FIXED_LENGTH + pageHeader.getSegmentTable().length);
        rafTemp.skipBytes(pageHeader.getPageLength() + OggPageHeader.OGG_PAGE_HEADER_FIXED_LENGTH + pageHeader.getSegmentTable().length);
        logger.fine("Written identificationHeader:");

        //2nd page:Comment and Setup if there is enough room, may also (although not normally) contain audio frames
        OggPageHeader secondPageHeader = OggPageHeader.read(raf);

        //2nd Page:Store the end of Header
        long secondPageHeaderEndPos = raf.getFilePointer();
        logger.fine("Read 2nd Page:comment and setup and possibly audio:Header finishes at file position:" + secondPageHeaderEndPos);

        //Get header sizes
        raf.seek(0);
        OggVorbisTagReader.OggVorbisHeaderSizes vorbisHeaderSizes = reader.readOggVorbisHeaderSizes(raf);

        //Convert the OggVorbisComment header to raw packet data
        ByteBuffer newComment = tc.convert(tag);

        //Compute new comment length(this may need to be spread over multiple pages)
        int newCommentLength = newComment.capacity();

        //Calculate new size of new 2nd page
        int newSecondPageDataLength = vorbisHeaderSizes.getSetupHeaderSize() + newCommentLength + vorbisHeaderSizes.getExtraPacketDataSize();
        logger.fine("Old 2nd Page no of packets: " + secondPageHeader.getPacketList().size());
        logger.fine("Old 2nd Page size: " + secondPageHeader.getPageLength());
        logger.fine("Old last packet incomplete: " + secondPageHeader.isLastPacketIncomplete());
        logger.fine("Setup Header Size: " + vorbisHeaderSizes.getSetupHeaderSize());
        logger.fine("Extra Packets: " + vorbisHeaderSizes.getExtraPacketList().size());
        logger.fine("Extra Packet Data Size: " + vorbisHeaderSizes.getExtraPacketDataSize());
        logger.fine("Old comment: " + vorbisHeaderSizes.getCommentHeaderSize());
        logger.fine("New comment: " + newCommentLength);
        logger.fine("New Page Data Size: " + newSecondPageDataLength);
        //Second Page containing new vorbis, setup and possibly some extra packets can fit on one page
        if (isCommentAndSetupHeaderFitsOnASinglePage(newCommentLength, vorbisHeaderSizes.getSetupHeaderSize(), vorbisHeaderSizes.getExtraPacketList()))
        {
            //And if comment and setup header originally fitted on both, the length of the 2nd
            //page must be less than maximum size allowed
            //AND
            //there must be two packets with last being complete because they may have
            //elected to split the setup over multiple pages instead of using up whole page - (as long
            //as the last lacing value is 255 they can do this)
            //   OR
            //There are more than the packets in which case have complete setup header and some audio packets
            //we dont care if the last audio packet is split on next page as long as we preserve it
            if ((secondPageHeader.getPageLength() < OggPageHeader.MAXIMUM_PAGE_DATA_SIZE) && (((secondPageHeader.getPacketList().size() == 2) && (!secondPageHeader.isLastPacketIncomplete())) || (secondPageHeader.getPacketList().size() > 2)))
            {
                logger.fine("Header and Setup remain on single page:");
                replaceSecondPageOnly(vorbisHeaderSizes, newCommentLength, newSecondPageDataLength, secondPageHeader, newComment, secondPageHeaderEndPos, raf, rafTemp);
            }
            //Original 2nd page spanned multiple pages so more work to do
            else
            {
                logger.fine("Header and Setup now on single page:");
                replaceSecondPageAndRenumberPageSeqs(vorbisHeaderSizes, newCommentLength, newSecondPageDataLength, secondPageHeader, newComment, raf, rafTemp);
            }
        }
        //Bit more complicated, have to create more than one new page and renumber subsequent audio
        else
        {
            logger.fine("Header and Setup with shift audio:");
            replacePagesAndRenumberPageSeqs(vorbisHeaderSizes, newCommentLength, secondPageHeader, newComment, raf, rafTemp);
        }
    }

    /**
     * Calculate checkSum over the Page
     *
     * @param page
     */
    private void calculateChecksumOverPage(ByteBuffer page)
    {           
        //CRC should be zero before calculating it
        page.putInt(OggPageHeader.FIELD_PAGE_CHECKSUM_POS, 0);

        //Compute CRC over the  page  //TODO shouldnt really use array();
        byte[] crc = OggCRCFactory.computeCRC(page.array());
        for (int i = 0; i < crc.length; i++)
        {
            page.put(OggPageHeader.FIELD_PAGE_CHECKSUM_POS + i, crc[i]);
        }

        //Rewind to start of Page
        page.rewind();
    }

    /**
     * Create a second Page, and add comment header to it, but page is incomplete may want to add addition header and need to calculate CRC
     *
     * @param vorbisHeaderSizes
     * @param newCommentLength
     * @param newSecondPageLength
     * @param secondPageHeader
     * @param newComment
     * @return
     * @throws IOException
     */
    private ByteBuffer startCreateBasicSecondPage(
            OggVorbisTagReader.OggVorbisHeaderSizes vorbisHeaderSizes,
            int newCommentLength,
            int newSecondPageLength,
            OggPageHeader secondPageHeader,
            ByteBuffer newComment) throws IOException
    {
        logger.fine("WriteOgg Type 1");
        byte[] segmentTable = createSegmentTable(newCommentLength, vorbisHeaderSizes.getSetupHeaderSize(), vorbisHeaderSizes.getExtraPacketList());
        int newSecondPageHeaderLength = OggPageHeader.OGG_PAGE_HEADER_FIXED_LENGTH + segmentTable.length;
        logger.fine("New second page header length:" + newSecondPageHeaderLength);
        logger.fine("No of segments:" + segmentTable.length);

        ByteBuffer secondPageBuffer = ByteBuffer.allocate(newSecondPageLength + newSecondPageHeaderLength);
        secondPageBuffer.order(ByteOrder.LITTLE_ENDIAN);

        //Build the new 2nd page header, can mostly be taken from the original upto the segment length OggS capture
        secondPageBuffer.put(secondPageHeader.getRawHeaderData(), 0, OggPageHeader.OGG_PAGE_HEADER_FIXED_LENGTH - 1);

        //Number of Page Segments
        secondPageBuffer.put((byte) segmentTable.length);

        //Page segment table
        for (byte aSegmentTable : segmentTable)
        {
            secondPageBuffer.put(aSegmentTable);
        }

        //Add New VorbisComment
        secondPageBuffer.put(newComment);
        return secondPageBuffer;

    }


    /**
     * Usually can use this method, previously comment and setup header all fit on page 2
     * and they still do, so just replace this page. And copy further pages as is.
     *
     * @param vorbisHeaderSizes
     * @param newCommentLength
     * @param newSecondPageLength
     * @param secondPageHeader
     * @param newComment
     * @param secondPageHeaderEndPos
     * @param raf
     * @param rafTemp
     * @throws IOException
     */
    private void replaceSecondPageOnly(
            OggVorbisTagReader.OggVorbisHeaderSizes vorbisHeaderSizes,
            int newCommentLength,
            int newSecondPageLength,
            OggPageHeader secondPageHeader,
            ByteBuffer newComment,
            long secondPageHeaderEndPos,
            RandomAccessFile raf,
            RandomAccessFile rafTemp) throws IOException
    {
        logger.fine("WriteOgg Type 1");
        ByteBuffer secondPageBuffer = startCreateBasicSecondPage(vorbisHeaderSizes, newCommentLength, newSecondPageLength, secondPageHeader, newComment);

        raf.seek(secondPageHeaderEndPos);
        //Skip comment header
        raf.skipBytes(vorbisHeaderSizes.getCommentHeaderSize());
        //Read in setup header and extra packets
        raf.getChannel().read(secondPageBuffer);
        calculateChecksumOverPage(secondPageBuffer);
        rafTemp.getChannel().write(secondPageBuffer);
        rafTemp.getChannel().transferFrom(raf.getChannel(), rafTemp.getFilePointer(), raf.length() - raf.getFilePointer());
    }

    /**
     * Previously comment and/or setup header was on a number of pages now can just replace this page fitting all
     * on 2nd page, and renumber subsequent sequence pages
     *
     * @param originalHeaderSizes
     * @param newCommentLength
     * @param newSecondPageLength
     * @param secondPageHeader
     * @param newComment
     * @param raf
     * @param rafTemp
     * @throws IOException
     * @throws org.jaudiotagger.audio.exceptions.CannotReadException
     * @throws org.jaudiotagger.audio.exceptions.CannotWriteException
     */
    private void replaceSecondPageAndRenumberPageSeqs(OggVorbisTagReader.OggVorbisHeaderSizes originalHeaderSizes, int newCommentLength, int newSecondPageLength, OggPageHeader secondPageHeader, ByteBuffer newComment, RandomAccessFile raf, RandomAccessFile rafTemp) throws IOException, CannotReadException, CannotWriteException
    {
        logger.fine("WriteOgg Type 2");
        ByteBuffer secondPageBuffer = startCreateBasicSecondPage(originalHeaderSizes, newCommentLength, newSecondPageLength, secondPageHeader, newComment);

        //Add setup header and packets
        int pageSequence = secondPageHeader.getPageSequence();
        byte[] setupHeaderData = reader.convertToVorbisSetupHeaderPacketAndAdditionalPackets(originalHeaderSizes.getSetupHeaderStartPosition(), raf);
        logger.finest(setupHeaderData.length + ":" + secondPageBuffer.position() + ":" + secondPageBuffer.capacity());
        secondPageBuffer.put(setupHeaderData);

        calculateChecksumOverPage(secondPageBuffer);
        rafTemp.getChannel().write(secondPageBuffer);
        writeRemainingPages(pageSequence, raf, rafTemp);
    }

    /**
     * CommentHeader extends over multiple pages OR Comment Header doesnt but it's got larger causing some extra
     * packets to be shifted onto another page.
     *
     * @param originalHeaderSizes
     * @param newCommentLength
     * @param secondPageHeader
     * @param newComment
     * @param raf
     * @param rafTemp
     * @throws IOException
     * @throws CannotReadException
     * @throws CannotWriteException
     */
    private void replacePagesAndRenumberPageSeqs(OggVorbisTagReader.OggVorbisHeaderSizes originalHeaderSizes, int newCommentLength, OggPageHeader secondPageHeader, ByteBuffer newComment, RandomAccessFile raf, RandomAccessFile rafTemp) throws IOException, CannotReadException, CannotWriteException
    {
        int pageSequence = secondPageHeader.getPageSequence();

        //We need to work out how to split the newcommentlength over the pages
        int noOfCompletePagesNeededForComment = newCommentLength / OggPageHeader.MAXIMUM_PAGE_DATA_SIZE;
        logger.config("Comment requires:" + noOfCompletePagesNeededForComment + " complete pages");

        //Create the Pages
        int newCommentOffset = 0;
        if (noOfCompletePagesNeededForComment > 0)
        {
            for (int i = 0; i < noOfCompletePagesNeededForComment; i++)
            {
                //Create ByteBuffer for the New page
                byte[] segmentTable = this.createSegments(OggPageHeader.MAXIMUM_PAGE_DATA_SIZE, false);
                int pageHeaderLength = OggPageHeader.OGG_PAGE_HEADER_FIXED_LENGTH + segmentTable.length;
                ByteBuffer pageBuffer = ByteBuffer.allocate(pageHeaderLength + OggPageHeader.MAXIMUM_PAGE_DATA_SIZE);
                pageBuffer.order(ByteOrder.LITTLE_ENDIAN);

                //Now create the page basing it on the existing 2ndpageheader
                pageBuffer.put(secondPageHeader.getRawHeaderData(), 0, OggPageHeader.OGG_PAGE_HEADER_FIXED_LENGTH - 1);
                //Number of Page Segments
                pageBuffer.put((byte) segmentTable.length);
                //Page segment table
                for (byte aSegmentTable : segmentTable)
                {
                    pageBuffer.put(aSegmentTable);
                }
                //Get next bit of Comment
                ByteBuffer nextPartOfComment = newComment.slice();
                nextPartOfComment.limit(OggPageHeader.MAXIMUM_PAGE_DATA_SIZE);
                pageBuffer.put(nextPartOfComment);

                //Recalculate Page Sequence Number
                pageBuffer.putInt(OggPageHeader.FIELD_PAGE_SEQUENCE_NO_POS, pageSequence);
                pageSequence++;

                //Set Header Flag to indicate continuous (except for first flag)
                if (i != 0)
                {
                    pageBuffer.put(OggPageHeader.FIELD_HEADER_TYPE_FLAG_POS, OggPageHeader.HeaderTypeFlag.CONTINUED_PACKET.getFileValue());
                }
                calculateChecksumOverPage(pageBuffer);
                rafTemp.getChannel().write(pageBuffer);
                newCommentOffset += OggPageHeader.MAXIMUM_PAGE_DATA_SIZE;
                newComment.position(newCommentOffset);
            }
        }

        int lastPageCommentPacketSize = newCommentLength % OggPageHeader.MAXIMUM_PAGE_DATA_SIZE;
        logger.fine("Last comment packet size:" + lastPageCommentPacketSize);

        //End of comment and setup header cannot fit on the last page
        if (!isCommentAndSetupHeaderFitsOnASinglePage(lastPageCommentPacketSize, originalHeaderSizes.getSetupHeaderSize(), originalHeaderSizes.getExtraPacketList()))
        {
            logger.fine("WriteOgg Type 3");

            //Write the last part of comment only (its possible it might be the only comment)
            {
                byte[] segmentTable = createSegments(lastPageCommentPacketSize, true);
                int pageHeaderLength = OggPageHeader.OGG_PAGE_HEADER_FIXED_LENGTH + segmentTable.length;
                ByteBuffer pageBuffer = ByteBuffer.allocate(lastPageCommentPacketSize + pageHeaderLength);
                pageBuffer.order(ByteOrder.LITTLE_ENDIAN);
                pageBuffer.put(secondPageHeader.getRawHeaderData(), 0, OggPageHeader.OGG_PAGE_HEADER_FIXED_LENGTH - 1);
                pageBuffer.put((byte) segmentTable.length);
                for (byte aSegmentTable : segmentTable)
                {
                    pageBuffer.put(aSegmentTable);
                }
                newComment.position(newCommentOffset);
                pageBuffer.put(newComment.slice());
                pageBuffer.putInt(OggPageHeader.FIELD_PAGE_SEQUENCE_NO_POS, pageSequence);

                if(noOfCompletePagesNeededForComment>0)
                {
                    pageBuffer.put(OggPageHeader.FIELD_HEADER_TYPE_FLAG_POS, OggPageHeader.HeaderTypeFlag.CONTINUED_PACKET.getFileValue());
                }
                logger.fine("Writing Last Comment Page "+pageSequence +" to file");
                pageSequence++;
                calculateChecksumOverPage(pageBuffer);
                rafTemp.getChannel().write(pageBuffer);
            }

            //Now write header and extra packets onto next page
            {
                byte[] segmentTable = this.createSegmentTable(originalHeaderSizes.getSetupHeaderSize(),originalHeaderSizes.getExtraPacketList());
                int pageHeaderLength = OggPageHeader.OGG_PAGE_HEADER_FIXED_LENGTH + segmentTable.length;
                byte[] setupHeaderData = reader.convertToVorbisSetupHeaderPacketAndAdditionalPackets(originalHeaderSizes.getSetupHeaderStartPosition(), raf);
                ByteBuffer pageBuffer = ByteBuffer.allocate(setupHeaderData.length + pageHeaderLength);
                pageBuffer.order(ByteOrder.LITTLE_ENDIAN);
                pageBuffer.put(secondPageHeader.getRawHeaderData(), 0, OggPageHeader.OGG_PAGE_HEADER_FIXED_LENGTH - 1);
                pageBuffer.put((byte) segmentTable.length);
                for (byte aSegmentTable : segmentTable)
                {
                    pageBuffer.put(aSegmentTable);
                }
                pageBuffer.put(setupHeaderData);
                pageBuffer.putInt(OggPageHeader.FIELD_PAGE_SEQUENCE_NO_POS, pageSequence);
                //pageBuffer.put(OggPageHeader.FIELD_HEADER_TYPE_FLAG_POS, OggPageHeader.HeaderTypeFlag.CONTINUED_PACKET.getFileValue());
                logger.fine("Writing Setup Header and packets Page "+pageSequence +" to file");

                calculateChecksumOverPage(pageBuffer);
                rafTemp.getChannel().write(pageBuffer);
            }
        }
        else
        {
            //End of Comment and SetupHeader and extra packets can fit on one page
            logger.fine("WriteOgg Type 4");

            //Create last header page
            int newSecondPageDataLength = originalHeaderSizes.getSetupHeaderSize() + lastPageCommentPacketSize + originalHeaderSizes.getExtraPacketDataSize();
            newComment.position(newCommentOffset);
            ByteBuffer lastComment = newComment.slice();
            ByteBuffer lastHeaderBuffer = startCreateBasicSecondPage(
                                                            originalHeaderSizes,
                                                            lastPageCommentPacketSize,
                                                            newSecondPageDataLength,
                                                            secondPageHeader,
                                                            lastComment);
            //Now find the setupheader which is on a different page
            raf.seek(originalHeaderSizes.getSetupHeaderStartPosition());

            //Add setup Header and Extra Packets (although it will fit in this page, it may be over multiple pages in its original form
            //so need to use this function to convert to raw data
            byte[] setupHeaderData = reader.convertToVorbisSetupHeaderPacketAndAdditionalPackets(originalHeaderSizes.getSetupHeaderStartPosition(), raf);
            lastHeaderBuffer.put(setupHeaderData);

            //Page Sequence No
            lastHeaderBuffer.putInt(OggPageHeader.FIELD_PAGE_SEQUENCE_NO_POS, pageSequence);

            //Set Header Flag to indicate continuous (contains end of comment)
            lastHeaderBuffer.put(OggPageHeader.FIELD_HEADER_TYPE_FLAG_POS, OggPageHeader.HeaderTypeFlag.CONTINUED_PACKET.getFileValue());
            calculateChecksumOverPage(lastHeaderBuffer);
            rafTemp.getChannel().write(lastHeaderBuffer);
        }

        //Write the rest of the original file
        writeRemainingPages(pageSequence, raf, rafTemp);
    }

    /**
     * Write all the remaining pages as they are except that the page sequence needs to be modified.
     *
     * @param pageSequence
     * @param raf
     * @param rafTemp
     * @throws IOException
     * @throws CannotReadException
     * @throws CannotWriteException
     */
    public void writeRemainingPages(int pageSequence, RandomAccessFile raf, RandomAccessFile rafTemp) throws IOException, CannotReadException, CannotWriteException
    {
        long startAudio = raf.getFilePointer();
        long startAudioWritten = rafTemp.getFilePointer();

        //TODO there is a risk we wont have enough memory to create these buffers
        ByteBuffer bb       = ByteBuffer.allocate((int) (raf.length() - raf.getFilePointer()));
        ByteBuffer bbTemp   = ByteBuffer.allocate((int)(raf.length() - raf.getFilePointer()));

        //Read in the rest of the data into bytebuffer and rewind it to start
        raf.getChannel().read(bb);
        bb.rewind();
        long bytesToDiscard = 0;
        while(bb.hasRemaining())
        {
            OggPageHeader nextPage=null;
            try
            {
                nextPage = OggPageHeader.read(bb);
            }
            catch(CannotReadException cre)
            {
                //Go back to where were
                bb.position(bb.position() - OggPageHeader.CAPTURE_PATTERN.length);
                //#117:Ogg file with invalid ID3v1 tag at end remove and save
                if(Utils.readThreeBytesAsChars(bb).equals(AbstractID3v1Tag.TAG))
                {
                    bytesToDiscard = bb.remaining() + AbstractID3v1Tag.TAG.length();
                    break;
                }
                else
                {
                    throw cre;
                }
            }
            //Create buffer large enough for next page (header and data) and set byte order to LE so we can use
            //putInt method
            ByteBuffer nextPageHeaderBuffer = ByteBuffer.allocate(nextPage.getRawHeaderData().length + nextPage.getPageLength());
            nextPageHeaderBuffer.order(ByteOrder.LITTLE_ENDIAN);
            nextPageHeaderBuffer.put(nextPage.getRawHeaderData());
            ByteBuffer data = bb.slice();
            data.limit(nextPage.getPageLength());
            nextPageHeaderBuffer.put(data);
            nextPageHeaderBuffer.putInt(OggPageHeader.FIELD_PAGE_SEQUENCE_NO_POS, ++pageSequence);
            calculateChecksumOverPage(nextPageHeaderBuffer);
            bb.position(bb.position() + nextPage.getPageLength());

            nextPageHeaderBuffer.rewind();
            bbTemp.put(nextPageHeaderBuffer);
        }
        //Now just write as a single IO operation
        bbTemp.flip();
        rafTemp.getChannel().write(bbTemp);
        //Check we have written all the data (minus any invalid Tag at end)
        if ((raf.length() - startAudio) != ((rafTemp.length() + bytesToDiscard) - startAudioWritten))
        {
            throw new CannotWriteException("File written counts don't match, file not written:"
                    +"origAudioLength:"+(raf.length() - startAudio)
                    +":newAudioLength:"+((rafTemp.length() + bytesToDiscard) - startAudioWritten)
                    +":bytesDiscarded:"+bytesToDiscard);
        }
    }

    /**
     * This method creates a new segment table for the second page (header).
     *
     * @param newCommentLength  The length of the Vorbis Comment
     * @param setupHeaderLength The length of Setup Header, zero if comment String extends
     *                          over multiple pages and this is not the last page.
     * @param extraPackets      If there are packets immediately after setup header in same page, they
     *                          need including in the segment table
     * @return new segment table.
     */
    private byte[] createSegmentTable(int newCommentLength, int setupHeaderLength, List<OggPageHeader.PacketStartAndLength> extraPackets)
    {
        logger.finest("Create SegmentTable CommentLength:" + newCommentLength + ":SetupHeaderLength:" + setupHeaderLength);
        ByteArrayOutputStream resultBaos = new ByteArrayOutputStream();

        byte[] newStart;
        byte[] restShouldBe;
        byte[] nextPacket;

        //Vorbis Comment
        if (setupHeaderLength == 0)
        {
            //Comment Stream continues onto next page so last lacing value can be 255
            newStart = createSegments(newCommentLength, false);
            return newStart;
        }
        else
        {
            //Comment Stream finishes on this page so if is a multiple of 255
            //have to add an extra entry.
            newStart = createSegments(newCommentLength, true);
        }

        //Setup Header, should be closed
        if (extraPackets.size() > 0)
        {
            restShouldBe = createSegments(setupHeaderLength, true);
        }
        //.. continue sonto next page
        else
        {
            restShouldBe = createSegments(setupHeaderLength, false);
        }

        logger.finest("Created " + newStart.length + " segments for header");
        logger.finest("Created " + restShouldBe.length + " segments for setup");

        try
        {
            resultBaos.write(newStart);
            resultBaos.write(restShouldBe);
            if (extraPackets.size() > 0)
            {
                //Packets are being copied literally not converted from a length, so always pass
                //false parameter, TODO is this statement correct
                logger.finer("Creating segments for " + extraPackets.size() + " packets");
                for (OggPageHeader.PacketStartAndLength packet : extraPackets)
                {
                    nextPacket = createSegments(packet.getLength(), false);
                    resultBaos.write(nextPacket);
                }
            }
        }
        catch (IOException ioe)
        {
            throw new RuntimeException("Unable to create segment table:" + ioe.getMessage());
        }
        return resultBaos.toByteArray();

    }

    /**
     * This method creates a new segment table for the second half of setup header
     *
     * @param setupHeaderLength The length of Setup Header, zero if comment String extends
     *                          over multiple pages and this is not the last page.
     * @param extraPackets      If there are packets immediately after setup header in same page, they
     *                          need including in the segment table
     * @return new segment table.
     */
    private byte[] createSegmentTable(int setupHeaderLength, List<OggPageHeader.PacketStartAndLength> extraPackets)
    {
        ByteArrayOutputStream resultBaos = new ByteArrayOutputStream();

        byte[] restShouldBe;
        byte[] nextPacket;

        //Setup Header
        restShouldBe = createSegments(setupHeaderLength, true);

        try
        {
            resultBaos.write(restShouldBe);
            if (extraPackets.size() > 0)
            {
                //Packets are being copied literally not converted from a length, so always pass
                //false parameter, TODO is this statement correct
                for (OggPageHeader.PacketStartAndLength packet : extraPackets)
                {
                    nextPacket = createSegments(packet.getLength(), false);
                    resultBaos.write(nextPacket);
                }
            }
        }
        catch (IOException ioe)
        {
            throw new RuntimeException("Unable to create segment table:" + ioe.getMessage());
        }
        return resultBaos.toByteArray();
    }


    /**
     * This method creates a byte array of values whose sum should
     * be the value of <code>length</code>.<br>
     *
     * @param length     Size of the page which should be
     *                   represented as 255 byte packets.
     * @param quitStream If true and a length is a multiple of 255 we need another
     *                   segment table entry with the value of 0. Else it's the last stream of the
     *                   table which is already ended.
     * @return Array of packet sizes. However only the last packet will
     *         differ from 255.
     *
     */
    //TODO if pass is data of max length (65025 bytes) and have quitStream==true
    //this will return 256 segments which is illegal, should be checked somewhere
    private byte[] createSegments(int length, boolean quitStream)
    {
        logger.finest("Create Segments for length:" + length + ":QuitStream:" + quitStream);
        //It is valid to have nil length packets
        if (length == 0)
        {
            byte[] result = new byte[1];
            result[0] = (byte) 0x00;
            return result;
        }

        byte[] result = new byte[length / OggPageHeader.MAXIMUM_SEGMENT_SIZE + ((length % OggPageHeader.MAXIMUM_SEGMENT_SIZE == 0 && !quitStream) ? 0 : 1)];
        int i = 0;
        for (; i < result.length - 1; i++)
        {
            result[i] = (byte) 0xFF;
        }
        result[result.length - 1] = (byte) (length - (i * OggPageHeader.MAXIMUM_SEGMENT_SIZE));
        return result;
    }

    /**
     * @param commentLength
     * @param setupHeaderLength
     * @param extraPacketList
     * @return true if there is enough room to fit the comment and the setup headers on one page taking into
     *         account the maximum no of segments allowed per page and zero lacing values.
     */
    private boolean isCommentAndSetupHeaderFitsOnASinglePage(int commentLength, int setupHeaderLength, List<OggPageHeader.PacketStartAndLength> extraPacketList)
    {
        int totalDataSize = 0;

        if (commentLength == 0)
        {
            totalDataSize++;
        }
        else
        {
            totalDataSize = (commentLength / OggPageHeader.MAXIMUM_SEGMENT_SIZE) + 1;
            if (commentLength % OggPageHeader.MAXIMUM_SEGMENT_SIZE == 0)
            {
                totalDataSize++;
            }
        }
        logger.finest("Require:" + totalDataSize + " segments for comment");

        if (setupHeaderLength == 0)
        {
            totalDataSize++;
        }
        else
        {
            totalDataSize += (setupHeaderLength / OggPageHeader.MAXIMUM_SEGMENT_SIZE) + 1;
            if (setupHeaderLength % OggPageHeader.MAXIMUM_SEGMENT_SIZE == 0)
            {
                totalDataSize++;
            }
        }
        logger.finest("Require:" + totalDataSize + " segments for comment plus setup");

        for (OggPageHeader.PacketStartAndLength extraPacket : extraPacketList)
        {
            if (extraPacket.getLength() == 0)
            {
                totalDataSize++;
            }
            else
            {
                totalDataSize += (extraPacket.getLength() / OggPageHeader.MAXIMUM_SEGMENT_SIZE) + 1;
                if (extraPacket.getLength() % OggPageHeader.MAXIMUM_SEGMENT_SIZE == 0)
                {
                    totalDataSize++;
                }
            }
        }

        logger.finest("Total No Of Segment If New Comment And Header Put On One Page:" + totalDataSize);
        return totalDataSize <= OggPageHeader.MAXIMUM_NO_OF_SEGMENT_SIZE;
    }

}