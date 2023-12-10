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
package org.jaudiotagger.audio.generic;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.exceptions.InvalidAudioFrameException;
import org.jaudiotagger.audio.exceptions.NoReadPermissionsException;
import org.jaudiotagger.audio.exceptions.ReadOnlyFileException;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.TagException;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.logging.Level;
import java.util.logging.Logger;

/*
 * This abstract class is the skeleton for tag readers. It handles the creation/closing of
 * the randomaccessfile objects and then call the subclass method getEncodingInfo and getTag.
 * These two method have to be implemented in the subclass.
 * 
 *@author	Raphael Slinckx
 *@version	$Id$
 *@since	v0.02
 */

public abstract class AudioFileReader
{

    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.generic");
    protected static final int MINIMUM_SIZE_FOR_VALID_AUDIO_FILE = 100;

    /*
    * Returns the encoding info object associated wih the current File.
    * The subclass can assume the RAF pointer is at the first byte of the file.
    * The RandomAccessFile must be kept open after this function, but can point
    * at any offset in the file.
    *
    * @param raf The RandomAccessFile associtaed with the current file
    * @exception IOException is thrown when the RandomAccessFile operations throw it (you should never throw them manually)
    * @exception CannotReadException when an error occured during the parsing of the encoding infos
    */
    protected abstract GenericAudioHeader getEncodingInfo(RandomAccessFile raf) throws CannotReadException, IOException;



    /*
      * Same as above but returns the Tag contained in the file, or a new one.
      *
      * @param raf The RandomAccessFile associted with the current file
      * @exception IOException is thrown when the RandomAccessFile operations throw it (you should never throw them manually)
      * @exception CannotReadException when an error occured during the parsing of the tag
      */
    protected abstract Tag getTag(RandomAccessFile raf) throws CannotReadException, IOException;

    /*
      * Reads the given file, and return an AudioFile object containing the Tag
      * and the encoding infos present in the file. If the file has no tag, an
      * empty one is returned. If the encodinginfo is not valid , an exception is thrown.
      *
      * @param f The file to read
      * @exception CannotReadException If anything went bad during the read of this file
      */
    public AudioFile read(File f) throws CannotReadException, IOException, TagException, ReadOnlyFileException, InvalidAudioFrameException
    {
        if(logger.isLoggable(Level.CONFIG))
        {
            logger.config(ErrorMessage.GENERAL_READ.getMsg(f.getAbsolutePath()));
        }

        if (!f.canRead())
        {
            throw new NoReadPermissionsException(ErrorMessage.GENERAL_READ_FAILED_DO_NOT_HAVE_PERMISSION_TO_READ_FILE.getMsg(f.getPath()));
        }

        if (f.length() <= MINIMUM_SIZE_FOR_VALID_AUDIO_FILE)
        {
            throw new CannotReadException(ErrorMessage.GENERAL_READ_FAILED_FILE_TOO_SMALL.getMsg(f.getAbsolutePath()));
        }

        RandomAccessFile raf = null;
        try
        {
            raf = new RandomAccessFile(f, "r");
            raf.seek(0);

            GenericAudioHeader info = getEncodingInfo(raf);
            raf.seek(0);
            Tag tag = getTag(raf);
            return new AudioFile(f, info, tag);

        }
        catch (CannotReadException cre)
        {
            throw cre;
        }
        catch (Exception e)
        {
            logger.log(Level.SEVERE, ErrorMessage.GENERAL_READ.getMsg(f.getAbsolutePath()),e);
            throw new CannotReadException(f.getAbsolutePath()+":" + e.getMessage(), e);
        }
        finally
        {
            try
            {
                if (raf != null)
                {
                    raf.close();
                }
            }
            catch (Exception ex)
            {
                logger.log(Level.WARNING, ErrorMessage.GENERAL_READ_FAILED_UNABLE_TO_CLOSE_RANDOM_ACCESS_FILE.getMsg(f.getAbsolutePath()));
            }
        }
    }
}
