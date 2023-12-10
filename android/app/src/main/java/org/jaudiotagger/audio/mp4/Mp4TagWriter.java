/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Raphaël Slinckx <raphael@slinckx.net>
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
package org.jaudiotagger.audio.mp4;

import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.exceptions.CannotWriteException;
import org.jaudiotagger.audio.mp4.atom.*;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.TagOptionSingleton;
import org.jaudiotagger.tag.mp4.Mp4Tag;
import org.jaudiotagger.tag.mp4.Mp4TagCreator;
import org.jaudiotagger.utils.tree.DefaultMutableTreeNode;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.List;
import java.util.logging.Logger;


/**
 * Writes metadata from mp4, the metadata tags are held under the {@code ilst} atom as shown below, (note all free atoms are
 * optional).
 * <p/>
 * When writing changes the size of all the atoms up to {@code ilst} has to be recalculated, then if the size of
 * the metadata is increased the size of the free atom (below {@code meta}) should be reduced accordingly or vice versa.
 * If the size of the metadata has increased by more than the size of the {@code free} atom then the size of {@code meta},
 * {@code udta} and {@code moov} should be recalculated and the top level {@code free} atom reduced accordingly.
 * If there is not enough space even if using both of the {@code free} atoms, then the {@code mdat} atom has to be
 * shifted down accordingly to make space, and the {@code stco} atoms have to have their offsets to {@code mdat}
 * chunks table adjusted accordingly.
 * <p/>
 * Exceptions are that the meta/udta/ilst do not currently exist, in which udta/meta/ilst are created. Note it is valid
 * to have meta/ilst without udta but this is less common so we always try to write files according to the Apple/iTunes
 * specification. *
 * <p/>
 * <p/>
 * <pre>
 * |--- ftyp
 * |--- free
 * |--- moov
 * |......|
 * |......|----- mvdh
 * |......|----- trak (there may be more than one trak atom, e.g. Native Instrument STEM files)
 * |......|.......|
 * |......|.......|-- tkhd
 * |......|.......|-- mdia
 * |......|............|
 * |......|............|-- mdhd
 * |......|............|-- hdlr
 * |......|............|-- minf
 * |......|.................|
 * |......|.................|-- smhd
 * |......|.................|-- dinf
 * |......|.................|-- stbl
 * |......|......................|
 * |......|......................|-- stsd
 * |......|......................|-- stts
 * |......|......................|-- stsc
 * |......|......................|-- stsz
 * |......|......................|-- stco (important! may need to be adjusted.)
 * |......|
 * |......|----- udta
 * |..............|
 * |..............|-- meta
 * |....................|
 * |....................|-- hdlr
 * |....................|-- ilst
 * |....................|.. ..|
 * |....................|.....|---- @nam (Optional for each metadatafield)
 * |....................|.....|.......|-- data
 * |....................|.....|....... ecetera
 * |....................|.....|---- ---- (Optional for reverse dns field)
 * |....................|.............|-- mean
 * |....................|.............|-- name
 * |....................|.............|-- data
 * |....................|................ ecetera
 * |....................|-- free
 * |--- free
 * |--- mdat
 * </pre>
 */
public class Mp4TagWriter
{
    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.tag.mp4");

    private Mp4TagCreator tc = new Mp4TagCreator();


    /**
     * Replace the {@code ilst} metadata.
     * <p/>
     * Because it is the same size as the original data nothing else has to be modified.
     *
     * @param fileReadChannel
     * @param fileWriteChannel
     * @param newIlstData
     * @throws CannotWriteException
     * @throws IOException
     */
    private void writeMetadataSameSize(FileChannel fileReadChannel, FileChannel fileWriteChannel, Mp4BoxHeader ilstHeader, ByteBuffer newIlstData, Mp4BoxHeader tagsHeader) throws CannotWriteException, IOException
    {
        logger.config("Writing:Option 1:Same Size");

        fileReadChannel.position(0);
        fileWriteChannel.transferFrom(fileReadChannel, 0, ilstHeader.getFilePos());
        fileWriteChannel.position(ilstHeader.getFilePos());
        fileWriteChannel.write(newIlstData);
        fileReadChannel.position(ilstHeader.getFileEndPos());

        writeDataAfterIlst(fileReadChannel, fileWriteChannel, tagsHeader);
    }

    /**
     * If the existing files contains a tags atom and chp1 atom underneath the meta atom that means the file was
     * encoded by Nero. Applications such as foobar read this non-standard tag before the more usual data within
     * {@code ilst} causing problems. So the solution is to convert the tags atom and its children into a free atom whilst
     * leaving the chp1 atom alone.
     *
     * @param fileReadChannel
     * @param fileWriteChannel
     * @param tagsHeader
     * @throws IOException
     */
    private void writeNeroData(FileChannel fileReadChannel, FileChannel fileWriteChannel, Mp4BoxHeader tagsHeader) throws IOException, CannotWriteException
    {
        //Write from after ilst upto tags atom
        long writeBetweenIlstAndTags = tagsHeader.getFilePos() - fileReadChannel.position();
        fileWriteChannel.transferFrom(fileReadChannel, fileWriteChannel.position(), writeBetweenIlstAndTags);
        fileWriteChannel.position(fileWriteChannel.position() + writeBetweenIlstAndTags);

        //Replace tags atom (and children) by a free atom
        convertandWriteTagsAtomToFreeAtom(fileWriteChannel, tagsHeader);

        //Write after tags atom
        fileReadChannel.position(tagsHeader.getFileEndPos());
        writeDataInChunks(fileReadChannel, fileWriteChannel);
    }

    /**
     * When the size of the metadata has changed and it can't be compensated for by {@code free} atom
     * we have to adjust the size of the size field up to the moovheader level for the {@code udta} atom and
     * its child {@code meta} atom.
     *
     * @param moovHeader
     * @param moovBuffer
     * @param sizeAdjustment can be negative or positive     *
     * @param udtaHeader
     * @param metaHeader
     * @return
     * @throws IOException
     */
    private void adjustSizeOfMoovHeader(Mp4BoxHeader moovHeader, ByteBuffer moovBuffer, int sizeAdjustment, Mp4BoxHeader udtaHeader, Mp4BoxHeader metaHeader) throws IOException
    {
        //Adjust moov header size, adjusts the underlying buffer
        moovHeader.setLength(moovHeader.getLength() + sizeAdjustment);

        //Edit the fields in moovBuffer (note moovbuffer doesnt include header)
        if (udtaHeader != null)
        {
            //Write the updated udta atom header to moov buffer
            udtaHeader.setLength(udtaHeader.getLength() + sizeAdjustment);
            moovBuffer.position((int) (udtaHeader.getFilePos() - moovHeader.getFilePos() - Mp4BoxHeader.HEADER_LENGTH));
            moovBuffer.put(udtaHeader.getHeaderData());
        }

        if (metaHeader != null)
        {
            //Write the updated udta atom header to moov buffer
            metaHeader.setLength(metaHeader.getLength() + sizeAdjustment);
            moovBuffer.position((int) (metaHeader.getFilePos() - moovHeader.getFilePos() - Mp4BoxHeader.HEADER_LENGTH));
            moovBuffer.put(metaHeader.getHeaderData());
        }
    }


    private void createMetadataAtoms(Mp4BoxHeader moovHeader, ByteBuffer moovBuffer, int sizeAdjustment, Mp4BoxHeader udtaHeader, Mp4BoxHeader metaHeader) throws IOException
    {
        //Adjust moov header size
        moovHeader.setLength(moovHeader.getLength() + sizeAdjustment);

    }

    /**
     * Existing metadata larger than new metadata, so we can just add a free atom.
     *
     * @param fileReadChannel
     * @param fileWriteChannel
     * @param moovHeader
     * @param udtaHeader
     * @param metaHeader
     * @param ilstHeader
     * @param mdatHeader
     * @param neroTagsHeader
     * @param moovBuffer
     * @param newIlstData
     * @param stcos
     * @param sizeOfExistingMetaLevelFreeAtom
     * @throws IOException
     * @throws CannotWriteException
     */
    private void writeOldMetadataLargerThanNewMetadata(FileChannel fileReadChannel, FileChannel fileWriteChannel, Mp4BoxHeader moovHeader, Mp4BoxHeader udtaHeader, Mp4BoxHeader metaHeader, Mp4BoxHeader ilstHeader, Mp4BoxHeader mdatHeader, Mp4BoxHeader neroTagsHeader, ByteBuffer moovBuffer, ByteBuffer newIlstData, List<Mp4StcoBox> stcos, int sizeOfExistingMetaLevelFreeAtom) throws IOException, CannotWriteException
    {
        logger.config("Writing:Option 1:Smaller Size");

        int ilstPositionRelativeToAfterMoovHeader = (int) (ilstHeader.getFilePos() - (moovHeader.getFilePos() + Mp4BoxHeader.HEADER_LENGTH));
        //Create an amended freeBaos atom and write it if it previously existed as a free atom immediately
        //after ilst as a child of meta

        int sizeRequiredByNewIlstAtom = newIlstData.limit();

        if (sizeOfExistingMetaLevelFreeAtom > 0)
        {
            logger.config("Writing:Option 2:Smaller Size have free atom:" + ilstHeader.getLength() + ":" + sizeRequiredByNewIlstAtom);
            writeDataUptoIncludingIlst(fileReadChannel, fileWriteChannel, ilstHeader, newIlstData);

            //Write the modified free atom that comes after ilst
            int newFreeSize = sizeOfExistingMetaLevelFreeAtom + (ilstHeader.getLength() - sizeRequiredByNewIlstAtom);
            Mp4FreeBox newFreeBox = new Mp4FreeBox(newFreeSize - Mp4BoxHeader.HEADER_LENGTH);
            fileWriteChannel.write(newFreeBox.getHeader().getHeaderData());
            fileWriteChannel.write(newFreeBox.getData());

            //Skip over the read channel old free atom
            fileReadChannel.position(fileReadChannel.position() + sizeOfExistingMetaLevelFreeAtom);
            writeDataAfterIlst(fileReadChannel, fileWriteChannel, neroTagsHeader);
        }
        //No free atom we need to create a new one or adjust top level free atom
        else
        {
            int newFreeSize = (ilstHeader.getLength() - sizeRequiredByNewIlstAtom) - Mp4BoxHeader.HEADER_LENGTH;
            //We need to create a new one, so dont have to adjust all the headers but only works if the size
            //of tags has decreased by more 8 characters so there is enough room for the free boxes header we take
            //into account size of new header in calculating size of box
            if (newFreeSize > 0)
            {
                logger.config("Writing:Option 3:Smaller Size can create free atom");
                writeDataUptoIncludingIlst(fileReadChannel, fileWriteChannel, ilstHeader, newIlstData);

                //Create new free box
                Mp4FreeBox newFreeBox = new Mp4FreeBox(newFreeSize);
                fileWriteChannel.write(newFreeBox.getHeader().getHeaderData());
                fileWriteChannel.write(newFreeBox.getData());
                writeDataAfterIlst(fileReadChannel, fileWriteChannel, neroTagsHeader);
            }
            //Ok everything in this bit of tree has to be recalculated because eight or less bytes smaller
            else
            {
                logger.config("Writing:Option 4:Smaller Size <=8 cannot create free atoms");

                //Size will be this amount smaller
                int sizeReducedBy = ilstHeader.getLength() - sizeRequiredByNewIlstAtom;

                //Write stuff before Moov (ftyp)
                fileReadChannel.position(0);
                fileWriteChannel.transferFrom(fileReadChannel, 0, moovHeader.getFilePos());
                fileWriteChannel.position(moovHeader.getFilePos());

                //Edit stcos atoms within moov header, we need to adjust offsets by the amount mdat is going to be shifted
                //unless mdat is at start of file
                if (mdatHeader.getFilePos() > moovHeader.getFilePos())
                {
                    for (final Mp4StcoBox stoc : stcos) {
                        stoc.adjustOffsets(-sizeReducedBy);
                    }
                }

                //Edit and rewrite the moov, udta and meta header in moov buffer
                adjustSizeOfMoovHeader(moovHeader, moovBuffer, -sizeReducedBy, udtaHeader, metaHeader);
                fileWriteChannel.write(moovHeader.getHeaderData());
                moovBuffer.rewind();
                moovBuffer.limit(ilstPositionRelativeToAfterMoovHeader);
                fileWriteChannel.write(moovBuffer);

                //Write ilst data
                fileWriteChannel.write(newIlstData);

                //Write rest of moov, as we may have adjusted stcos atoms that occur after ilst
                moovBuffer.limit(moovBuffer.capacity());
                moovBuffer.position(ilstPositionRelativeToAfterMoovHeader + ilstHeader.getLength());
                fileWriteChannel.write(moovBuffer);

                //Write the rest after moov
                fileReadChannel.position(moovHeader.getFileEndPos() + sizeReducedBy);
                writeDataAfterIlst(fileReadChannel, fileWriteChannel, neroTagsHeader);
            }
        }
    }

    /**
     * We can fit the metadata in under the meta item just by using some of the padding available in the {@code free}
     * atom under the {@code meta} atom need to take of the side of free header otherwise might end up with
     * solution where can fit in data, but can't fit in free atom header.
     *
     * @param fileReadChannel
     * @param fileWriteChannel
     * @param neroTagsHeader
     * @param sizeOfExistingMetaLevelFreeAtom
     * @param newIlstData
     * @param additionalSpaceRequiredForMetadata
     * @throws IOException
     * @throws CannotWriteException
     */
    private void writeNewMetadataLargerButCanUseFreeAtom(FileChannel fileReadChannel, FileChannel fileWriteChannel, Mp4BoxHeader ilstHeader, Mp4BoxHeader neroTagsHeader, int sizeOfExistingMetaLevelFreeAtom, ByteBuffer newIlstData, int additionalSpaceRequiredForMetadata) throws IOException, CannotWriteException
    {
        int newFreeSize = sizeOfExistingMetaLevelFreeAtom - (additionalSpaceRequiredForMetadata);
        logger.config("Writing:Option 5;Larger Size can use meta free atom need extra:" + newFreeSize + "bytes");

        writeDataUptoIncludingIlst(fileReadChannel, fileWriteChannel, ilstHeader, newIlstData);

        //Create an amended smaller freeBaos atom and write it to file
        Mp4FreeBox newFreeBox = new Mp4FreeBox(newFreeSize - Mp4BoxHeader.HEADER_LENGTH);
        fileWriteChannel.write(newFreeBox.getHeader().getHeaderData());
        fileWriteChannel.write(newFreeBox.getData());

        //Skip over the read channel old free atom
        fileReadChannel.position(fileReadChannel.position() + sizeOfExistingMetaLevelFreeAtom);
        writeDataAfterIlst(fileReadChannel, fileWriteChannel, neroTagsHeader);
    }

    /**
     * Write tag to {@code rafTemp} file.
     *
     * @param tag     tag data
     * @param raf     current file
     * @param rafTemp temporary file for writing
     * @throws CannotWriteException
     * @throws IOException
     */
    public void write(Tag tag, RandomAccessFile raf, RandomAccessFile rafTemp) throws CannotWriteException, IOException
    {
        logger.config("Started writing tag data");
        FileChannel fileReadChannel = raf.getChannel();
        FileChannel fileWriteChannel = rafTemp.getChannel();

        int sizeOfExistingIlstAtom = 0;
        int sizeRequiredByNewIlstAtom;
        int positionOfNewIlstAtomRelativeToMoovAtom;
        int positionInExistingFileOfWhereNewIlstAtomShouldBeWritten;
        int sizeOfExistingMetaLevelFreeAtom;
        int positionOfTopLevelFreeAtom;
        int sizeOfExistingTopLevelFreeAtom;
        long endOfMoov = 0;
        //Found top level free atom that comes after moov and before mdat, (also true if no free atom ?)
        boolean topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata;
        Mp4BoxHeader topLevelFreeHeader;
        Mp4AtomTree atomTree;

        //Build AtomTree
        try
        {
            atomTree = new Mp4AtomTree(raf, false);
        }
        catch (CannotReadException cre)
        {
            throw new CannotWriteException(cre.getMessage());
        }

        Mp4BoxHeader mdatHeader = atomTree.getBoxHeader(atomTree.getMdatNode());
        //Unable to find audio so no chance of saving any changes
        if (mdatHeader == null)
        {
            throw new CannotWriteException(ErrorMessage.MP4_CHANGES_TO_FILE_FAILED_CANNOT_FIND_AUDIO.getMsg());
        }

        //Go through every field constructing the data that will appear starting from ilst box
        ByteBuffer newIlstData = tc.convert(tag);
        newIlstData.rewind();
        sizeRequiredByNewIlstAtom = newIlstData.limit();

        //Moov Box header
        Mp4BoxHeader moovHeader = atomTree.getBoxHeader(atomTree.getMoovNode());
        List<Mp4StcoBox> stcos = atomTree.getStcos();
        Mp4BoxHeader ilstHeader = atomTree.getBoxHeader(atomTree.getIlstNode());
        Mp4BoxHeader udtaHeader = atomTree.getBoxHeader(atomTree.getUdtaNode());
        Mp4BoxHeader metaHeader = atomTree.getBoxHeader(atomTree.getMetaNode());
        Mp4BoxHeader hdlrMetaHeader = atomTree.getBoxHeader(atomTree.getHdlrWithinMetaNode());
        Mp4BoxHeader neroTagsHeader = atomTree.getBoxHeader(atomTree.getTagsNode());
        Mp4BoxHeader trakHeader = atomTree.getBoxHeader(atomTree.getTrakNodes().get(atomTree.getTrakNodes().size()-1));
        ByteBuffer moovBuffer = atomTree.getMoovBuffer();


        //Work out if we/what kind of metadata hierarchy we currently have in the file
        //Udta
        if (udtaHeader != null)
        {
            //Meta
            if (metaHeader != null)
            {
                //ilst - record where ilst is,and where it ends
                if (ilstHeader != null)
                {
                    sizeOfExistingIlstAtom = ilstHeader.getLength();

                    //Relative means relative to moov buffer after moov header
                    positionInExistingFileOfWhereNewIlstAtomShouldBeWritten = (int) ilstHeader.getFilePos();
                    positionOfNewIlstAtomRelativeToMoovAtom = (int) (positionInExistingFileOfWhereNewIlstAtomShouldBeWritten - (moovHeader.getFilePos() + Mp4BoxHeader.HEADER_LENGTH));
                }
                else
                {
                    //Place ilst immediately after existing hdlr atom
                    if (hdlrMetaHeader != null)
                    {
                        positionInExistingFileOfWhereNewIlstAtomShouldBeWritten = (int) hdlrMetaHeader.getFileEndPos();
                        positionOfNewIlstAtomRelativeToMoovAtom = (int) (positionInExistingFileOfWhereNewIlstAtomShouldBeWritten - (moovHeader.getFilePos() + Mp4BoxHeader.HEADER_LENGTH));
                    }
                    //Place ilst after data fields in meta atom
                    //TODO Should we create a hdlr atom
                    else
                    {
                        positionInExistingFileOfWhereNewIlstAtomShouldBeWritten = (int) metaHeader.getFilePos() + Mp4BoxHeader.HEADER_LENGTH + Mp4MetaBox.FLAGS_LENGTH;
                        positionOfNewIlstAtomRelativeToMoovAtom = (int) ((positionInExistingFileOfWhereNewIlstAtomShouldBeWritten) - (moovHeader.getFilePos() + Mp4BoxHeader.HEADER_LENGTH));
                    }
                }
            }
            else
            {
                //There no ilst or meta header so we set to position where it would be if it existed
                positionOfNewIlstAtomRelativeToMoovAtom = moovHeader.getLength() - Mp4BoxHeader.HEADER_LENGTH;
                positionInExistingFileOfWhereNewIlstAtomShouldBeWritten = (int) (moovHeader.getFileEndPos());
            }
        }
        //There no udta header so we are going to create a new structure, but we have to be aware that there might be
        //an existing meta box structure in which case we preserve it but with our new structure before it.
        else
        {
            //Create new structure just after the end of the last trak atom, as that means
            // all modifications to trak atoms and its children (stco atoms) are *explicitly* written
            // as part of the moov atom (and not just bulk copied via writeDataAfterIlst())
            if (metaHeader != null)
            {
                positionInExistingFileOfWhereNewIlstAtomShouldBeWritten = (int) trakHeader.getFileEndPos();
                positionOfNewIlstAtomRelativeToMoovAtom = (int) (positionInExistingFileOfWhereNewIlstAtomShouldBeWritten - (moovHeader.getFilePos() + Mp4BoxHeader.HEADER_LENGTH));
            }
            else
            {
                //There no udta,ilst or meta header so we set to position where it would be if it existed
                positionInExistingFileOfWhereNewIlstAtomShouldBeWritten = (int) (moovHeader.getFileEndPos());
                positionOfNewIlstAtomRelativeToMoovAtom = moovHeader.getLength() - Mp4BoxHeader.HEADER_LENGTH;
            }
        }

        //Find size of Level-4 Free atom (if any) immediately after ilst atom
        sizeOfExistingMetaLevelFreeAtom = getMetaLevelFreeAtomSize(atomTree);


        //Level-1 free atom
        positionOfTopLevelFreeAtom = 0;
        sizeOfExistingTopLevelFreeAtom = 0;
        topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata = true;
        for (DefaultMutableTreeNode freeNode : atomTree.getFreeNodes())
        {
            DefaultMutableTreeNode parentNode = (DefaultMutableTreeNode) freeNode.getParent();
            if (parentNode.isRoot())
            {
                topLevelFreeHeader = ((Mp4BoxHeader) freeNode.getUserObject());
                sizeOfExistingTopLevelFreeAtom = topLevelFreeHeader.getLength();
                positionOfTopLevelFreeAtom = (int) topLevelFreeHeader.getFilePos();
                break;
            }
        }

        if (sizeOfExistingTopLevelFreeAtom > 0)
        {
            if (positionOfTopLevelFreeAtom > mdatHeader.getFilePos())
            {
                topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata = false;
            }
            else if (positionOfTopLevelFreeAtom < moovHeader.getFilePos())
            {
                topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata = false;
            }
        }
        else
        {
            positionOfTopLevelFreeAtom = (int) mdatHeader.getFilePos();
        }

        logger.config("Read header successfully ready for writing");
        //The easiest option since no difference in the size of the metadata so all we have to do is
        //create a new file identical to first file but with replaced ilst
        if (sizeOfExistingIlstAtom == sizeRequiredByNewIlstAtom)
        {
            writeMetadataSameSize(fileReadChannel, fileWriteChannel, ilstHeader, newIlstData, neroTagsHeader);
        }
        //.. we just need to increase the size of the free atom below the meta atom, and replace the metadata
        //no other changes necessary and total file size remains the same
        else if (sizeOfExistingIlstAtom > sizeRequiredByNewIlstAtom)
        {
            writeOldMetadataLargerThanNewMetadata(fileReadChannel,
                    fileWriteChannel,
                    moovHeader,
                    udtaHeader,
                    metaHeader,
                    ilstHeader,
                    mdatHeader,
                    neroTagsHeader,
                    moovBuffer,
                    newIlstData,
                    stcos,
                    sizeOfExistingMetaLevelFreeAtom);
        }
        //Size of metadata has increased, the most complex situation, more atoms affected
        else
        {
            int additionalSpaceRequiredForMetadata = sizeRequiredByNewIlstAtom - sizeOfExistingIlstAtom;
            if (additionalSpaceRequiredForMetadata <= (sizeOfExistingMetaLevelFreeAtom - Mp4BoxHeader.HEADER_LENGTH))
            {
                writeNewMetadataLargerButCanUseFreeAtom(
                        fileReadChannel,
                        fileWriteChannel,
                        ilstHeader,
                        neroTagsHeader,
                        sizeOfExistingMetaLevelFreeAtom,
                        newIlstData,
                        additionalSpaceRequiredForMetadata);
            }
            //There is not enough padding in the metadata free atom anyway
            else
            {
                int additionalMetaSizeThatWontFitWithinMetaAtom = additionalSpaceRequiredForMetadata - (sizeOfExistingMetaLevelFreeAtom);

                //Write stuff before Moov (ftyp)
                writeUpToMoovHeader(fileReadChannel, fileWriteChannel, moovHeader);
                if (udtaHeader == null)
                {
                    writeNoExistingUdtaAtom(fileReadChannel,
                                            fileWriteChannel,
                                            newIlstData,
                                            moovHeader,
                                            moovBuffer,
                                            mdatHeader,
                                            stcos,
                                            sizeOfExistingTopLevelFreeAtom,
                                            topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata,
                                            neroTagsHeader,
                                            sizeOfExistingMetaLevelFreeAtom,
                                            positionInExistingFileOfWhereNewIlstAtomShouldBeWritten,
                                            sizeOfExistingIlstAtom,
                                            positionOfTopLevelFreeAtom,
                                            additionalMetaSizeThatWontFitWithinMetaAtom);
                }
                else if (metaHeader == null)
                {
                    writeNoExistingMetaAtom(
                            udtaHeader,
                            fileReadChannel,
                            fileWriteChannel,
                            newIlstData,
                            moovHeader,
                            moovBuffer,
                            mdatHeader,
                            stcos,
                            sizeOfExistingTopLevelFreeAtom,
                            topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata,
                            neroTagsHeader,
                            sizeOfExistingMetaLevelFreeAtom,
                            positionInExistingFileOfWhereNewIlstAtomShouldBeWritten,
                            sizeOfExistingIlstAtom,
                            positionOfTopLevelFreeAtom,
                            additionalMetaSizeThatWontFitWithinMetaAtom);
                }
                else
                {
                    writeHaveExistingMetadata(udtaHeader,
                            metaHeader,
                            fileReadChannel,
                            fileWriteChannel,
                            positionOfNewIlstAtomRelativeToMoovAtom,
                            moovHeader,
                            moovBuffer,
                            mdatHeader,
                            stcos,
                            additionalMetaSizeThatWontFitWithinMetaAtom,
                            sizeOfExistingTopLevelFreeAtom,
                            topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata,
                            newIlstData,
                            neroTagsHeader,
                            sizeOfExistingMetaLevelFreeAtom,
                            positionInExistingFileOfWhereNewIlstAtomShouldBeWritten,
                            sizeOfExistingIlstAtom);
                }

            }
        }
        //Close all channels to original file
        fileReadChannel.close();
        raf.close();

        //Ensure we have written correctly, reject if not
        checkFileWrittenCorrectly(rafTemp, mdatHeader, fileWriteChannel, stcos);
    }

    private void writeUpToMoovHeader(FileChannel fileReadChannel,
                                     FileChannel fileWriteChannel,
                                     Mp4BoxHeader moovHeader)
            throws IOException, CannotWriteException
    {
        //Write stuff before Moov (ftyp)
        fileReadChannel.position(0);
        fileWriteChannel.transferFrom(fileReadChannel, 0, moovHeader.getFilePos());
        fileWriteChannel.position(moovHeader.getFilePos());
    }

    /**
     * Write the remainder of data in read channel to write channel data in {@link TagOptionSingleton#getWriteChunkSize()}
     * chunks, needed if writing large amounts of data.
     *
     * @param fileReadChannel
     * @param fileWriteChannel
     * @throws IOException
     * @throws CannotWriteException
     */
    private void writeDataInChunks(FileChannel fileReadChannel, FileChannel fileWriteChannel) throws IOException, CannotWriteException
    {
        long amountToBeWritten = fileReadChannel.size() - fileReadChannel.position();
        long written = 0;
        long chunksize = TagOptionSingleton.getInstance().getWriteChunkSize();
        long count = amountToBeWritten / chunksize;

        long mod = amountToBeWritten % chunksize;
        for (int i = 0; i < count; i++)
        {
            written += fileWriteChannel.transferFrom(fileReadChannel, fileWriteChannel.position(), chunksize);
            fileWriteChannel.position(fileWriteChannel.position() + chunksize);
        }

        if(mod > 0)
        {
            written += fileWriteChannel.transferFrom(fileReadChannel, fileWriteChannel.position(), mod);
            if (written != amountToBeWritten)
            {
                throw new CannotWriteException("Was meant to write " + amountToBeWritten + " bytes but only written " + written + " bytes");
            }
        }
    }

    /**
     * Replace tags atom (and children) by a {@code free} atom.
     *
     * @param fileWriteChannel
     * @param tagsHeader
     * @throws IOException
     */
    private void convertandWriteTagsAtomToFreeAtom(FileChannel fileWriteChannel, Mp4BoxHeader tagsHeader) throws IOException
    {
        Mp4FreeBox freeBox = new Mp4FreeBox(tagsHeader.getDataLength());
        fileWriteChannel.write(freeBox.getHeader().getHeaderData());
        fileWriteChannel.write(freeBox.getData());
    }

    /**
     * Write the data including new {@code ilst}.
     * <p>Can be used as long as we don't have to adjust the size of {@code moov} header.
     *
     * @param fileReadChannel
     * @param fileWriteChannel
     * @param ilstHeader
     * @param newIlstAtomData
     * @throws IOException
     */
    private void writeDataUptoIncludingIlst(FileChannel fileReadChannel, FileChannel fileWriteChannel, Mp4BoxHeader ilstHeader, ByteBuffer newIlstAtomData) throws IOException
    {
        fileReadChannel.position(0);
        fileWriteChannel.transferFrom(fileReadChannel, 0, ilstHeader.getFilePos());
        fileWriteChannel.position(ilstHeader.getFilePos());
        fileWriteChannel.write(newIlstAtomData);
        fileReadChannel.position(ilstHeader.getFileEndPos());
    }

    /**
     * Write data after {@code ilst} up to the end of the file.
     * <p/>
     * <p>Can be used if don't need to adjust size of {@code moov} header of modify top level {@code free} atoms
     *
     * @param fileReadChannel
     * @param fileWriteChannel
     * @param tagsHeader
     * @throws IOException
     */
    private void writeDataAfterIlst(FileChannel fileReadChannel, FileChannel fileWriteChannel, Mp4BoxHeader tagsHeader) throws IOException, CannotWriteException
    {
        if (tagsHeader != null)
        {
            //Write from after free upto tags atom
            writeNeroData(fileReadChannel, fileWriteChannel, tagsHeader);
        }
        else
        {
            //Now write the rest of the file which won't have changed
            writeDataInChunks(fileReadChannel, fileWriteChannel);
        }
    }

    /**
     * Determine the size of the {@code free} atom immediately after {@code ilst} atom at the same level (if any),
     * we can use this if {@code ilst} needs to grow or shrink because of more less metadata.
     *
     * @param atomTree
     * @return
     */
    private int getMetaLevelFreeAtomSize(Mp4AtomTree atomTree)
    {
        int oldMetaLevelFreeAtomSize;//Level 4 - Free
        oldMetaLevelFreeAtomSize = 0;

        for (DefaultMutableTreeNode freeNode : atomTree.getFreeNodes())
        {
            DefaultMutableTreeNode parentNode = (DefaultMutableTreeNode) freeNode.getParent();
            DefaultMutableTreeNode brotherNode = freeNode.getPreviousSibling();
            if (!parentNode.isRoot())
            {
                Mp4BoxHeader parentHeader = ((Mp4BoxHeader) parentNode.getUserObject());
                Mp4BoxHeader freeHeader = ((Mp4BoxHeader) freeNode.getUserObject());

                //We are only interested in free atoms at this level if they come after the ilst node
                if (brotherNode != null)
                {
                    Mp4BoxHeader brotherHeader = ((Mp4BoxHeader) brotherNode.getUserObject());

                    if (parentHeader.getId().equals(Mp4AtomIdentifier.META.getFieldName()) && brotherHeader.getId().equals(Mp4AtomIdentifier.ILST.getFieldName()))
                    {
                        oldMetaLevelFreeAtomSize = freeHeader.getLength();
                        break;
                    }
                }
            }
        }
        return oldMetaLevelFreeAtomSize;
    }

    /**
     * Check file written correctly.
     *
     * @param rafTemp
     * @param mdatHeader
     * @param fileWriteChannel
     * @param stcos
     * @throws CannotWriteException
     * @throws IOException
     */
    private void checkFileWrittenCorrectly(RandomAccessFile rafTemp, Mp4BoxHeader mdatHeader, FileChannel fileWriteChannel, List<Mp4StcoBox> stcos) throws CannotWriteException, IOException
    {

        logger.config("Checking file has been written correctly");

        try
        {
            //Create a tree from the new file
            Mp4AtomTree newAtomTree;
            newAtomTree = new Mp4AtomTree(rafTemp, false);

            //Check we still have audio data file, and check length
            Mp4BoxHeader newMdatHeader = newAtomTree.getBoxHeader(newAtomTree.getMdatNode());
            if (newMdatHeader == null)
            {
                throw new CannotWriteException(ErrorMessage.MP4_CHANGES_TO_FILE_FAILED_NO_DATA.getMsg());
            }
            if (newMdatHeader.getLength() != mdatHeader.getLength())
            {
                throw new CannotWriteException(ErrorMessage.MP4_CHANGES_TO_FILE_FAILED_DATA_CORRUPT.getMsg());
            }

            //Should always have udta atom after writing to file
            Mp4BoxHeader newUdtaHeader = newAtomTree.getBoxHeader(newAtomTree.getUdtaNode());
            if (newUdtaHeader == null)
            {
                throw new CannotWriteException(ErrorMessage.MP4_CHANGES_TO_FILE_FAILED_NO_TAG_DATA.getMsg());
            }

            //Should always have meta atom after writing to file
            Mp4BoxHeader newMetaHeader = newAtomTree.getBoxHeader(newAtomTree.getMetaNode());
            if (newMetaHeader == null)
            {
                throw new CannotWriteException(ErrorMessage.MP4_CHANGES_TO_FILE_FAILED_NO_TAG_DATA.getMsg());
            }

            // Check that we at the very least have the same number of chunk offsets
            final List<Mp4StcoBox> newStcos = newAtomTree.getStcos();
            if (newStcos.size() != stcos.size())
            {
                // at the very least, we have to have the same number of 'stco' atoms
                throw new CannotWriteException(ErrorMessage.MP4_CHANGES_TO_FILE_FAILED_INCORRECT_NUMBER_OF_TRACKS.getMsg(stcos.size(), newStcos.size()));
            }
            //Check offsets are correct, may not match exactly in original file so just want to make
            //sure that the discrepancy if any is preserved

            // compare the first new stco offset with mdat,
            // and ensure that all following ones have a constant shift

            int shift = 0;
            for (int i=0; i<newStcos.size(); i++)
            {
                final Mp4StcoBox newStco = newStcos.get(i);
                final Mp4StcoBox stco = stcos.get(i);
                logger.finer("stco:Original First Offset" + stco.getFirstOffSet());
                logger.finer("stco:Original Diff" + (int) (stco.getFirstOffSet() - mdatHeader.getFilePos()));
                logger.finer("stco:Original Mdat Pos" + mdatHeader.getFilePos());
                logger.finer("stco:New First Offset" + newStco.getFirstOffSet());
                logger.finer("stco:New Diff" + (int) ((newStco.getFirstOffSet() - newMdatHeader.getFilePos())));
                logger.finer("stco:New Mdat Pos" + newMdatHeader.getFilePos());

                if (i == 0)
                {
                    final int diff = (int) (stco.getFirstOffSet() - mdatHeader.getFilePos());
                    if ((newStco.getFirstOffSet() - newMdatHeader.getFilePos()) != diff)
                    {
                        int discrepancy = (int) ((newStco.getFirstOffSet() - newMdatHeader.getFilePos()) - diff);
                        throw new CannotWriteException(ErrorMessage.MP4_CHANGES_TO_FILE_FAILED_INCORRECT_OFFSETS.getMsg(discrepancy));
                    }
                    shift = stco.getFirstOffSet() - newStco.getFirstOffSet();
                }
                else {
                    if (shift != stco.getFirstOffSet() - newStco.getFirstOffSet())
                    {
                        throw new CannotWriteException(ErrorMessage.MP4_CHANGES_TO_FILE_FAILED_INCORRECT_OFFSETS.getMsg(shift));
                    }
                }
            }
        }
        catch (Exception e)
        {
            if (e instanceof CannotWriteException)
            {
                throw (CannotWriteException) e;
            }
            else
            {
                e.printStackTrace();
                throw new CannotWriteException(ErrorMessage.MP4_CHANGES_TO_FILE_FAILED.getMsg() + ":" + e.getMessage());
            }
        }
        finally
        {
            //Close references to new file
            rafTemp.close();
            fileWriteChannel.close();
        }
        logger.config("File has been written correctly");
    }

    /**
     * Delete the tag.
     * <p/>
     * <p>This is achieved by writing an empty {@code ilst} atom.
     *
     * @param raf
     * @param rafTemp
     * @throws IOException
     */
    public void delete(RandomAccessFile raf, RandomAccessFile rafTemp) throws IOException
    {
        Mp4Tag tag = new Mp4Tag();

        try
        {
            write(tag, raf, rafTemp);
        }
        catch (CannotWriteException cwe)
        {
            throw new IOException(cwe.getMessage());
        }
    }

    /**
     * Use when we need to write metadata and there is no existing {@code udta} atom so we have to create the complete
     * udta/metadata structure.
     *
     * @param fileWriteChannel
     * @param newIlstData
     * @param moovHeader
     * @param moovBuffer
     * @param mdatHeader
     * @param stcos
     * @param sizeOfExistingTopLevelFreeAtom
     * @param topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata
     * @throws IOException
     * @throws CannotWriteException
     */
    private void writeNoExistingUdtaAtom(FileChannel fileReadChannel,
                                         FileChannel fileWriteChannel,
                                         ByteBuffer newIlstData,
                                         Mp4BoxHeader moovHeader,
                                         ByteBuffer moovBuffer,
                                         Mp4BoxHeader mdatHeader,
                                         List<Mp4StcoBox> stcos,
                                         int sizeOfExistingTopLevelFreeAtom,
                                         boolean topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata,
                                         Mp4BoxHeader neroTagsHeader,
                                         int sizeOfExistingMetaLevelFreeAtom,
                                         int positionInExistingFileOfWhereNewIlstAtomShouldBeWritten,
                                         int existingSizeOfIlstData,
                                         int topLevelFreeSize,
                                         int additionalMetaSizeThatWontFitWithinMetaAtom)
            throws IOException, CannotWriteException

    {
        logger.severe("Writing:Option 5.1;No udta atom");
        long endOfMoov = moovHeader.getFileEndPos();
        Mp4HdlrBox hdlrBox = Mp4HdlrBox.createiTunesStyleHdlrBox();
        Mp4MetaBox metaBox = Mp4MetaBox.createiTunesStyleMetaBox(hdlrBox.getHeader().getLength() + newIlstData.limit());
        Mp4BoxHeader udtaHeader = new Mp4BoxHeader(Mp4AtomIdentifier.UDTA.getFieldName());
        udtaHeader.setLength(Mp4BoxHeader.HEADER_LENGTH + metaBox.getHeader().getLength());

        boolean isMdatDataMoved = adjustStcosIfNoSuitableTopLevelAtom(sizeOfExistingTopLevelFreeAtom, topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata, udtaHeader.getLength(), stcos, moovHeader, mdatHeader);

        //Edit the Moov header to length and rewrite to account for new udta atom
        moovHeader.setLength(moovHeader.getLength() + udtaHeader.getLength());
        fileWriteChannel.write(moovHeader.getHeaderData());
        moovBuffer.rewind();
        fileWriteChannel.write(moovBuffer);

        //Write new atoms required for holding metadata in itunes format
        fileWriteChannel.write(udtaHeader.getHeaderData());
        fileWriteChannel.write(metaBox.getHeader().getHeaderData());
        fileWriteChannel.write(metaBox.getData());
        fileWriteChannel.write(hdlrBox.getHeader().getHeaderData());
        fileWriteChannel.write(hdlrBox.getData());

        //Now write ilst data
        fileWriteChannel.write(newIlstData);

        //Skip over the read channel existing ilst(if exists) and metadata free atom
        fileReadChannel.position(positionInExistingFileOfWhereNewIlstAtomShouldBeWritten + existingSizeOfIlstData  + sizeOfExistingMetaLevelFreeAtom);
        //Write the remainder of any data in the moov buffer thats comes after existing ilst/metadata level free atoms
        //but we replace any neroTags atoms with free atoms as these cause problems
        if (neroTagsHeader != null)
        {
            writeFromEndOfIlstToNeroTagsAndMakeNeroFree(endOfMoov, fileReadChannel, fileWriteChannel, neroTagsHeader);
        }
        else
        {
            //Write the remaining children under moov that come after ilst/free which wont have changed
            long extraData = endOfMoov - fileReadChannel.position();
            fileWriteChannel.transferFrom(fileReadChannel, fileWriteChannel.position(), extraData);
            fileWriteChannel.position(fileWriteChannel.position() + extraData);
        }

        if (!isMdatDataMoved)
        {
            adjustFreeAtom(fileReadChannel, fileWriteChannel, topLevelFreeSize, additionalMetaSizeThatWontFitWithinMetaAtom);
        }
        else
        {
            logger.config("Writing:Option 9;Top Level Free comes after Mdat or before Metadata or not large enough");
        }
        writeDataInChunks(fileReadChannel, fileWriteChannel);
    }

    /**
     * Use when we need to write metadata, we have a {@code udta} atom but there is no existing meta atom so we
     * have to create the complete metadata structure.
     *
     * @param fileWriteChannel
     * @param newIlstData
     * @param moovHeader
     * @param moovBuffer
     * @param mdatHeader
     * @param stcos
     * @param sizeOfExistingTopLevelFreeAtom
     * @param topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata
     * @throws IOException
     * @throws CannotWriteException
     */
    private void writeNoExistingMetaAtom(Mp4BoxHeader udtaHeader,
                                         FileChannel fileReadChannel,
                                         FileChannel fileWriteChannel,
                                         ByteBuffer newIlstData,
                                         Mp4BoxHeader moovHeader,
                                         ByteBuffer moovBuffer,
                                         Mp4BoxHeader mdatHeader,
                                         List<Mp4StcoBox> stcos,
                                         int sizeOfExistingTopLevelFreeAtom,
                                         boolean topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata,
                                         Mp4BoxHeader neroTagsHeader,
                                         int sizeOfExistingMetaLevelFreeAtom,
                                         int positionInExistingFileOfWhereNewIlstAtomShouldBeWritten,
                                         int existingSizeOfIlstData,
                                         int topLevelFreeSize,
                                         int additionalMetaSizeThatWontFitWithinMetaAtom) throws IOException, CannotWriteException

    {
        //Create a new udta atom
        logger.severe("Writing:Option 5.2;No meta atom");

        long endOfMoov = moovHeader.getFileEndPos();

        int newIlstDataSize = newIlstData.limit();
        int existingMoovHeaderDataLength = moovHeader.getDataLength();

        //Udta didnt have a meta atom but it may have some other data we want to preserve (I think)
        int existingUdtaLength     = udtaHeader.getLength();
        int existingUdtaDataLength = udtaHeader.getDataLength();

        Mp4HdlrBox hdlrBox = Mp4HdlrBox.createiTunesStyleHdlrBox();
        Mp4MetaBox metaBox = Mp4MetaBox.createiTunesStyleMetaBox(hdlrBox.getHeader().getLength() + newIlstDataSize);
        udtaHeader = new Mp4BoxHeader(Mp4AtomIdentifier.UDTA.getFieldName());
        udtaHeader.setLength(Mp4BoxHeader.HEADER_LENGTH + metaBox.getHeader().getLength() + existingUdtaDataLength);

        int increaseInSizeOfUdtaAtom = udtaHeader.getDataLength() - existingUdtaDataLength;

        boolean isMdatDataMoved = adjustStcosIfNoSuitableTopLevelAtom(sizeOfExistingTopLevelFreeAtom, topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata, increaseInSizeOfUdtaAtom, stcos, moovHeader, mdatHeader);

        //Edit and rewrite the Moov header upto start of Udta
        moovHeader.setLength(moovHeader.getLength() + increaseInSizeOfUdtaAtom);
        fileWriteChannel.write(moovHeader.getHeaderData());
        moovBuffer.rewind();
        moovBuffer.limit(existingMoovHeaderDataLength - existingUdtaLength);
        fileWriteChannel.write(moovBuffer);

        //Write new atoms required for holding metadata in iTunes format
        fileWriteChannel.write(udtaHeader.getHeaderData());

        //Write any atoms if they previously existed within udta atom
        if(moovBuffer.position() + Mp4BoxHeader.HEADER_LENGTH < moovBuffer.capacity())
        {
            moovBuffer.limit(moovBuffer.capacity());
            moovBuffer.position(moovBuffer.position() + Mp4BoxHeader.HEADER_LENGTH);
            fileWriteChannel.write(moovBuffer);
        }

        //Write our newly constructed meta/hdlr headers (required for ilst)
        fileWriteChannel.write(metaBox.getHeader().getHeaderData());
        fileWriteChannel.write(metaBox.getData());
        fileWriteChannel.write(hdlrBox.getHeader().getHeaderData());
        fileWriteChannel.write(hdlrBox.getData());

        //Now write ilst data
        fileWriteChannel.write(newIlstData);

        //Skip over the read channel existing ilst(if exists) and metadata free atom
        fileReadChannel.position(positionInExistingFileOfWhereNewIlstAtomShouldBeWritten + existingSizeOfIlstData  + sizeOfExistingMetaLevelFreeAtom);
        //Write the remainder of any data in the moov buffer thats comes after existing ilst/metadata level free atoms
        //but we replace any neroTags atoms with free atoms as these cause problems
        if (neroTagsHeader != null)
        {
            writeFromEndOfIlstToNeroTagsAndMakeNeroFree(endOfMoov, fileReadChannel, fileWriteChannel, neroTagsHeader);
        }
        else
        {
            //Now write the rest of children under moov thats come after ilst/free which wont have changed
            long extraData = endOfMoov - fileReadChannel.position();
            fileWriteChannel.transferFrom(fileReadChannel, fileWriteChannel.position(), extraData);
            fileWriteChannel.position(fileWriteChannel.position() + extraData);
        }

        if (!isMdatDataMoved)
        {
            adjustFreeAtom(fileReadChannel, fileWriteChannel, topLevelFreeSize, additionalMetaSizeThatWontFitWithinMetaAtom);
        }
        else
        {
            logger.config("Writing:Option 9;Top Level Free comes after Mdat or before Metadata or not large enough");
        }
        writeDataInChunks(fileReadChannel, fileWriteChannel);
    }

    /**
     * We have existing structure but we need more space.
     *
     * @param udtaHeader
     * @param fileWriteChannel
     * @param positionOfNewIlstAtomRelativeToMoovAtom
     * @param moovHeader
     * @param moovBuffer
     * @param mdatHeader
     * @param stcos
     * @param additionalMetaSizeThatWontFitWithinMetaAtom
     * @param topLevelFreeSize
     * @param topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata
     * @throws IOException
     * @throws CannotWriteException
     */
    private void  writeHaveExistingMetadata(Mp4BoxHeader udtaHeader,
                                           Mp4BoxHeader metaHeader,
                                           FileChannel fileReadChannel,
                                           FileChannel fileWriteChannel,
                                           int positionOfNewIlstAtomRelativeToMoovAtom,
                                           Mp4BoxHeader moovHeader,
                                           ByteBuffer moovBuffer,
                                           Mp4BoxHeader mdatHeader,
                                           List<Mp4StcoBox> stcos,
                                           int additionalMetaSizeThatWontFitWithinMetaAtom,
                                           int topLevelFreeSize,
                                           boolean topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata,
                                           ByteBuffer newIlstData,
                                           Mp4BoxHeader neroTagsHeader,
                                           int sizeOfExistingMetaLevelFreeAtom,
                                           int positionInExistingFileOfWhereNewIlstAtomShouldBeWritten,
                                           int existingSizeOfIlstData)
            throws IOException, CannotWriteException
    {
        logger.config("Writing:Option 5.3;udta and meta atom exists");

        boolean isMdatDataMoved = adjustStcosIfNoSuitableTopLevelAtom(topLevelFreeSize, topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata, additionalMetaSizeThatWontFitWithinMetaAtom, stcos, moovHeader, mdatHeader);

        long endOfMoov = moovHeader.getFileEndPos();

        //Edit and rewrite the Moov header inc udta and meta headers)
        adjustSizeOfMoovHeader(moovHeader, moovBuffer, additionalMetaSizeThatWontFitWithinMetaAtom, udtaHeader, metaHeader);
        fileWriteChannel.write(moovHeader.getHeaderData());

        //Now write from this edited buffer up until location of start of ilst atom
        moovBuffer.rewind();
        moovBuffer.limit(positionOfNewIlstAtomRelativeToMoovAtom);
        fileWriteChannel.write(moovBuffer);

        //Now write ilst data
        fileWriteChannel.write(newIlstData);

        //Write the remainder of any data in the moov buffer thats comes after existing ilst/metadata level free atoms
        //but we replace any neroTags atoms with free atoms as these cause problems
        if (neroTagsHeader != null)
        {
            //Skip over the read channel existing ilst(if exists) and metadata free atom
            fileReadChannel.position(positionInExistingFileOfWhereNewIlstAtomShouldBeWritten + existingSizeOfIlstData  + sizeOfExistingMetaLevelFreeAtom);
            // TODO: Does this handle changed stco tags correctly that occur *after* ilst?
            writeFromEndOfIlstToNeroTagsAndMakeNeroFree(endOfMoov, fileReadChannel, fileWriteChannel, neroTagsHeader);
        }
        else
        {
            //Write the remaining children under moov that come after ilst/free
            //These might have changed, if they contain stco atoms
            moovBuffer.limit(moovBuffer.capacity());
            moovBuffer.position(positionOfNewIlstAtomRelativeToMoovAtom + existingSizeOfIlstData + sizeOfExistingMetaLevelFreeAtom);
            fileWriteChannel.write(moovBuffer);
            fileReadChannel.position(moovHeader.getFileEndPos() - additionalMetaSizeThatWontFitWithinMetaAtom);
        }

        if (!isMdatDataMoved)
        {
            adjustFreeAtom(fileReadChannel, fileWriteChannel, topLevelFreeSize, additionalMetaSizeThatWontFitWithinMetaAtom);
        }
        else
        {
            logger.config("Writing:Option 9;Top Level Free comes after Mdat or before Metadata or not large enough");
        }
        writeDataInChunks(fileReadChannel, fileWriteChannel);
    }

    /**
     * If any data between existing {@code ilst} atom and {@code tags} atom write it to new file, then convert
     * {@code tags} atom to a {@code free} atom.
     *
     * @param endOfMoov
     * @param fileReadChannel
     * @param fileWriteChannel
     * @param neroTagsHeader
     * @throws IOException
     */
    private void writeFromEndOfIlstToNeroTagsAndMakeNeroFree(long endOfMoov, FileChannel fileReadChannel, FileChannel fileWriteChannel, Mp4BoxHeader neroTagsHeader)
            throws IOException
    {
        //Write from after ilst upto tags atom
        long writeBetweenIlstAndTags = neroTagsHeader.getFilePos() - fileReadChannel.position();
        fileWriteChannel.transferFrom(fileReadChannel, fileWriteChannel.position(), writeBetweenIlstAndTags);
        fileWriteChannel.position(fileWriteChannel.position() + writeBetweenIlstAndTags);
        convertandWriteTagsAtomToFreeAtom(fileWriteChannel, neroTagsHeader);

        //Write after tags atom upto end of moov
        fileReadChannel.position(neroTagsHeader.getFileEndPos());
        long extraData = endOfMoov - fileReadChannel.position();
        fileWriteChannel.transferFrom(fileReadChannel, fileWriteChannel.position(), extraData);
    }

    /**
     * We adjust {@code free} atom, allowing us to not need to move {@code mdat} atom.
     *
     * @param fileReadChannel
     * @param fileWriteChannel
     * @param topLevelFreeSize
     * @param additionalMetaSizeThatWontFitWithinMetaAtom
     * @throws IOException
     * @throws CannotWriteException
     */
    private void adjustFreeAtom(FileChannel fileReadChannel, FileChannel fileWriteChannel, int topLevelFreeSize, int additionalMetaSizeThatWontFitWithinMetaAtom)
            throws IOException, CannotWriteException
    {
        //If the shift is less than the space available in this second free atom data size we just
        //shrink the free atom accordingly
        if (topLevelFreeSize - Mp4BoxHeader.HEADER_LENGTH >= additionalMetaSizeThatWontFitWithinMetaAtom)
        {
            logger.config("Writing:Option 6;Larger Size can use top free atom");
            Mp4FreeBox freeBox = new Mp4FreeBox((topLevelFreeSize - Mp4BoxHeader.HEADER_LENGTH) - additionalMetaSizeThatWontFitWithinMetaAtom);
            fileWriteChannel.write(freeBox.getHeader().getHeaderData());
            fileWriteChannel.write(freeBox.getData());

            //Skip over the read channel old free atom
            fileReadChannel.position(fileReadChannel.position() + topLevelFreeSize);
        }
        //If the space required is identical to total size of the free space (inc header)
        //we could just remove the header
        else if (topLevelFreeSize == additionalMetaSizeThatWontFitWithinMetaAtom)
        {
            logger.config("Writing:Option 7;Larger Size uses top free atom including header");
            //Skip over the read channel old free atom
            fileReadChannel.position(fileReadChannel.position() + topLevelFreeSize);
        }
        else
        {
            //MDAT comes before MOOV, nothing to do because data has already been written
        }
    }

    /**
     * May need to rewrite the {@code stco} offsets, if the location of {@code mdat} (audio) header is going to move.
     *
     * @param topLevelFreeSize
     * @param topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata
     * @param additionalSizeRequired
     * @param stcos
     * @param moovHeader
     * @param mdatHeader
     *
     * @return {@code true}, if offsets were adjusted because unable to fit in new
     * metadata without shifting {@code mdat} header further down
     */
    private boolean adjustStcosIfNoSuitableTopLevelAtom(int topLevelFreeSize,
                                                        boolean topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata,
                                                        int additionalSizeRequired,
                                                        List<Mp4StcoBox> stcos,
                                                        Mp4BoxHeader moovHeader,
                                                        Mp4BoxHeader mdatHeader)
    {
        //We don't bother using the top level free atom coz not big enough anyway, we need to adjust offsets
        //by the amount mdat is going to be shifted as long as mdat is after moov
        if (mdatHeader.getFilePos() > moovHeader.getFilePos())
        {
            //Edit stco atoms within moov header, if the free atom comes after mdat OR
            //(there is not enough space in the top level free atom
            //or special case (of not matching exactly the free atom plus header so could remove free atom completely)
            if ((!topLevelFreeAtomComesBeforeMdatAtomAndAfterMetadata) ||
                    ((topLevelFreeSize - Mp4BoxHeader.HEADER_LENGTH < additionalSizeRequired)
                            && (topLevelFreeSize != additionalSizeRequired)))
            {
                for (final Mp4StcoBox stoc : stcos)
                {
                    stoc.adjustOffsets(additionalSizeRequired);
                }
                return true;
            }
        }
        return false;
    }
}
