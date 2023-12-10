/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Christian Laireiter <liree@web.de>
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
import org.jaudiotagger.audio.exceptions.ModifyVetoException;

import java.io.File;

/**
 * Classes implementing this interface will be notified on audio file's
 * modifications.<br>
 *
 * <p>It will be notified on several occasions:<br>
 * <ul>
 * <li>An audio file is about to be modified
 * {@link #fileWillBeModified(AudioFile,boolean)}<br>
 * Here one can modify the tag data because of global settings.</li>
 * <li>The write process has just finished. But if a copy was created the
 * original has not been replaced yet. ({@link #fileModified(AudioFile,File)}).</li>
 * <li>The operation has been finished. {@link #fileOperationFinished(File)}</li>
 * </ul>
 *
 * @author Christian Laireiter <liree@web.de>
 */
public interface AudioFileModificationListener
{

    /**
     * Notifies that <code>original</code> has been processed.<br>
     * Because the audiolibrary allows format implementors to either change the
     * original file or create a copy, it is possible that the real result is
     * located in the original and <code>temporary</code> is of zero size
     * <b>or</b> the original will be deleted and replaced by temporary.<br>
     *
     * @param original  The original file on which the operation was started.
     * @param temporary The modified copy. (It may be of zero size if the original was
     *                  modified)
     * @throws ModifyVetoException If the Results doesn't fit the expectations of the listener,
     *                             it can prevent the replacement of the original by temporary.<br>
     *                             If the original is already modified, this exception results
     *                             in nothing.
     */
    public void fileModified(AudioFile original, File temporary) throws ModifyVetoException;

    /**
     * Informs the listener that the process has been finished.<br>
     * The given file is either the original file or the modified copy.<br>
     *
     * @param result The remaining file. It's not of {@link AudioFile} since it may
     *               be possible that a new file was created. In that case the
     *               audiolibs would need to parse the file again, which leads to
     *               long and unnecessary operation time, if the tag data is not
     *               needed any more.
     */
    public void fileOperationFinished(File result);

    /**
     * Notifies that the <code>file</code> is about to be modified.
     *
     * @param file   The file that will be modified.
     * @param delete <code>true</code> if the deletion of tag data will be
     *               performed.
     * @throws ModifyVetoException Thrown if the listener wants to prevent the process.
     */
    public void fileWillBeModified(AudioFile file, boolean delete) throws ModifyVetoException;

    /**
     * This method notifies about a veto exception that has been thrown by
     * another listener.<br>
     *
     * @param cause    The instance which caused the veto.
     * @param original The original file, that was about to be modified.
     * @param veto     The thrown exception.
     */
    public void vetoThrown(AudioFileModificationListener cause, AudioFile original, ModifyVetoException veto);

}
