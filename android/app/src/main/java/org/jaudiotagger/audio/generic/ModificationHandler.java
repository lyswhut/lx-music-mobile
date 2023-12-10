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
import java.util.Vector;

/**
 * This class multicasts the events to multiple listener instances.<br>
 * Additionally the Vetos are handled. (other listeners are notified).
 *
 * @author Christian Laireiter
 */
public class ModificationHandler implements AudioFileModificationListener
{

    /**
     * The listeners to wich events are broadcasted are stored here.
     */
    private Vector<AudioFileModificationListener> listeners = new Vector<AudioFileModificationListener>();

    /**
     * This method adds an {@link AudioFileModificationListener}
     *
     * @param l Listener to add.
     */
    public void addAudioFileModificationListener(AudioFileModificationListener l)
    {
        if (!this.listeners.contains(l))
        {
            this.listeners.add(l);
        }
    }

    /**
     * (overridden)
     *
     * @see org.jaudiotagger.audio.generic.AudioFileModificationListener#fileModified(org.jaudiotagger.audio.AudioFile,
     *File)
     */
    public void fileModified(AudioFile original, File temporary) throws ModifyVetoException
    {
        for (AudioFileModificationListener listener : this.listeners)
        {
            AudioFileModificationListener current = listener;
            try
            {
                current.fileModified(original, temporary);
            }
            catch (ModifyVetoException e)
            {
                vetoThrown(current, original, e);
                throw e;
            }
        }
    }

    /**
     * (overridden)
     *
     * @see org.jaudiotagger.audio.generic.AudioFileModificationListener#fileOperationFinished(File)
     */
    public void fileOperationFinished(File result)
    {
        for (AudioFileModificationListener listener : this.listeners)
        {
            AudioFileModificationListener current = listener;
            current.fileOperationFinished(result);
        }
    }

    /**
     * (overridden)
     *
     * @see org.jaudiotagger.audio.generic.AudioFileModificationListener#fileWillBeModified(org.jaudiotagger.audio.AudioFile,
     *boolean)
     */
    public void fileWillBeModified(AudioFile file, boolean delete) throws ModifyVetoException
    {
        for (AudioFileModificationListener listener : this.listeners)
        {
            AudioFileModificationListener current = listener;
            try
            {
                current.fileWillBeModified(file, delete);
            }
            catch (ModifyVetoException e)
            {
                vetoThrown(current, file, e);
                throw e;
            }
        }
    }

    /**
     * This method removes an {@link AudioFileModificationListener}
     *
     * @param l Listener to remove.
     */
    public void removeAudioFileModificationListener(AudioFileModificationListener l)
    {
        if (this.listeners.contains(l))
        {
            this.listeners.remove(l);
        }
    }

    /**
     * (overridden)
     *
     * @see org.jaudiotagger.audio.generic.AudioFileModificationListener#vetoThrown(org.jaudiotagger.audio.generic.AudioFileModificationListener,
     *org.jaudiotagger.audio.AudioFile,
     *org.jaudiotagger.audio.exceptions.ModifyVetoException)
     */
    public void vetoThrown(AudioFileModificationListener cause, AudioFile original, ModifyVetoException veto)
    {
        for (AudioFileModificationListener listener : this.listeners)
        {
            AudioFileModificationListener current = listener;
            current.vetoThrown(cause, original, veto);
        }
    }
}
