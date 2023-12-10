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
 * Abstract superclass of all URL Frames
 *
 */
package org.jaudiotagger.tag.id3;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.Arrays;
import java.util.logging.Logger;
import java.util.regex.Pattern;

/**
 * This is the abstract base class for all ID3v1 tags.
 *
 * @author : Eric Farng
 * @author : Paul Taylor
 */
abstract public class AbstractID3v1Tag extends AbstractID3Tag
{

    //Logger
    public static Logger logger = Logger.getLogger("org.jaudiotagger.tag.id3");


    public AbstractID3v1Tag()
    {
    }

    public AbstractID3v1Tag(AbstractID3v1Tag copyObject)
    {
        super(copyObject);
    }

    //If field is less than maximum field length this is how it is terminated
    protected static final byte END_OF_FIELD = (byte) 0;

    //Used to detect end of field in String constructed from Data
    protected static Pattern endofStringPattern = Pattern.compile("\\x00");

    //Tag ID as held in file
    public static final String TAG = "TAG";
    protected static final byte[] TAG_ID = {(byte) 'T', (byte) 'A', (byte) 'G'};

    //Fields Lengths common to v1 and v1.1 tags
    protected static final int TAG_LENGTH = 128;
    protected static final int TAG_DATA_LENGTH = 125;
    protected static final int FIELD_TAGID_LENGTH = 3;
    protected static final int FIELD_TITLE_LENGTH = 30;
    protected static final int FIELD_ARTIST_LENGTH = 30;
    protected static final int FIELD_ALBUM_LENGTH = 30;
    protected static final int FIELD_YEAR_LENGTH = 4;
    protected static final int FIELD_GENRE_LENGTH = 1;

    //Field Positions, starting from zero so fits in with Java Terminology
    protected static final int FIELD_TAGID_POS = 0;
    protected static final int FIELD_TITLE_POS = 3;
    protected static final int FIELD_ARTIST_POS = 33;
    protected static final int FIELD_ALBUM_POS = 63;
    protected static final int FIELD_YEAR_POS = 93;
    protected static final int FIELD_GENRE_POS = 127;

    //For writing output
    protected static final String TYPE_TITLE = "title";
    protected static final String TYPE_ARTIST = "artist";
    protected static final String TYPE_ALBUM = "album";
    protected static final String TYPE_YEAR = "year";
    protected static final String TYPE_GENRE = "genre";

    /**
     * Return the size of this tag, the size is fixed for tags of this type
     *
     * @return size of this tag in bytes
     */
    public int getSize()
    {
        return TAG_LENGTH;
    }

    /**
     * Does a v1tag or a v11tag exist
     *
     * @return whether tag exists within the byteBuffer
     */
    public static boolean seekForV1OrV11Tag(ByteBuffer byteBuffer)
    {
        byte[] buffer = new byte[FIELD_TAGID_LENGTH];
        // read the TAG value
        byteBuffer.get(buffer, 0, FIELD_TAGID_LENGTH);
        return (Arrays.equals(buffer, TAG_ID));
    }
    /**
     * Delete tag from file
     * Looks for tag and if found lops it off the file.
     *
     * @param file to delete the tag from
     * @throws IOException if there was a problem accessing the file
     */
    public void delete(RandomAccessFile file) throws IOException
    {
        //Read into Byte Buffer
        logger.config("Deleting ID3v1 from file if exists");

        FileChannel fc;
        ByteBuffer byteBuffer;
        fc = file.getChannel();

        if(file.length() < TAG_LENGTH)
        {
            throw new IOException("File not not appear large enough to contain a tag");
        }
        fc.position(file.length() - TAG_LENGTH);
        byteBuffer = ByteBuffer.allocate(TAG_LENGTH);
        fc.read(byteBuffer);
        byteBuffer.rewind();
        if (AbstractID3v1Tag.seekForV1OrV11Tag(byteBuffer))
        {
            try
            {
                logger.config("Deleted ID3v1 tag");
                file.setLength(file.length() - TAG_LENGTH);
            }
            catch(IOException ex)
            {
                logger.severe("Unable to delete existing ID3v1 Tag:"+ex.getMessage());
            }
        }
        else
        {
            logger.config("Unable to find ID3v1 tag to deleteField");
        }
    }

 
}
