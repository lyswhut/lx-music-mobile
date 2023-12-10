package org.jaudiotagger.audio.asf.data;

import org.jaudiotagger.audio.asf.util.ChunkPositionComparator;
import org.jaudiotagger.audio.asf.util.Utils;

import java.math.BigInteger;
import java.util.*;

/**
 * Stores multiple ASF objects (chunks) in form of {@link Chunk} objects, and is
 * itself an ASF object (chunk).<br>
 * <br>
 * Because current implementation is solely used for ASF metadata, all chunks
 * (except for {@link StreamChunk}) may only be {@linkplain #addChunk(Chunk)
 * inserted} once.
 *
 * @author Christian Laireiter
 */
public class ChunkContainer extends Chunk
{

    /**
     * Stores the {@link GUID} instances, which are allowed multiple times
     * within an ASF header.
     */
    private final static Set<GUID> MULTI_CHUNKS;

    static
    {
        MULTI_CHUNKS = new HashSet<GUID>();
        MULTI_CHUNKS.add(GUID.GUID_STREAM);
    }

    /**
     * Tests whether all stored chunks have a unique starting position among
     * their brothers.
     *
     * @param container the container to test.
     * @return <code>true</code> if all chunks are located at an unique
     * position. However, no intersection is tested.
     */
    protected static boolean chunkstartsUnique(final ChunkContainer container)
    {
        boolean result = true;
        final Set<Long> chunkStarts = new HashSet<Long>();
        final Collection<Chunk> chunks = container.getChunks();
        for (final Chunk curr : chunks)
        {
            result &= chunkStarts.add(curr.getPosition());
        }
        return result;
    }

    /**
     * Stores the {@link Chunk} objects to their {@link GUID}.
     */
    private final Map<GUID, List<Chunk>> chunkTable;

    /**
     * Creates an instance.
     *
     * @param chunkGUID the GUID which identifies the chunk.
     * @param pos       the position of the chunk within the stream.
     * @param length    the length of the chunk.
     */
    public ChunkContainer(final GUID chunkGUID, final long pos, final BigInteger length)
    {
        super(chunkGUID, pos, length);
        this.chunkTable = new Hashtable<GUID, List<Chunk>>();
    }

    /**
     * Adds a chunk to the container.<br>
     *
     * @param toAdd The chunk which is to be added.
     * @throws IllegalArgumentException If a chunk of same type is already added, except for
     *                                  {@link StreamChunk}.
     */
    public void addChunk(final Chunk toAdd)
    {
        final List<Chunk> list = assertChunkList(toAdd.getGuid());
        if (!list.isEmpty() && !MULTI_CHUNKS.contains(toAdd.getGuid()))
        {
            throw new IllegalArgumentException("The GUID of the given chunk indicates, that there is no more instance allowed."); //$NON-NLS-1$
        }
        list.add(toAdd);
        assert chunkstartsUnique(this) : "Chunk has equal start position like an already inserted one."; //$NON-NLS-1$
    }

    /**
     * This method asserts that a {@link List} exists for the given {@link GUID}
     * , in {@link #chunkTable}.<br>
     *
     * @param lookFor The GUID to get list for.
     * @return an already existing, or newly created list.
     */
    protected List<Chunk> assertChunkList(final GUID lookFor)
    {
        List<Chunk> result = this.chunkTable.get(lookFor);
        if (result == null)
        {
            result = new ArrayList<Chunk>();
            this.chunkTable.put(lookFor, result);
        }
        return result;
    }

    /**
     * Returns a collection of all contained chunks.<br>
     *
     * @return all contained chunks
     */
    public Collection<Chunk> getChunks()
    {
        final List<Chunk> result = new ArrayList<Chunk>();
        for (final List<Chunk> curr : this.chunkTable.values())
        {
            result.addAll(curr);
        }
        return result;
    }

    /**
     * Looks for the first stored chunk which has the given GUID.
     *
     * @param lookFor    GUID to look up.
     * @param instanceOf The class which must additionally be matched.
     * @return <code>null</code> if no chunk was found, or the stored instance
     * doesn't match.
     */
    protected Chunk getFirst(final GUID lookFor, final Class<? extends Chunk> instanceOf)
    {
        Chunk result = null;
        final List<Chunk> list = this.chunkTable.get(lookFor);
        if (list != null && !list.isEmpty())
        {
            final Chunk chunk = list.get(0);
            if (instanceOf.isAssignableFrom(chunk.getClass()))
            {
                result = chunk;
            }
        }
        return result;
    }

    /**
     * This method checks if a chunk has been {@linkplain #addChunk(Chunk)
     * added} with specified {@linkplain Chunk#getGuid() GUID}.<br>
     *
     * @param lookFor GUID to look up.
     * @return <code>true</code> if chunk with specified GUID has been added.
     */
    public boolean hasChunkByGUID(final GUID lookFor)
    {
        return this.chunkTable.containsKey(lookFor);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String prettyPrint(final String prefix)
    {
        return prettyPrint(prefix, "");
    }

    /**
     * Nearly the same as {@link #prettyPrint(String)} however, additional
     * information can be injected below the {@link Chunk#prettyPrint(String)}
     * output and the listing of the contained chunks.<br>
     *
     * @param prefix        The prefix to prepend.
     * @param containerInfo Information to inject.
     * @return Information of current Chunk Object.
     */
    public String prettyPrint(final String prefix, final String containerInfo)
    {
        final StringBuilder result = new StringBuilder(super.prettyPrint(prefix));
        result.append(containerInfo);
        result.append(prefix).append("  |").append(Utils.LINE_SEPARATOR);
        final ArrayList<Chunk> list = new ArrayList<Chunk>(getChunks());
        Collections.sort(list, new ChunkPositionComparator());

        for (Chunk curr : list)
        {
            result.append(curr.prettyPrint(prefix + "  |"));
            result.append(prefix).append("  |").append(Utils.LINE_SEPARATOR);
        }
        return result.toString();
    }
}
