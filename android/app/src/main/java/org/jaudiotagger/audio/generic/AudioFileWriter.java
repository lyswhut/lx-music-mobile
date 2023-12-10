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
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.exceptions.CannotWriteException;
import org.jaudiotagger.audio.exceptions.ModifyVetoException;
import org.jaudiotagger.audio.mp3.MP3File;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.TagOptionSingleton;

import java.io.*;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * This abstract class is the skeleton for tag writers.
 * <p/>
 * <p/>
 * It handles the creation/closing of the randomaccessfile objects and then call
 * the subclass method writeTag or deleteTag. These two method have to be
 * implemented in the subclass.
 *
 * @author Raphael Slinckx
 * @version $Id: AudioFileWriter.java,v 1.21 2009/05/05 15:59:14 paultaylor Exp
 * $
 * @since v0.02
 */
public abstract class AudioFileWriter {
    private static final String TEMP_FILENAME_SUFFIX = ".tmp";
    private static final String WRITE_MODE = "rw";
    protected static final int MINIMUM_FILESIZE = 100;

    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.generic");

    //If filename too long try recreating it with length no longer than 50 that should be safe on all operating
    //systems
    private static final String FILE_NAME_TOO_LONG = "File name too long";
    private static final String FILE_NAME_TOO_LONG2 = "The filename, directory name, or volume label syntax is incorrect";
    private static final int FILE_NAME_TOO_LONG_SAFE_LIMIT = 50;

    /**
     * If not <code>null</code>, this listener is used to notify the listener
     * about modification events.<br>
     */
    private AudioFileModificationListener modificationListener = null;

    /**
     * Delete the tag (if any) present in the given file
     *
     * @param af The file to process
     * @throws CannotWriteException                                  if anything went wrong
     * @throws org.jaudiotagger.audio.exceptions.CannotReadException
     */
    public void delete(AudioFile af) throws CannotReadException, CannotWriteException {
        File file = af.getFile();
        if (TagOptionSingleton.getInstance().isCheckIsWritable() && !file.canWrite()) {
            throw new CannotWriteException(ErrorMessage.GENERAL_DELETE_FAILED.getMsg(file.getPath()));
        }

        if (af.getFile().length() <= MINIMUM_FILESIZE) {
            throw new CannotWriteException(ErrorMessage.GENERAL_DELETE_FAILED_BECAUSE_FILE_IS_TOO_SMALL.getMsg(file.getPath()));
        }

        RandomAccessFile raf = null;
        RandomAccessFile rafTemp = null;
        File tempF = null;

        // Will be set to true on VetoException, causing the finally block to
        // discard the tempfile.
        boolean revert = false;

        try {

            tempF = File.createTempFile(af.getFile().getName().replace('.', '_'), TEMP_FILENAME_SUFFIX, af.getFile().getParentFile());
            rafTemp = new RandomAccessFile(tempF, WRITE_MODE);
            raf = new RandomAccessFile(af.getFile(), WRITE_MODE);
            raf.seek(0);
            rafTemp.seek(0);

            try {
                if (this.modificationListener != null) {
                    this.modificationListener.fileWillBeModified(af, true);
                }
                deleteTag(af.getTag(), raf, rafTemp);
                if (this.modificationListener != null) {
                    this.modificationListener.fileModified(af, tempF);
                }
            } catch (ModifyVetoException veto) {
                throw new CannotWriteException(veto);
            }

        } catch (Exception e) {
            revert = true;
            throw new CannotWriteException("\"" + af.getFile().getAbsolutePath() + "\" :" + e, e);
        } finally {
            // will be set to the remaining file.
            File result = af.getFile();
            try {
                if (raf != null) {
                    raf.close();
                }
                if (rafTemp != null) {
                    rafTemp.close();
                }

                if (tempF.length() > 0 && !revert) {
                    boolean deleteResult = af.getFile().delete();
                    if (!deleteResult) {
                        logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_DELETE_ORIGINAL_FILE.getMsg(af.getFile().getPath(), tempF.getPath()));
                        throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_TO_DELETE_ORIGINAL_FILE.getMsg(af.getFile().getPath(), tempF.getPath()));
                    }
                    boolean renameResult = tempF.renameTo(af.getFile());
                    if (!renameResult) {
                        logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_RENAME_TO_ORIGINAL_FILE.getMsg(af.getFile().getPath(), tempF.getPath()));
                        throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_TO_RENAME_TO_ORIGINAL_FILE.getMsg(af.getFile().getPath(), tempF.getPath()));
                    }
                    result = tempF;

                    // If still exists we can now delete
                    if (tempF.exists()) {
                        if (!tempF.delete()) {
                            // Non critical failed deletion
                            logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_DELETE_TEMPORARY_FILE.getMsg(tempF.getPath()));
                        }
                    }
                } else {
                    // It was created but never used
                    if (!tempF.delete()) {
                        // Non critical failed deletion
                        logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_DELETE_TEMPORARY_FILE.getMsg(tempF.getPath()));
                    }
                }
            } catch (Exception ex) {
                logger.severe("AudioFileWriter exception cleaning up delete:" + af.getFile().getPath() + " or" + tempF.getAbsolutePath() + ":" + ex);
            }
            // Notify listener
            if (this.modificationListener != null) {
                this.modificationListener.fileOperationFinished(result);
            }
        }
    }

    /**
     * Delete the tag (if any) present in the given randomaccessfile, and do not
     * close it at the end.
     *
     * @param tag
     * @param raf     The source file, already opened in r-write mode
     * @param tempRaf The temporary file opened in r-write mode
     * @throws CannotWriteException                                  if anything went wrong
     * @throws org.jaudiotagger.audio.exceptions.CannotReadException
     * @throws IOException
     */
    public void delete(Tag tag, RandomAccessFile raf, RandomAccessFile tempRaf) throws CannotReadException, CannotWriteException, IOException {
        raf.seek(0);
        tempRaf.seek(0);
        deleteTag(tag, raf, tempRaf);
    }

    /**
     * Same as above, but delete tag in the file.
     *
     * @param tag
     * @param raf
     * @param tempRaf
     * @throws IOException                                           is thrown when the RandomAccessFile operations throw it (you
     *                                                               should never throw them manually)
     * @throws CannotWriteException                                  when an error occured during the deletion of the tag
     * @throws org.jaudiotagger.audio.exceptions.CannotReadException
     */
    protected abstract void deleteTag(Tag tag, RandomAccessFile raf, RandomAccessFile tempRaf) throws CannotReadException, CannotWriteException, IOException;

    /**
     * This method sets the {@link AudioFileModificationListener}.<br>
     * There is only one listener allowed, if you want more instances to be
     * supported, use the {@link ModificationHandler} to broadcast those events.<br>
     *
     * @param listener The listener. <code>null</code> allowed to deregister.
     */
    public void setAudioFileModificationListener(AudioFileModificationListener listener) {
        this.modificationListener = listener;
    }

    /**
     * Prechecks before normal write
     * <p/>
     * <ul>
     * <li>If the tag is actually empty, remove the tag</li>
     * <li>if the file is not writable, throw exception
     * <li>
     * <li>If the file is too small to be a valid file, throw exception
     * <li>
     * </ul>
     *
     * @param af
     * @throws CannotWriteException
     */
    private void precheckWrite(AudioFile af) throws CannotWriteException {
        // Preliminary checks
        try {
            if (af.getTag().isEmpty()) {
                delete(af);
                return;
            }
        } catch (CannotReadException re) {
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED.getMsg(af.getFile().getPath()));
        }

        File file = af.getFile();
        if (TagOptionSingleton.getInstance().isCheckIsWritable() && !file.canWrite()) {
            logger.severe(ErrorMessage.GENERAL_WRITE_FAILED.getMsg(af.getFile().getPath()));
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_TO_OPEN_FILE_FOR_EDITING.getMsg(file.getPath()));
        }

        if (af.getFile().length() <= MINIMUM_FILESIZE) {
            logger.severe(ErrorMessage.GENERAL_WRITE_FAILED_BECAUSE_FILE_IS_TOO_SMALL.getMsg(file.getPath()));
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_BECAUSE_FILE_IS_TOO_SMALL.getMsg(file.getPath()));
        }
    }

    /**
     * Write the tag (if not empty) present in the AudioFile in the associated
     * File
     *
     * @param af The file we want to process
     * @throws CannotWriteException if anything went wrong
     */
    // TODO Creates temp file in same folder as the original file, this is safe
    // but would impose a performance overhead if the original file is on a networked drive
    public void write(AudioFile af) throws CannotWriteException {
        logger.config("Started writing tag data for file:" + af.getFile().getName());

        // Prechecks
        precheckWrite(af);

        //mp3's use a different mechanism to the other formats
        if (af instanceof MP3File) {
            af.commit();
            return;
        }

        RandomAccessFile raf = null;
        RandomAccessFile rafTemp = null;
        File newFile;
        File result;

        // Create temporary File
        try {
            newFile = File.createTempFile(af.getFile().getName().replace('.', '_'), TEMP_FILENAME_SUFFIX, af.getFile().getParentFile());
        }
        // Unable to create temporary file, can happen in Vista if have Create
        // Files/Write Data set to Deny
        catch (IOException ioe) {
            if (ioe.getMessage().equals(FILE_NAME_TOO_LONG) && (af.getFile().getName().length() > FILE_NAME_TOO_LONG_SAFE_LIMIT)) {
                try {

                    newFile = File.createTempFile(af.getFile().getName().substring(0, FILE_NAME_TOO_LONG_SAFE_LIMIT).replace('.', '_'), TEMP_FILENAME_SUFFIX, af.getFile().getParentFile());

                } catch (IOException ioe2) {
                    logger.log(Level.SEVERE, ErrorMessage.GENERAL_WRITE_FAILED_TO_CREATE_TEMPORARY_FILE_IN_FOLDER.getMsg(af.getFile().getName(), af.getFile().getParentFile().getAbsolutePath()), ioe2);
                    throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_TO_CREATE_TEMPORARY_FILE_IN_FOLDER.getMsg(af.getFile().getName(), af.getFile().getParentFile().getAbsolutePath()));
                }
            } else {
                logger.log(Level.SEVERE, ErrorMessage.GENERAL_WRITE_FAILED_TO_CREATE_TEMPORARY_FILE_IN_FOLDER.getMsg(af.getFile().getName(), af.getFile().getParentFile().getAbsolutePath()), ioe);
                throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_TO_CREATE_TEMPORARY_FILE_IN_FOLDER.getMsg(af.getFile().getName(), af.getFile().getParentFile().getAbsolutePath()));
            }
        }

        // Open temporary file and actual file for editing
        try {
            rafTemp = new RandomAccessFile(newFile, WRITE_MODE);
            raf = new RandomAccessFile(af.getFile(), WRITE_MODE);

        }
        // Unable to write to writable file, can happen in Vista if have Create
        // Folders/Append Data set to Deny
        catch (IOException ioe) {
            logger.log(Level.SEVERE, ErrorMessage.GENERAL_WRITE_FAILED_TO_OPEN_FILE_FOR_EDITING.getMsg(af.getFile().getAbsolutePath()), ioe);

            // If we managed to open either file, delete it.
            try {
                if (raf != null) {
                    raf.close();
                }
                if (rafTemp != null) {
                    rafTemp.close();
                }
            } catch (IOException ioe2) {
                // Warn but assume has worked okay
                logger.log(Level.WARNING, ErrorMessage.GENERAL_WRITE_PROBLEM_CLOSING_FILE_HANDLE.getMsg(af.getFile(), ioe.getMessage()), ioe2);
            }

            // Delete the temp file ( we cannot delete until closed corresponding
            // rafTemp)
            if (!newFile.delete()) {
                // Non critical failed deletion
                logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_DELETE_TEMPORARY_FILE.getMsg(newFile.getAbsolutePath()));
            }

            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_TO_OPEN_FILE_FOR_EDITING.getMsg(af.getFile().getAbsolutePath()));
        }

        // Write data to File
        try {

            raf.seek(0);
            rafTemp.seek(0);
            try {
                if (this.modificationListener != null) {
                    this.modificationListener.fileWillBeModified(af, false);
                }
                writeTag(af, af.getTag(), raf, rafTemp);
                if (this.modificationListener != null) {
                    this.modificationListener.fileModified(af, newFile);
                }
            } catch (ModifyVetoException veto) {
                throw new CannotWriteException(veto);
            }
        } catch (Exception e) {
            logger.log(Level.SEVERE, ErrorMessage.GENERAL_WRITE_FAILED_BECAUSE.getMsg(af.getFile(), e.getMessage()), e);

            try {
                if (raf != null) {
                    raf.close();
                }
                if (rafTemp != null) {
                    rafTemp.close();
                }
            } catch (IOException ioe) {
                // Warn but assume has worked okay
                logger.log(Level.WARNING, ErrorMessage.GENERAL_WRITE_PROBLEM_CLOSING_FILE_HANDLE.getMsg(af.getFile().getAbsolutePath(), ioe.getMessage()), ioe);
            }

            // Delete the temporary file because either it was never used so
            // lets just tidy up or we did start writing to it but
            // the write failed and we havent renamed it back to the original
            // file so we can just delete it.
            if (!newFile.delete()) {
                // Non critical failed deletion
                logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_DELETE_TEMPORARY_FILE.getMsg(newFile.getAbsolutePath()));
            }
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_BECAUSE.getMsg(af.getFile(), e.getMessage()));
        } finally {
            try {
                if (raf != null) {
                    raf.close();
                }
                if (rafTemp != null) {
                    rafTemp.close();
                }
            } catch (IOException ioe) {
                // Warn but assume has worked okay
                logger.log(Level.WARNING, ErrorMessage.GENERAL_WRITE_PROBLEM_CLOSING_FILE_HANDLE.getMsg(af.getFile().getAbsolutePath(), ioe.getMessage()), ioe);
            }
        }

        // Result held in this file
        result = af.getFile();

        // If the temporary file was used
        if (newFile.length() > 0) {
            transferNewFileToOriginalFile(newFile, af.getFile(), TagOptionSingleton.getInstance().isPreserveFileIdentity());
        } else {
            // Delete the temporary file that wasn't ever used
            if (!newFile.delete()) {
                // Non critical failed deletion
                logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_DELETE_TEMPORARY_FILE.getMsg(newFile.getPath()));
            }
        }

        if (this.modificationListener != null) {
            this.modificationListener.fileOperationFinished(result);
        }
    }

    /**
     * <p>
     * Transfers the content from {@code newFile} to a file named {@code originalFile}.
     * With regards to file identity (inode/<a href="https://msdn.microsoft.com/en-us/library/aa363788(v=vs.85).aspx">fileIndex</a>),
     * after execution, {@code originalFile} may be a completely new file or the same file as before execution, depending
     * on {@code reuseExistingOriginalFile}.
     * </p>
     * <p>
     * Reusing the existing file may be slower, if both the temp file and the original file are located
     * in the same filesystem, because an actual copy is created instead of just a file rename.
     * If both files are on different filesystems, a copy is always needed — regardless of which method is used.
     * </p>
     *
     * @param newFile                   new file
     * @param originalFile              original file
     * @param reuseExistingOriginalFile {@code true} or {@code false}
     * @throws CannotWriteException If the file cannot be written
     */
    private void transferNewFileToOriginalFile(final File newFile, final File originalFile, final boolean reuseExistingOriginalFile) throws CannotWriteException {
        if (reuseExistingOriginalFile) {
            transferNewFileContentToOriginalFile(newFile, originalFile);
        } else {
            transferNewFileToNewOriginalFile(newFile, originalFile);
        }
    }

    /**
     * <p>
     * Writes the contents of the given {@code newFile} to the given {@code originalFile},
     * overwriting the already existing content in {@code originalFile}.
     * This ensures that the file denoted by the abstract pathname {@code originalFile}
     * keeps the same Unix inode or Windows
     * <a href="https://msdn.microsoft.com/en-us/library/aa363788(v=vs.85).aspx">fileIndex</a>.
     * </p>
     * <p>
     * If no errors occur, the method follows this approach:
     * </p>
     * <ol>
     * <li>Rename <code>originalFile</code> to <code>originalFile.old</code></li>
     * <li>Rename <code>newFile</code> to <code>originalFile</code> (this implies a file identity change for <code>originalFile</code>)</li>
     * <li>Delete <code>originalFile.old</code></li>
     * <li>Delete <code>newFile</code></li>
     * </ol>
     *
     * @param newFile      File containing the data we want in the {@code originalFile}
     * @param originalFile Before execution this denotes the original, unmodified file.
     *                     After execution it denotes the name of the file with the modified content and new inode/fileIndex.
     * @throws CannotWriteException if the file cannot be written
     */
    private void transferNewFileContentToOriginalFile(final File newFile, final File originalFile) throws CannotWriteException {
        // try to obtain exclusive lock on the file
        RandomAccessFile raf = null;
        try {
            raf = new RandomAccessFile(originalFile, "rw");
            final FileChannel outChannel = raf.getChannel();
            FileLock lock = null;
            try {
                lock = outChannel.tryLock();
                if (lock != null) {
                    transferNewFileContentToOriginalFile(newFile, originalFile, raf, outChannel);
                } else {
                    // we didn't get a lock
                    logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_FILE_LOCKED.getMsg(originalFile.getPath()));
                    throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_FILE_LOCKED.getMsg(originalFile.getPath()));
                }
            } catch (IOException e) {
                logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_FILE_LOCKED.getMsg(originalFile.getPath()));
                // we didn't get a lock, this may be, because locking is not supported by the OS/JRE
                // this can happen on OS X with network shares (samba, afp)
                // for details see https://stackoverflow.com/questions/33220148/samba-share-gradle-java-io-exception
                // coarse check that works on OS X:
                if ("Operation not supported".equals(e.getMessage())) {
                    // transfer without lock
                    transferNewFileContentToOriginalFile(newFile, originalFile, raf, outChannel);
                } else {
                    throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_FILE_LOCKED.getMsg(originalFile.getPath()), e);
                }
            } catch (Exception e) {
                // tryLock failed for some reason other than an IOException — we're definitely doomed
                logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_FILE_LOCKED.getMsg(originalFile.getPath()));
                throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_FILE_LOCKED.getMsg(originalFile.getPath()), e);
            } finally {
                if (lock != null)
                    lock.release();
            }
        } catch (FileNotFoundException e) {
            logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_BECAUSE_FILE_NOT_FOUND.getMsg(originalFile.getAbsolutePath()));
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_BECAUSE_FILE_NOT_FOUND.getMsg(originalFile.getPath()), e);
        } catch (Exception e) {
            logger.warning(ErrorMessage.GENERAL_WRITE_FAILED.getMsg(originalFile.getAbsolutePath()));
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED.getMsg(originalFile.getPath()), e);
        } finally {
            AudioFileIO.closeQuietly(raf);
        }
    }

    private void transferNewFileContentToOriginalFile(final File newFile, final File originalFile, final RandomAccessFile raf, final FileChannel outChannel) throws CannotWriteException {
        FileInputStream in = null;
        try {
            in = new FileInputStream(newFile);
            FileChannel inChannel = in.getChannel();
            // copy contents of newFile to originalFile,
            // overwriting the old content in that file
            final long size = inChannel.size();
            long position = 0;
            while (position < size) {
                position += inChannel.transferTo(position, 1024L * 1024L, outChannel);
            }
            // truncate raf, in case it used to be longer
            raf.setLength(size);
        } catch (FileNotFoundException e) {
            logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_NEW_FILE_DOESNT_EXIST.getMsg(newFile.getAbsolutePath()));
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_NEW_FILE_DOESNT_EXIST.getMsg(newFile.getName()), e);
        } catch (IOException e) {
            logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_RENAME_TO_ORIGINAL_FILE.getMsg(originalFile.getAbsolutePath(), newFile.getName()));
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_TO_RENAME_TO_ORIGINAL_FILE.getMsg(originalFile.getAbsolutePath(), newFile.getName()), e);
        } finally {
            AudioFileIO.closeQuietly(in);
        }
        // file is written, all is good, let's delete newFile, as it's not needed anymore
        if (newFile.exists() && !newFile.delete()) {
            // non-critical failed deletion
            logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_DELETE_TEMPORARY_FILE.getMsg(newFile.getPath()));
        }
    }

    /**
     * <p>
     * Replaces the original file with the new file in a way that changes the file identity.
     * In other words, the Unix inode or the Windows
     * <a href="https://msdn.microsoft.com/en-us/library/aa363788(v=vs.85).aspx">fileIndex</a>
     * of the resulting file with the name {@code originalFile} is not identical to the inode/fileIndex
     * of the file named {@code originalFile} before this method was called.
     * </p>
     * <p>
     * If no errors occur, the method follows this approach:
     * </p>
     * <ol>
     * <li>Rename <code>originalFile</code> to <code>originalFile.old</code></li>
     * <li>Rename <code>newFile</code> to <code>originalFile</code> (this implies a file identity change for <code>originalFile</code>)</li>
     * <li>Delete <code>originalFile.old</code></li>
     * <li>Delete <code>newFile</code></li>
     * </ol>
     *
     * @param newFile      File containing the data we want in the {@code originalFile}
     * @param originalFile Before execution this denotes the original, unmodified file.
     *                     After execution it denotes the name of the file with the modified content and new inode/fileIndex.
     * @throws CannotWriteException if the file cannot be written
     */
    private void transferNewFileToNewOriginalFile(final File newFile, final File originalFile) throws CannotWriteException {
        // Rename Original File
        // Can fail on Vista if have Special Permission 'Delete' set Deny
        File originalFileBackup = new File(originalFile.getAbsoluteFile().getParentFile().getPath(), AudioFile.getBaseFilename(originalFile) + ".old");

        //If already exists modify the suffix
        int count = 1;
        while (originalFileBackup.exists()) {
            originalFileBackup = new File(originalFile.getAbsoluteFile().getParentFile().getPath(), AudioFile.getBaseFilename(originalFile) + ".old" + count);
            count++;
        }

        boolean renameResult = Utils.rename(originalFile, originalFileBackup);
        if (!renameResult) {
            logger.log(Level.SEVERE, ErrorMessage.GENERAL_WRITE_FAILED_TO_RENAME_ORIGINAL_FILE_TO_BACKUP.getMsg(originalFile.getAbsolutePath(), originalFileBackup.getName()));
            //Delete the temp file because write has failed
            // TODO: Simplify: newFile is always != null, otherwise we would not have entered this block (-> if (newFile.length() > 0) {})
            if (newFile != null) {
                newFile.delete();
            }
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_TO_RENAME_ORIGINAL_FILE_TO_BACKUP.getMsg(originalFile.getPath(), originalFileBackup.getName()));
        }

        // Rename Temp File to Original File
        renameResult = Utils.rename(newFile, originalFile);
        if (!renameResult) {
            // Renamed failed so lets do some checks rename the backup back to the original file
            // New File doesnt exist
            if (!newFile.exists()) {
                logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_NEW_FILE_DOESNT_EXIST.getMsg(newFile.getAbsolutePath()));
            }

            // Rename the backup back to the original
            if (!originalFileBackup.renameTo(originalFile)) {
                // TODO now if this happens we are left with testfile.old
                // instead of testfile.mp4
                logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_RENAME_ORIGINAL_BACKUP_TO_ORIGINAL.getMsg(originalFileBackup.getAbsolutePath(), originalFile.getName()));
            }

            logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_RENAME_TO_ORIGINAL_FILE.getMsg(originalFile.getAbsolutePath(), newFile.getName()));
            throw new CannotWriteException(ErrorMessage.GENERAL_WRITE_FAILED_TO_RENAME_TO_ORIGINAL_FILE.getMsg(originalFile.getAbsolutePath(), newFile.getName()));
        } else {
            // Rename was okay so we can now delete the backup of the
            // original
            boolean deleteResult = originalFileBackup.delete();
            if (!deleteResult) {
                // Not a disaster but can't delete the backup so make a
                // warning
                logger.warning(ErrorMessage.GENERAL_WRITE_WARNING_UNABLE_TO_DELETE_BACKUP_FILE.getMsg(originalFileBackup.getAbsolutePath()));
            }

        }

        // Delete the temporary file if still exists
        if (newFile.exists()) {
            if (!newFile.delete()) {
                // Non critical failed deletion
                logger.warning(ErrorMessage.GENERAL_WRITE_FAILED_TO_DELETE_TEMPORARY_FILE.getMsg(newFile.getPath()));
            }
        }
    }

    /**
     * This is called when a tag has to be written in a file. Three parameters
     * are provided, the tag to write (not empty) Two randomaccessfiles, the
     * first points to the file where we want to write the given tag, and the
     * second is an empty temporary file that can be used if e.g. the file has
     * to be bigger than the original.
     * <p/>
     * If something has been written in the temporary file, when this method
     * returns, the original file is deleted, and the temporary file is renamed
     * the the original name
     * <p/>
     * If nothing has been written to it, it is simply deleted.
     * <p/>
     * This method can assume the raf, rafTemp are pointing to the first byte of
     * the file. The subclass must not close these two files when the method
     * returns.
     *
     * @param audioFile
     * @param tag
     * @param raf
     * @param rafTemp
     * @throws IOException                                           is thrown when the RandomAccessFile operations throw it (you
     *                                                               should never throw them manually)
     * @throws CannotWriteException                                  when an error occured during the generation of the tag
     * @throws org.jaudiotagger.audio.exceptions.CannotReadException
     */
    protected abstract void writeTag(AudioFile audioFile, Tag tag, RandomAccessFile raf, RandomAccessFile rafTemp) throws CannotReadException, CannotWriteException, IOException;
}
