package org.jaudiotagger.audio.generic;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.exceptions.CannotWriteException;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.TagOptionSingleton;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;

/**
 * Created by Paul on 28/01/2016.
 */
public abstract class AudioFileWriter2 extends AudioFileWriter
{
    /**
     * Delete the tag (if any) present in the given file
     *
     * @param af The file to process
     *
     * @throws CannotWriteException if anything went wrong
     * @throws org.jaudiotagger.audio.exceptions.CannotReadException
     */
    @Override
    public void delete(AudioFile af) throws CannotReadException, CannotWriteException
    {
        File file = af.getFile();

        if (TagOptionSingleton.getInstance().isCheckIsWritable() && !file.canWrite())
        {
            throw new CannotWriteException(ErrorMessage.GENERAL_DELETE_FAILED
                    .getMsg(file));
        }

        if (af.getFile().length() <= MINIMUM_FILESIZE)
        {
            throw new CannotWriteException(ErrorMessage.GENERAL_DELETE_FAILED_BECAUSE_FILE_IS_TOO_SMALL
                    .getMsg(file));
        }
        deleteTag(af.getTag(), file);
    }

    /**
     * Replace with new tag
     *
     * @param af The file we want to process
     * @throws CannotWriteException
     */
    @Override
    public void write(AudioFile af) throws CannotWriteException
    {
        File file = af.getFile();

        if (TagOptionSingleton.getInstance().isCheckIsWritable() && !file.canWrite())
        {
            logger.severe(ErrorMessage.GENERAL_WRITE_FAILED.getMsg(af.getFile()
                    .getPath()));
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_TO_OPEN_FILE_FOR_EDITING
                    .getMsg(file));
        }

        if (af.getFile().length() <= MINIMUM_FILESIZE)
        {
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_BECAUSE_FILE_IS_TOO_SMALL
                    .getMsg(file));
        }
        writeTag(af.getTag(), file);
    }

    /**
     * Must be implemented by each audio format
     *
     * @param tag
     * @param file
     * @throws CannotReadException
     * @throws CannotWriteException
     */
    protected abstract void deleteTag(Tag tag, File file) throws CannotReadException, CannotWriteException;


    public void deleteTag(Tag tag, RandomAccessFile raf, RandomAccessFile tempRaf) throws CannotReadException, CannotWriteException, IOException
    {
        throw new UnsupportedOperationException("Old method not used in version 2");
    }

    /**
     * Must be implemented by each audio format
     *
     * @param tag
     * @param file
     * @throws CannotWriteException
     */
    protected abstract void writeTag(Tag tag, File file) throws CannotWriteException;

    protected   void writeTag(AudioFile audioFile, Tag tag, RandomAccessFile raf, RandomAccessFile rafTemp) throws CannotReadException, CannotWriteException, IOException
    {
        throw new UnsupportedOperationException("Old method not used in version 2");
    }
}
