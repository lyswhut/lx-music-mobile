package org.jaudiotagger.tag.aiff;

import org.jaudiotagger.audio.iff.ChunkHeader;
import org.jaudiotagger.audio.iff.ChunkSummary;
import org.jaudiotagger.logging.Hex;
import org.jaudiotagger.tag.*;
import org.jaudiotagger.tag.id3.*;
import org.jaudiotagger.tag.images.Artwork;
import org.jaudiotagger.tag.reference.ID3V2Version;

import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Wraps ID3Tag for most of its metadata.
 */
public class AiffTag implements Tag, Id3SupportingTag
{
    private List<ChunkSummary> chunkSummaryList = new ArrayList<ChunkSummary>();

    public void addChunkSummary(ChunkSummary cs)
    {
        chunkSummaryList.add(cs);
    }

    public List<ChunkSummary> getChunkSummaryList()
    {
        return chunkSummaryList;
    }

    private boolean isIncorrectlyAlignedTag = false;

    private boolean isExistingId3Tag = false;

    /**
     * @return true if the file that this tag was written from already contains an ID3 chunk
     */
    public boolean isExistingId3Tag()
    {
        return isExistingId3Tag;
    }

    public void setExistingId3Tag(boolean isExistingId3Tag)
    {
        this.isExistingId3Tag = isExistingId3Tag;
    }

    private AbstractID3v2Tag id3Tag;

    public AiffTag()
    {
    }

    public AiffTag(AbstractID3v2Tag t)
    {
        id3Tag = t;
    }

    /**
     * Returns the ID3 tag
     */
    public AbstractID3v2Tag getID3Tag()
    {
        return id3Tag;
    }

    /**
     * Sets the ID3 tag
     */
    public void setID3Tag(AbstractID3v2Tag t)
    {
        id3Tag = t;
    }

    @Override
    public void addField(TagField field) throws FieldDataInvalidException
    {
        id3Tag.addField(field);
    }

    @Override
    public List<TagField> getFields(String id)
    {
        return id3Tag.getFields(id);
    }

    /**
     * Maps the generic key to the specific key and return the list of values for this field as strings
     *
     * @param genericKey
     * @return
     * @throws KeyNotFoundException
     */
    @Override
    public List<String> getAll(FieldKey genericKey) throws KeyNotFoundException
    {
        return id3Tag.getAll(genericKey);
    }

    @Override
    public boolean hasCommonFields()
    {
        return id3Tag.hasCommonFields();
    }

    /**
     * Determines whether the tag has no fields specified.<br>
     * <p/>
     * <p>If there are no images we return empty if either there is no VorbisTag or if there is a
     * VorbisTag but it is empty
     *
     * @return <code>true</code> if tag contains no field.
     */
    @Override
    public boolean isEmpty()
    {
        return (id3Tag == null || id3Tag.isEmpty());
    }

    @Override
    public void setField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException
    {
        TagField tagfield = createField(genericKey, value);
        setField(tagfield);
    }

    @Override
    public void addField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException
    {
        TagField tagfield = createField(genericKey, value);
        addField(tagfield);
    }

    /**
     * @param field
     * @throws FieldDataInvalidException
     */
    @Override
    public void setField(TagField field) throws FieldDataInvalidException
    {
        id3Tag.setField(field);
    }

    @Override
    public TagField createField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException
    {
        return id3Tag.createField(genericKey, value);
    }

    @Override
    public String getFirst(String id)
    {
        return id3Tag.getFirst(id);
    }

    @Override
    public String getValue(FieldKey id, int index) throws KeyNotFoundException
    {
        return id3Tag.getValue(id, index);
    }

    @Override
    public String getFirst(FieldKey id) throws KeyNotFoundException
    {
        return getValue(id, 0);
    }

    @Override
    public TagField getFirstField(String id)
    {
        return id3Tag.getFirstField(id);
    }

    @Override
    public TagField getFirstField(FieldKey genericKey) throws KeyNotFoundException
    {
        if (genericKey == null)
        {
            throw new KeyNotFoundException();
        } else
        {
            return id3Tag.getFirstField(genericKey);
        }
    }

    /**
     * Delete any instance of tag fields with this key
     *
     * @param fieldKey
     */
    @Override
    public void deleteField(FieldKey fieldKey) throws KeyNotFoundException
    {
        id3Tag.deleteField(fieldKey);
    }

    @Override
    public void deleteField(String id) throws KeyNotFoundException
    {
        id3Tag.deleteField(id);
    }

    @Override
    public Iterator<TagField> getFields()
    {
        return id3Tag.getFields();
    }

    @Override
    public int getFieldCount()
    {
        return id3Tag.getFieldCount();
    }

    @Override
    public int getFieldCountIncludingSubValues()
    {
        return getFieldCount();
    }

    @Override
    public boolean setEncoding(Charset enc) throws FieldDataInvalidException
    {
        return id3Tag.setEncoding(enc);
    }

    /**
     * Create artwork field. Not currently supported.
     */
    @Override
    public TagField createField(Artwork artwork) throws FieldDataInvalidException
    {
        return id3Tag.createField(artwork);
    }

    @Override
    public void setField(Artwork artwork) throws FieldDataInvalidException
    {
        id3Tag.setField(artwork);
    }

    @Override
    public void addField(Artwork artwork) throws FieldDataInvalidException
    {
        id3Tag.addField(artwork);
    }

    @Override
    public List<Artwork> getArtworkList()
    {
        return id3Tag.getArtworkList();
    }

    @Override
    public List<TagField> getFields(FieldKey id) throws KeyNotFoundException
    {
        return id3Tag.getFields(id);
    }

    @Override
    public Artwork getFirstArtwork()
    {
        return id3Tag.getFirstArtwork();
    }

    /**
     * Delete all instance of artwork Field
     *
     * @throws KeyNotFoundException
     */
    @Override
    public void deleteArtworkField() throws KeyNotFoundException
    {
    	id3Tag.deleteArtworkField();
    }

    @Override
    public boolean hasField(FieldKey genericKey)
    {
        return id3Tag.hasField(genericKey);
    }


    @Override
    public boolean hasField(String id)
    {
        return id3Tag.hasField(id);
    }

    @Override
    public TagField createCompilationField(boolean value) throws KeyNotFoundException, FieldDataInvalidException
    {
        return createField(FieldKey.IS_COMPILATION, String.valueOf(value));
    }

    @Override
    public String toString()
    {
        StringBuilder sb = new StringBuilder();

        for(ChunkSummary cs:chunkSummaryList)
        {
            sb.append(cs.toString()+"\n");
        }
        if (id3Tag != null)
        {
            sb.append("Aiff ID3 Tag:\n");
            if(isExistingId3Tag())
            {
                if(isIncorrectlyAlignedTag)
                {
                    sb.append("\tincorrectly starts as odd byte\n");
                }
                sb.append("\tstartLocation:" + Hex.asDecAndHex(getStartLocationInFileOfId3Chunk()) + "\n");
                sb.append("\tendLocation:"   + Hex.asDecAndHex(getEndLocationInFileOfId3Chunk()) + "\n");
            }
            sb.append(id3Tag.toString()+"\n");
            return sb.toString();
        }
        else
        {
            return "tag:empty";
        }
    }

    /**
     * @return size of the vanilla ID3Tag excluding surrounding chunk
     */
    public long getSizeOfID3TagOnly()
    {
        if (!isExistingId3Tag())
        {
            return 0;
        }
        return (id3Tag.getEndLocationInFile() - id3Tag.getStartLocationInFile());
    }

    /**
     * @return size of the ID3 Chunk including header
     */
    public long getSizeOfID3TagIncludingChunkHeader()
    {
        if (!isExistingId3Tag())
        {
            return 0;
        }
        return getSizeOfID3TagOnly() + ChunkHeader.CHUNK_HEADER_SIZE;
    }

    /**
     * Offset into file of start ID3Chunk including header
     *
     * @return
     */
    public long getStartLocationInFileOfId3Chunk()
    {
        if (!isExistingId3Tag())
        {
            return 0;
        }
        return id3Tag.getStartLocationInFile() - ChunkHeader.CHUNK_HEADER_SIZE;
    }

    public long getEndLocationInFileOfId3Chunk()
    {
        if(!isExistingId3Tag())
        {
            return 0;
        }
        return id3Tag.getEndLocationInFile();
    }

    public boolean equals(Object obj)
    {
        return id3Tag.equals(obj);
    }

    public boolean isIncorrectlyAlignedTag()
    {
        return isIncorrectlyAlignedTag;
    }

    public void setIncorrectlyAlignedTag(boolean isIncorrectlyAlignedTag)
    {
        this.isIncorrectlyAlignedTag = isIncorrectlyAlignedTag;
    }

    /**
     * Default based on user option
     *
     * @return
     */
    public static AbstractID3v2Tag createDefaultID3Tag()
    {
        if(TagOptionSingleton.getInstance().getID3V2Version()== ID3V2Version.ID3_V24)
        {
            return new ID3v24Tag();
        }
        else if(TagOptionSingleton.getInstance().getID3V2Version()==ID3V2Version.ID3_V23)
        {
            return new ID3v23Tag();
        }
        else if(TagOptionSingleton.getInstance().getID3V2Version()==ID3V2Version.ID3_V22)
        {
            return new ID3v22Tag();
        }
        //Default in case not set somehow
        return new ID3v23Tag();
    }
}
