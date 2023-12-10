package org.jaudiotagger.audio.asf.io;

import org.jaudiotagger.audio.asf.data.GUID;
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * This class creates a modified copy of an ASF file.<br>
 *
 * @author Christian Laireiter
 */
public class AsfStreamer
{

    /**
     * Simply copies a chunk from <code>source</code> to
     * <code>destination</code>.<br>
     * The method assumes, that the GUID has already been read and will write
     * the provided one to the destination.<br>
     * The chunk length however will be read and used to determine the amount of
     * bytes to copy.
     *
     * @param guid        GUID of the current chunk.
     * @param source      source of an ASF chunk, which is to be located at the chunk
     *                    length field.
     * @param destination the destination to copy the chunk to.
     * @throws IOException on I/O errors.
     */
    private void copyChunk(final GUID guid, final InputStream source, final OutputStream destination) throws IOException
    {
        final long chunkSize = Utils.readUINT64(source);
        destination.write(guid.getBytes());
        Utils.writeUINT64(chunkSize, destination);
        Utils.copy(source, destination, chunkSize - 24);
    }

    /**
     * Reads the <code>source</code> and applies the modifications provided by
     * the given <code>modifiers</code>, and puts it to <code>dest</code>.<br>
     * Each {@linkplain ChunkModifier modifier} is used only once, so if one
     * should be used multiple times, it should be added multiple times into the
     * list.<br>
     *
     * @param source    the source ASF file
     * @param dest      the destination to write the modified version to.
     * @param modifiers list of chunk modifiers to apply.
     * @throws IOException on I/O errors.
     */
    public void createModifiedCopy(final InputStream source, final OutputStream dest, final List<ChunkModifier> modifiers) throws IOException
    {
        final List<ChunkModifier> modders = new ArrayList<ChunkModifier>();
        if (modifiers != null)
        {
            modders.addAll(modifiers);
        }
        // Read and check ASF GUID
        final GUID readGUID = Utils.readGUID(source);
        if (GUID.GUID_HEADER.equals(readGUID))
        {
            // used to calculate differences
            long totalDiff = 0;
            long chunkDiff = 0;

            // read header information
            final long headerSize = Utils.readUINT64(source);
            final long chunkCount = Utils.readUINT32(source);
            final byte[] reserved = new byte[2];
            reserved[0] = (byte) (source.read() & 0xFF);
            reserved[1] = (byte) (source.read() & 0xFF);

            /*
             * bos will get all unmodified and modified header chunks. This is
             * necessary, because the header chunk (and file properties chunk)
             * need to be adjusted but are written in front of the others.
             */
            final ByteArrayOutputStream bos = new ByteArrayOutputStream();
            // fileHeader will get the binary representation of the file
            // properties chunk, without GUID
            byte[] fileHeader = null;

            // Iterate through all chunks
            for (long i = 0; i < chunkCount; i++)
            {
                // Read GUID
                final GUID curr = Utils.readGUID(source);
                // special case for file properties chunk
                if (GUID.GUID_FILE.equals(curr))
                {
                    final ByteArrayOutputStream tmp = new ByteArrayOutputStream();
                    final long size = Utils.readUINT64(source);
                    Utils.writeUINT64(size, tmp);
                    Utils.copy(source, tmp, size - 24);
                    fileHeader = tmp.toByteArray();
                }
                else
                {
                    /*
                     * Now look for ChunkModifier objects which modify the
                     * current chunk
                     */
                    boolean handled = false;
                    for (int j = 0; j < modders.size() && !handled; j++)
                    {
                        if (modders.get(j).isApplicable(curr))
                        {
                            // alter current chunk
                            final ModificationResult result = modders.get(j).modify(curr, source, bos);
                            // remember size differences.
                            chunkDiff += result.getChunkCountDifference();
                            totalDiff += result.getByteDifference();
                            // remove current modifier from index.
                            modders.remove(j);
                            handled = true;
                        }
                    }
                    if (!handled)
                    {
                        // copy chunks which are not modified.
                        copyChunk(curr, source, bos);
                    }
                }
            }
            // Now apply the left modifiers.
            for (final ChunkModifier curr : modders)
            {
                // chunks, which were not in the source file, will be added to
                // the destination
                final ModificationResult result = curr.modify(null, null, bos);
                chunkDiff += result.getChunkCountDifference();
                totalDiff += result.getByteDifference();
            }
            /*
             * Now all header objects have been read or manipulated and stored
             * in the internal buffer (bos).
             */
            // write ASF GUID
            dest.write(readGUID.getBytes());
            // write altered header object size
            Utils.writeUINT64(headerSize + totalDiff, dest);
            // write altered number of chunks
            Utils.writeUINT32(chunkCount + chunkDiff, dest);
            // write the reserved 2 bytes (0x01,0x02).
            dest.write(reserved);
            // write the new file header
            modifyFileHeader(new ByteArrayInputStream(fileHeader), dest, totalDiff);
            // write the header objects (chunks)
            dest.write(bos.toByteArray());
            // copy the rest of the file (data and index)
            Utils.flush(source, dest);
        }
        else
        {
            throw new IllegalArgumentException("No ASF header object.");
        }
    }

    /**
     * This is a slight variation of
     * {@link #copyChunk(GUID, InputStream, OutputStream)}, it only handles file
     * property chunks correctly.<br>
     * The copied chunk will have the file size field modified by the given
     * <code>fileSizeDiff</code> value.
     *
     * @param source       source of file properties chunk, located at its chunk length
     *                     field.
     * @param destination  the destination to copy the chunk to.
     * @param fileSizeDiff the difference which should be applied. (negative values would
     *                     subtract the stored file size)
     * @throws IOException on I/O errors.
     */
    private void modifyFileHeader(final InputStream source, final OutputStream destination, final long fileSizeDiff) throws IOException
    {
        destination.write(GUID.GUID_FILE.getBytes());
        final long chunkSize = Utils.readUINT64(source);
        Utils.writeUINT64(chunkSize, destination);
        destination.write(Utils.readGUID(source).getBytes());
        final long fileSize = Utils.readUINT64(source);
        Utils.writeUINT64(fileSize + fileSizeDiff, destination);
        Utils.copy(source, destination, chunkSize - 48);
    }

}
