/**
 *  @author : Paul Taylor
 *  @author : Eric Farng
 *
 *  Version @version:$Id$
 *
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
 *
 * Description:
 *
 */
package org.jaudiotagger.tag.id3;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.mp3.MP3File;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.*;
import org.jaudiotagger.tag.images.Artwork;
import org.jaudiotagger.tag.reference.GenreTypes;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.Charset;
import java.util.*;
import java.util.regex.Matcher;

/**
 * Represents an ID3v1 tag.
 *
 * @author : Eric Farng
 * @author : Paul Taylor
 */
public class ID3v1Tag extends AbstractID3v1Tag implements Tag
{
    static EnumMap<FieldKey, ID3v1FieldKey> tagFieldToID3v1Field = new EnumMap<FieldKey, ID3v1FieldKey>(FieldKey.class);

    static
    {
        tagFieldToID3v1Field.put(FieldKey.ARTIST, ID3v1FieldKey.ARTIST);
        tagFieldToID3v1Field.put(FieldKey.ALBUM, ID3v1FieldKey.ALBUM);
        tagFieldToID3v1Field.put(FieldKey.TITLE, ID3v1FieldKey.TITLE);
        tagFieldToID3v1Field.put(FieldKey.TRACK, ID3v1FieldKey.TRACK);
        tagFieldToID3v1Field.put(FieldKey.YEAR, ID3v1FieldKey.YEAR);
        tagFieldToID3v1Field.put(FieldKey.GENRE, ID3v1FieldKey.GENRE);
        tagFieldToID3v1Field.put(FieldKey.COMMENT, ID3v1FieldKey.COMMENT);
    }

    //For writing output
    protected static final String TYPE_COMMENT = "comment";


    protected static final int FIELD_COMMENT_LENGTH = 30;
    protected static final int FIELD_COMMENT_POS = 97;
    protected static final int BYTE_TO_UNSIGNED = 0xff;

    protected static final int GENRE_UNDEFINED = 0xff;

    /**
     *
     */
    protected String album = "";

    /**
     *
     */
    protected String artist = "";

    /**
     *
     */
    protected String comment = "";

    /**
     *
     */
    protected String title = "";

    /**
     *
     */
    protected String year = "";

    /**
     *
     */
    protected byte genre = (byte) -1;


    private static final byte RELEASE = 1;
    private static final byte MAJOR_VERSION = 0;
    private static final byte REVISION = 0;

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
     * Creates a new ID3v1 datatype.
     */
    public ID3v1Tag()
    {

    }

    public ID3v1Tag(ID3v1Tag copyObject)
    {
        super(copyObject);

        this.album = copyObject.album;
        this.artist = copyObject.artist;
        this.comment = copyObject.comment;
        this.title = copyObject.title;
        this.year = copyObject.year;
        this.genre = copyObject.genre;
    }

    public ID3v1Tag(AbstractTag mp3tag)
    {

        if (mp3tag != null)
        {
            ID3v11Tag convertedTag;
            if (mp3tag instanceof ID3v1Tag)
            {
                throw new UnsupportedOperationException("Copy Constructor not called. Please type cast the argument");
            }
            if (mp3tag instanceof ID3v11Tag)
            {
                convertedTag = (ID3v11Tag) mp3tag;
            }
            else
            {
                convertedTag = new ID3v11Tag(mp3tag);
            }
            this.album = convertedTag.album;
            this.artist = convertedTag.artist;
            this.comment = convertedTag.comment;
            this.title = convertedTag.title;
            this.year = convertedTag.year;
            this.genre = convertedTag.genre;
        }
    }

    /**
     * Creates a new ID3v1 datatype.
     *
     * @param file
     * @param loggingFilename
     * @throws TagNotFoundException
     * @throws IOException
     */
    public ID3v1Tag(RandomAccessFile file, String loggingFilename) throws TagNotFoundException, IOException
    {
        setLoggingFilename(loggingFilename);
        FileChannel fc;
        ByteBuffer byteBuffer;

        fc = file.getChannel();
        fc.position(file.length() - TAG_LENGTH);
        byteBuffer = ByteBuffer.allocate(TAG_LENGTH);
        fc.read(byteBuffer);
        byteBuffer.flip();
        read(byteBuffer);
    }

    /**
     * Creates a new ID3v1 datatype.
     *
     * @param file
     * @throws TagNotFoundException
     * @throws IOException
     * @deprecated use {@link #ID3v1Tag(RandomAccessFile,String)} instead
     */
    public ID3v1Tag(RandomAccessFile file) throws TagNotFoundException, IOException
    {
        this(file, "");
    }

    public void addField(TagField field)
    {
        //TODO
    }

    /**
     * Maps the generic key to the ogg key and return the list of values for this field as strings
     *
     * @param genericKey
     * @return
     * @throws KeyNotFoundException
     */
    public List<String> getAll(FieldKey genericKey) throws KeyNotFoundException
    {
        List<String> list = new ArrayList<String>();
        list.add(getFirst(genericKey.name()));
        return list;
    }

    public List<TagField> getFields(String id)
    {

        if (FieldKey.ARTIST.name().equals(id))
        {
            return getArtist();
        }
        else if (FieldKey.ALBUM.name().equals(id))
        {
            return getAlbum();
        }
        else if (FieldKey.TITLE.name().equals(id))
        {
            return getTitle();
        }
        else if (FieldKey.GENRE.name().equals(id))
        {
            return getGenre();
        }
        else if (FieldKey.YEAR.name().equals(id))
        {
            return getYear();
        }
        else if (FieldKey.COMMENT.name().equals(id))
        {
            return getComment();
        }
        return new ArrayList<TagField>();
    }

    public int getFieldCount()
    {
        return 6;
    }

    public int getFieldCountIncludingSubValues()
    {
       return getFieldCount();
    }

    protected List<TagField> returnFieldToList(ID3v1TagField field)
    {
        List<TagField> fields = new ArrayList<TagField>();
        fields.add(field);
        return fields;
    }

    /**
     * Set Album
     *
     * @param album
     */
    public void setAlbum(String album)
    {
        if (album == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        this.album = ID3Tags.truncate(album, FIELD_ALBUM_LENGTH);
    }

    /**
     * Get Album
     *
     * @return album
     */
    public String getFirstAlbum()
    {
        return album;
    }

    /**
     * @return album within list or empty if does not exist
     */
    public List<TagField> getAlbum()
    {
        if (getFirstAlbum().length() > 0)
        {
            ID3v1TagField field = new ID3v1TagField(ID3v1FieldKey.ALBUM.name(), getFirstAlbum());
            return returnFieldToList(field);
        }
        else
        {
            return new ArrayList<TagField>();
        }
    }




    /**
     * Set Artist
     *
     * @param artist
     */
    public void setArtist(String artist)
    {
        if (artist == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        this.artist = ID3Tags.truncate(artist, FIELD_ARTIST_LENGTH);
    }

    /**
     * Get Artist
     *
     * @return artist
     */
    public String getFirstArtist()
    {
        return artist;
    }

    /**
     * @return Artist within list or empty if does not exist
     */
    public List<TagField> getArtist()
    {
        if (getFirstArtist().length() > 0)
        {
            ID3v1TagField field = new ID3v1TagField(ID3v1FieldKey.ARTIST.name(), getFirstArtist());
            return returnFieldToList(field);
        }
        else
        {
            return new ArrayList<TagField>();
        }
    }

    /**
     * Set Comment
     *
     * @param comment
     * @throws IllegalArgumentException if comment null
     */
    public void setComment(String comment)
    {
        if (comment == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        this.comment = ID3Tags.truncate(comment, FIELD_COMMENT_LENGTH);
    }

    /**
     * @return comment within list or empty if does not exist
     */
    public List<TagField> getComment()
    {
        if (getFirstComment().length() > 0)
        {
            ID3v1TagField field = new ID3v1TagField(ID3v1FieldKey.COMMENT.name(), getFirstComment());
            return returnFieldToList(field);
        }
        else
        {
            return new ArrayList<TagField>();
        }
    }

    /**
     * Get Comment
     *
     * @return comment
     */
    public String getFirstComment()
    {
        return comment;
    }

    /**
     * Sets the genreID,
     *
     * <p>ID3v1 only supports genres defined in a predefined list
     * so if unable to find value in list set 255, which seems to be the value
     * winamp uses for undefined.
     *
     * @param genreVal
     */
    public void setGenre(String genreVal)
    {
        if (genreVal == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        Integer genreID = GenreTypes.getInstanceOf().getIdForValue(genreVal);
        if (genreID != null)
        {
            this.genre = genreID.byteValue();
        }
        else
        {
            this.genre = (byte) GENRE_UNDEFINED;
        }
    }

    /**
     * Get Genre
     *
     * @return genre or empty string if not valid
     */
    public String getFirstGenre()
    {
        Integer genreId = genre & BYTE_TO_UNSIGNED;
        String genreValue = GenreTypes.getInstanceOf().getValueForId(genreId);
        if (genreValue == null)
        {
            return "";
        }
        else
        {
            return genreValue;
        }
    }

    /**
     * Get Genre field
     *
     * <p>Only a single genre is available in ID3v1
     *
     * @return
     */
    public List<TagField> getGenre()
    {
        if (getFirst(FieldKey.GENRE).length() > 0)
        {
            ID3v1TagField field = new ID3v1TagField(ID3v1FieldKey.GENRE.name(), getFirst(FieldKey.GENRE));
            return returnFieldToList(field);
        }
        else
        {
            return new ArrayList<TagField>();
        }
    }

    /**
     * Set Title
     *
     * @param title
     */
    public void setTitle(String title)
    {
        if (title == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        this.title = ID3Tags.truncate(title, FIELD_TITLE_LENGTH);
    }

    /**
     * Get title
     *
     * @return Title
     */
    public String getFirstTitle()
    {
        return title;
    }

    /**
     * Get title field
     *
     * <p>Only a single title is available in ID3v1
     *
     * @return
     */
    public List<TagField> getTitle()
    {
        if (getFirst(FieldKey.TITLE).length() > 0)
        {
            ID3v1TagField field = new ID3v1TagField(ID3v1FieldKey.TITLE.name(), getFirst(FieldKey.TITLE));
            return returnFieldToList(field);
        }
        else
        {
            return new ArrayList<TagField>();
        }
    }

    /**
     * Set year
     *
     * @param year
     */
    public void setYear(String year)
    {
        this.year = ID3Tags.truncate(year, FIELD_YEAR_LENGTH);
    }

    /**
     * Get year
     *
     * @return year
     */
    public String getFirstYear()
    {
        return year;
    }

    /**
     * Get year field
     *
     * <p>Only a single year is available in ID3v1
     *
     * @return
     */
    public List<TagField> getYear()
    {
        if (getFirst(FieldKey.YEAR).length() > 0)
        {
            ID3v1TagField field = new ID3v1TagField(ID3v1FieldKey.YEAR.name(), getFirst(FieldKey.YEAR));
            return returnFieldToList(field);
        }
        else
        {
            return new ArrayList<TagField>();
        }
    }

    public String getFirstTrack()
    {
        throw new UnsupportedOperationException("ID3v10 cannot store track numbers");
    }

    public List<TagField> getTrack()
    {
        throw new UnsupportedOperationException("ID3v10 cannot store track numbers");
    }

    public TagField getFirstField(String id)
    {
        List<TagField> results = null;

        if (FieldKey.ARTIST.name().equals(id))
        {
            results = getArtist();
        }
        else if (FieldKey.ALBUM.name().equals(id))
        {
            results = getAlbum();
        }
        else if (FieldKey.TITLE.name().equals(id))
        {
            results = getTitle();
        }
        else if (FieldKey.GENRE.name().equals(id))
        {
            results = getGenre();
        }
        else if (FieldKey.YEAR.name().equals(id))
        {
            results = getYear();
        }
        else if (FieldKey.COMMENT.name().equals(id))
        {
            results = getComment();
        }

        if (results != null)
        {
            if (results.size() > 0)
            {
                return results.get(0);
            }
        }
        return null;
    }

    public Iterator<TagField> getFields()
    {
        throw new UnsupportedOperationException("TODO:Not done yet");
    }

    public boolean hasCommonFields()
    {
        //TODO
        return true;
    }

    public boolean hasField(FieldKey genericKey)
    {
        return getFirst(genericKey).length() > 0;
    }

    public boolean hasField(String id)
    {
        try
        {
            FieldKey key = FieldKey.valueOf(id.toUpperCase());
            return hasField(key);
        }
        catch(IllegalArgumentException iae)
        {
            return false;
        }
    }

    public boolean isEmpty()
    {
        return !(getFirst(FieldKey.TITLE).length() > 0 ||
                getFirstArtist().length() > 0 ||
                getFirstAlbum().length() > 0 ||
                getFirst(FieldKey.GENRE).length() > 0 ||
                getFirst(FieldKey.YEAR).length() > 0 ||
                getFirstComment().length() > 0);
    }


    public void setField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException
    {
        TagField tagfield = createField(genericKey,value);
        setField(tagfield);
    }

    public void addField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException
    {
        setField(genericKey,value);
    }

    public void setField(TagField field)
    {
        FieldKey genericKey = FieldKey.valueOf(field.getId());
        switch (genericKey)
        {
            case ARTIST:
                setArtist(field.toString());
                break;

            case ALBUM:
                setAlbum(field.toString());
                break;

            case TITLE:
                setTitle(field.toString());
                break;

            case GENRE:
                setGenre(field.toString());
                break;

            case YEAR:
                setYear(field.toString());
                break;

            case COMMENT:
                setComment(field.toString());
                break;
        }
    }

    @Override
    public boolean setEncoding(final Charset encoding)
    {
        return true;
    }

    /**
     * Create Tag Field using generic key
     */
    public TagField createField(FieldKey genericKey, String... values)
    {
        String value = values[0];
        if (genericKey == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        ID3v1FieldKey idv1FieldKey = tagFieldToID3v1Field.get(genericKey);
        if(idv1FieldKey==null)
        {
            throw new KeyNotFoundException(ErrorMessage.INVALID_FIELD_FOR_ID3V1TAG.getMsg(genericKey.name()));
        }
        return new ID3v1TagField(idv1FieldKey .name(), value);
    }

    public Charset getEncoding()
    {
        return StandardCharsets.ISO_8859_1;
    }

    public TagField getFirstField(FieldKey genericKey)
    {
        List<TagField> l = getFields(genericKey);
        return (l.size() != 0) ? l.get(0) : null;
    }

    /**
     * Returns a {@linkplain List list} of {@link TagField} objects whose &quot;{@linkplain TagField#getId() id}&quot;
     * is the specified one.<br>
     *
     * @param genericKey The generic field key
     * @return A list of {@link TagField} objects with the given &quot;id&quot;.
     */
    public List<TagField> getFields(FieldKey genericKey)
    {
        switch (genericKey)
        {
            case ARTIST:
                return getArtist();

            case ALBUM:
                return getAlbum();

            case TITLE:
                return getTitle();

            case GENRE:
                return getGenre();

            case YEAR:
                return getYear();

            case COMMENT:
                return getComment();

            default:
                return new ArrayList<TagField>();
        }
    }


    /**
     * Retrieve the first value that exists for this key id
     *
     * @param genericKey
     * @return
     */
    public String getFirst(String genericKey)
    {
        FieldKey matchingKey = FieldKey.valueOf(genericKey);
        if (matchingKey != null)
        {
            return getFirst(matchingKey);
        }
        else
        {
            return "";
        }
    }


    /**
     * Retrieve the first value that exists for this generic key
     *
     * @param genericKey
     * @return
     */
    public String getFirst(FieldKey genericKey)
    {
        switch (genericKey)
        {
            case ARTIST:
                return getFirstArtist();

            case ALBUM:
                return getFirstAlbum();

            case TITLE:
                return getFirstTitle();

            case GENRE:
                return getFirstGenre();

            case YEAR:
                return getFirstYear();

            case COMMENT:
                return getFirstComment();

            default:
                return "";
        }
    }

     /**
     * The m parameter is effectively ignored
     *
     * @param id
     * @param n
     * @param m
     * @return
     */
    public String getSubValue(FieldKey id, int n, int m)
    {
        return getValue(id,n);
    }

    public String getValue(FieldKey genericKey, int index)
    {
        return getFirst(genericKey);
    }

    /**
     * Delete any instance of tag fields with this key
     *
     * @param genericKey
     */
    public void deleteField(FieldKey genericKey)
    {
        switch (genericKey)
        {
            case ARTIST:
                setArtist("");
                break;

            case ALBUM:
                setAlbum("");
                break;

            case TITLE:
                setTitle("");
                break;

            case GENRE:
                setGenre("");
                break;

            case YEAR:
                setYear("");
                break;

            case COMMENT:
                setComment("");
                break;
        }
    }

    public void deleteField(String id)
    {
        FieldKey key = FieldKey.valueOf(id);
        if(key!=null)
        {
            deleteField(key);
        }
    }

    /**
     * @param obj
     * @return true if this and obj are equivalent
     */
    public boolean equals(Object obj)
    {
        if (!(obj instanceof ID3v1Tag))
        {
            return false;
        }
        ID3v1Tag object = (ID3v1Tag) obj;
        if (!this.album.equals(object.album))
        {
            return false;
        }
        if (!this.artist.equals(object.artist))
        {
            return false;
        }
        if (!this.comment.equals(object.comment))
        {
            return false;
        }
        if (this.genre != object.genre)
        {
            return false;
        }
        if (!this.title.equals(object.title))
        {
            return false;
        }
        return this.year.equals(object.year) && super.equals(obj);
    }

    /**
     * @return an iterator to iterate through the fields of the tag
     */
    public Iterator iterator()
    {
        return new ID3v1Iterator(this);
    }


    /**
     * @param byteBuffer
     * @throws TagNotFoundException
     */
    public void read(ByteBuffer byteBuffer) throws TagNotFoundException
    {
        if (!seek(byteBuffer))
        {
            throw new TagNotFoundException(getLoggingFilename() + ":" + "ID3v1 tag not found");
        }
        logger.finer(getLoggingFilename() + ":" + "Reading v1 tag");
        //Do single file read of data to cut down on file reads
        byte[] dataBuffer = new byte[TAG_LENGTH];
        byteBuffer.position(0);
        byteBuffer.get(dataBuffer, 0, TAG_LENGTH);
        title = new String(dataBuffer, FIELD_TITLE_POS, FIELD_TITLE_LENGTH, StandardCharsets.ISO_8859_1).trim();
        Matcher m = AbstractID3v1Tag.endofStringPattern.matcher(title);
        if (m.find())
        {
            title = title.substring(0, m.start());
        }
        artist = new String(dataBuffer, FIELD_ARTIST_POS, FIELD_ARTIST_LENGTH, StandardCharsets.ISO_8859_1).trim();
        m = AbstractID3v1Tag.endofStringPattern.matcher(artist);
        if (m.find())
        {
            artist = artist.substring(0, m.start());
        }
        album = new String(dataBuffer, FIELD_ALBUM_POS, FIELD_ALBUM_LENGTH, StandardCharsets.ISO_8859_1).trim();
        m = AbstractID3v1Tag.endofStringPattern.matcher(album);
        logger.finest(getLoggingFilename() + ":" + "Orig Album is:" + comment + ":");
        if (m.find())
        {
            album = album.substring(0, m.start());
            logger.finest(getLoggingFilename() + ":" + "Album is:" + album + ":");
        }
        year = new String(dataBuffer, FIELD_YEAR_POS, FIELD_YEAR_LENGTH, StandardCharsets.ISO_8859_1).trim();
        m = AbstractID3v1Tag.endofStringPattern.matcher(year);
        if (m.find())
        {
            year = year.substring(0, m.start());
        }
        comment = new String(dataBuffer, FIELD_COMMENT_POS, FIELD_COMMENT_LENGTH, StandardCharsets.ISO_8859_1).trim();
        m = AbstractID3v1Tag.endofStringPattern.matcher(comment);
        logger.finest(getLoggingFilename() + ":" + "Orig Comment is:" + comment + ":");
        if (m.find())
        {
            comment = comment.substring(0, m.start());
            logger.finest(getLoggingFilename() + ":" + "Comment is:" + comment + ":");
        }
        genre = dataBuffer[FIELD_GENRE_POS];

    }

    /**
     * Does a tag of this version exist within the byteBuffer
     *
     * @return whether tag exists within the byteBuffer
     */
    public boolean seek(ByteBuffer byteBuffer)
    {
        byte[] buffer = new byte[FIELD_TAGID_LENGTH];
        // read the TAG value
        byteBuffer.get(buffer, 0, FIELD_TAGID_LENGTH);
        return (Arrays.equals(buffer, TAG_ID));
    }

    /**
     * Write this tag to the file, replacing any tag previously existing
     *
     * @param file
     * @throws IOException
     */
    public void write(RandomAccessFile file) throws IOException
    {
        logger.config("Saving ID3v1 tag to file");
        byte[] buffer = new byte[TAG_LENGTH];
        int i;
        String str;
        delete(file);
        file.seek(file.length());
        //Copy the TAGID into new buffer
        System.arraycopy(TAG_ID, FIELD_TAGID_POS, buffer, FIELD_TAGID_POS, TAG_ID.length);
        int offset = FIELD_TITLE_POS;
        if (TagOptionSingleton.getInstance().isId3v1SaveTitle())
        {
            str = ID3Tags.truncate(title, FIELD_TITLE_LENGTH);
            for (i = 0; i < str.length(); i++)
            {
                buffer[i + offset] = (byte) str.charAt(i);
            }
        }
        offset = FIELD_ARTIST_POS;
        if (TagOptionSingleton.getInstance().isId3v1SaveArtist())
        {
            str = ID3Tags.truncate(artist, FIELD_ARTIST_LENGTH);
            for (i = 0; i < str.length(); i++)
            {
                buffer[i + offset] = (byte) str.charAt(i);
            }
        }
        offset = FIELD_ALBUM_POS;
        if (TagOptionSingleton.getInstance().isId3v1SaveAlbum())
        {
            str = ID3Tags.truncate(album, FIELD_ALBUM_LENGTH);
            for (i = 0; i < str.length(); i++)
            {
                buffer[i + offset] = (byte) str.charAt(i);
            }
        }
        offset = FIELD_YEAR_POS;
        if (TagOptionSingleton.getInstance().isId3v1SaveYear())
        {
            str = ID3Tags.truncate(year, AbstractID3v1Tag.FIELD_YEAR_LENGTH);
            for (i = 0; i < str.length(); i++)
            {
                buffer[i + offset] = (byte) str.charAt(i);
            }
        }
        offset = FIELD_COMMENT_POS;
        if (TagOptionSingleton.getInstance().isId3v1SaveComment())
        {
            str = ID3Tags.truncate(comment, FIELD_COMMENT_LENGTH);
            for (i = 0; i < str.length(); i++)
            {
                buffer[i + offset] = (byte) str.charAt(i);
            }
        }
        offset = FIELD_GENRE_POS;
        if (TagOptionSingleton.getInstance().isId3v1SaveGenre())
        {
            buffer[offset] = genre;
        }
        file.write(buffer);
        logger.config("Saved ID3v1 tag to file");
    }

    /**
     * Create structured representation of this item.
     */
    public void createStructure()
    {
        MP3File.getStructureFormatter().openHeadingElement(TYPE_TAG, getIdentifier());
        //Header
        MP3File.getStructureFormatter().addElement(TYPE_TITLE, this.title);
        MP3File.getStructureFormatter().addElement(TYPE_ARTIST, this.artist);
        MP3File.getStructureFormatter().addElement(TYPE_ALBUM, this.album);
        MP3File.getStructureFormatter().addElement(TYPE_YEAR, this.year);
        MP3File.getStructureFormatter().addElement(TYPE_COMMENT, this.comment);
        MP3File.getStructureFormatter().addElement(TYPE_GENRE, this.genre);
        MP3File.getStructureFormatter().closeHeadingElement(TYPE_TAG);
    }

    public List<Artwork> getArtworkList()
    {
       return Collections.emptyList();
    }

    public Artwork getFirstArtwork()
    {           
        return null;
    }

    public TagField createField(Artwork artwork) throws FieldDataInvalidException
    {
        throw new UnsupportedOperationException(ErrorMessage.GENERIC_NOT_SUPPORTED.getMsg());
    }

    public void setField(Artwork artwork) throws FieldDataInvalidException
    {
        throw new UnsupportedOperationException(ErrorMessage.GENERIC_NOT_SUPPORTED.getMsg());
    }

    public void addField(Artwork artwork) throws FieldDataInvalidException
    {
        throw new UnsupportedOperationException(ErrorMessage.GENERIC_NOT_SUPPORTED.getMsg());
    }
    /**
     * Delete all instance of artwork Field
     *
     * @throws KeyNotFoundException
     */
    public void deleteArtworkField() throws KeyNotFoundException
    {
        throw new UnsupportedOperationException(ErrorMessage.GENERIC_NOT_SUPPORTED.getMsg());
    }

    public TagField createCompilationField(boolean value) throws KeyNotFoundException, FieldDataInvalidException
    {
        throw new UnsupportedOperationException(ErrorMessage.GENERIC_NOT_SUPPORTED.getMsg());
    }
}
