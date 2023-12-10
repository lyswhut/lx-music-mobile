package org.jaudiotagger.audio.mp4;

import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.exceptions.NullBoxIdException;
import org.jaudiotagger.audio.mp4.atom.Mp4BoxHeader;
import org.jaudiotagger.audio.mp4.atom.Mp4MetaBox;
import org.jaudiotagger.audio.mp4.atom.Mp4StcoBox;
import org.jaudiotagger.audio.mp4.atom.NullPadding;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.utils.tree.DefaultMutableTreeNode;
import org.jaudiotagger.utils.tree.DefaultTreeModel;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.logging.Logger;

/**
 * Tree representing atoms in the mp4 file
 *
 * Note it doesn't create the complete tree it delves into subtrees for atom we know about and are interested in. (Note
 * it would be impossible to create a complete tree for any file without understanding all the nodes because
 * some atoms such as meta contain data and children and therefore need to be specially preprocessed)
 *
 * This class is currently only used when writing tags because it better handles the difficulties of mdat and free
 * atoms being optional/multiple places then the older sequential method. It is expected this class will eventually
 * be used when reading tags as well.
 *
 * Uses a TreeModel for the tree, with convenience methods holding onto references to most common nodes so they
 * can be used without having to traverse the tree again.
 */
public class Mp4AtomTree
{
    private DefaultMutableTreeNode rootNode;
    private DefaultTreeModel dataTree;
    private DefaultMutableTreeNode moovNode;
    private DefaultMutableTreeNode mdatNode;
    private DefaultMutableTreeNode ilstNode;
    private DefaultMutableTreeNode metaNode;
    private DefaultMutableTreeNode tagsNode;
    private DefaultMutableTreeNode udtaNode;
    private DefaultMutableTreeNode hdlrWithinMdiaNode;
    private DefaultMutableTreeNode hdlrWithinMetaNode;
    private List<DefaultMutableTreeNode> stcoNodes = new ArrayList<DefaultMutableTreeNode>();
    private List<DefaultMutableTreeNode> freeNodes = new ArrayList<DefaultMutableTreeNode>();
    private List<DefaultMutableTreeNode> mdatNodes = new ArrayList<DefaultMutableTreeNode>();
    private List<DefaultMutableTreeNode> trakNodes = new ArrayList<DefaultMutableTreeNode>();

    private List<Mp4StcoBox> stcos = new ArrayList<Mp4StcoBox>();
    private ByteBuffer moovBuffer; //Contains all the data under moov
    private Mp4BoxHeader moovHeader;

    //Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.mp4");

    /**
     * Create Atom Tree
     *
     * @param raf
     * @throws IOException
     * @throws CannotReadException
     */
    public Mp4AtomTree(RandomAccessFile raf) throws IOException, CannotReadException
    {
        buildTree(raf, true);
    }

    /**
     * Create Atom Tree and maintain open channel to raf, should only be used if will continue
     * to use raf after this call, you will have to close raf yourself.
     *
     * @param raf
     * @param closeOnExit to keep randomfileaccess open, only used when randomaccessfile already being used
     * @throws IOException
     * @throws CannotReadException
     */
    public Mp4AtomTree(RandomAccessFile raf, boolean closeOnExit) throws IOException, CannotReadException
    {
        buildTree(raf, closeOnExit);
    }

    /**
     * Build a tree of the atoms in the file
     *
     * @param raf
     * @param closeExit false to keep randomfileacces open, only used when randomaccessfile already being used
     * @return
     * @throws IOException
     * @throws org.jaudiotagger.audio.exceptions.CannotReadException
     */
    public DefaultTreeModel buildTree(RandomAccessFile raf, boolean closeExit) throws IOException, CannotReadException
    {
        FileChannel fc = null;
        try
        {
            fc = raf.getChannel();

            //make sure at start of file
            fc.position(0);

            //Build up map of nodes
            rootNode = new DefaultMutableTreeNode();
            dataTree = new DefaultTreeModel(rootNode);

            //Iterate though all the top level Nodes
            ByteBuffer headerBuffer = ByteBuffer.allocate(Mp4BoxHeader.HEADER_LENGTH);
            while (fc.position() < fc.size())
            {
                Mp4BoxHeader boxHeader = new Mp4BoxHeader();
                headerBuffer.clear();          
                fc.read(headerBuffer);
                headerBuffer.rewind();

                try
                {
                    boxHeader.update(headerBuffer);
                }
                catch(NullBoxIdException ne)
                {
                    //If we only get this error after all the expected data has been found we allow it
                    if(moovNode!=null&mdatNode!=null)
                    {
                        NullPadding np = new NullPadding(fc.position() - Mp4BoxHeader.HEADER_LENGTH,fc.size());
                        DefaultMutableTreeNode trailingPaddingNode = new DefaultMutableTreeNode(np);
                        rootNode.add(trailingPaddingNode);
                        logger.warning(ErrorMessage.NULL_PADDING_FOUND_AT_END_OF_MP4.getMsg(np.getFilePos()));
                        break;
                    }
                    else
                    {
                        //File appears invalid
                        throw ne;
                    }
                }
                                   
                boxHeader.setFilePos(fc.position() - Mp4BoxHeader.HEADER_LENGTH);
                DefaultMutableTreeNode newAtom = new DefaultMutableTreeNode(boxHeader);

                //Go down moov
                if (boxHeader.getId().equals(Mp4AtomIdentifier.MOOV.getFieldName()))
                {
                    //A second Moov atom, this is illegal but may just be mess at the end of the file so ignore
                    //and finish
                    if(moovNode!=null&mdatNode!=null)
                    {
                        logger.warning(ErrorMessage.ADDITIONAL_MOOV_ATOM_AT_END_OF_MP4.getMsg(fc.position() - Mp4BoxHeader.HEADER_LENGTH));
                        break;
                    }
                    moovNode    = newAtom;
                    moovHeader  = boxHeader;

                    long filePosStart = fc.position();
                    moovBuffer = ByteBuffer.allocate(boxHeader.getDataLength());
                    int bytesRead = fc.read(moovBuffer);

                    //If Moov atom is incomplete we are not going to be able to read this file properly
                    if(bytesRead < boxHeader.getDataLength())
                    {
                        String msg = ErrorMessage.ATOM_LENGTH_LARGER_THAN_DATA.getMsg(boxHeader.getId(), boxHeader.getDataLength(),bytesRead);
                        throw new CannotReadException(msg);
                    }
                    moovBuffer.rewind();
                    buildChildrenOfNode(moovBuffer, newAtom);
                    fc.position(filePosStart);
                }
                else if (boxHeader.getId().equals(Mp4AtomIdentifier.FREE.getFieldName()))
                {
                    //Might be multiple in different locations
                    freeNodes.add(newAtom);
                }
                else if (boxHeader.getId().equals(Mp4AtomIdentifier.MDAT.getFieldName()))
                {
                    //mdatNode always points to the last mDatNode, normally there is just one mdatnode but do have
                    //a valid example of multiple mdatnode

                    //if(mdatNode!=null)
                    //{
                    //    throw new CannotReadException(ErrorMessage.MP4_FILE_CONTAINS_MULTIPLE_DATA_ATOMS.getMsg());
                    //}
                    mdatNode = newAtom;
                    mdatNodes.add(newAtom);
                }
                rootNode.add(newAtom);
                fc.position(fc.position() + boxHeader.getDataLength());
            }
            return dataTree;
        }
        finally
        {
            //If we cant find the audio then we cannot modify this file so better to throw exception
            //now rather than later when try and write to it.
            if(mdatNode==null)
            {
                throw new CannotReadException(ErrorMessage.MP4_CANNOT_FIND_AUDIO.getMsg());
            }

            if (closeExit)
            {
                fc.close();
            }
        }
    }

    /**
     * Display atom tree
     */
    @SuppressWarnings("unchecked")
    public void printAtomTree()
    {
        Enumeration<DefaultMutableTreeNode> e = rootNode.preorderEnumeration();
        DefaultMutableTreeNode nextNode;
        while (e.hasMoreElements())
        {
            nextNode = e.nextElement();
            Mp4BoxHeader header = (Mp4BoxHeader) nextNode.getUserObject();
            if (header != null)
            {
                String tabbing = "";
                for (int i = 1; i < nextNode.getLevel(); i++)
                {
                    tabbing += "\t";
                }

                if(header instanceof NullPadding)
                {
                    System.out.println(tabbing + "Null pad " + " @ " + header.getFilePos() + " of size:" + header.getLength() + " ,ends @ " + (header.getFilePos() + header.getLength()));                                        
                }
                else
                {
                    System.out.println(tabbing + "Atom " + header.getId() + " @ " + header.getFilePos() + " of size:" + header.getLength() + " ,ends @ " + (header.getFilePos() + header.getLength()));
                }
            }
        }
    }

    /**
     *
     * @param moovBuffer
     * @param parentNode
     * @throws IOException
     * @throws CannotReadException
     */
    public void buildChildrenOfNode(ByteBuffer moovBuffer, DefaultMutableTreeNode parentNode) throws IOException, CannotReadException
    {
        Mp4BoxHeader boxHeader;

        //Preprocessing for nodes that contain data before their children atoms
        Mp4BoxHeader parentBoxHeader = (Mp4BoxHeader) parentNode.getUserObject();

        //We set the buffers position back to this after processing the children
        int justAfterHeaderPos = moovBuffer.position();

        //Preprocessing for meta that normally contains 4 data bytes, but doesn't where found under track or tags atom
        if (parentBoxHeader.getId().equals(Mp4AtomIdentifier.META.getFieldName()))
        {
            Mp4MetaBox meta = new Mp4MetaBox(parentBoxHeader, moovBuffer);
            meta.processData();

            try
            {
                boxHeader = new Mp4BoxHeader(moovBuffer);
            }
            catch(NullBoxIdException nbe)
            {
                //It might be that the meta box didn't actually have any additional data after it so we adjust the buffer
                //to be immediately after metabox and code can retry
                moovBuffer.position(moovBuffer.position()-Mp4MetaBox.FLAGS_LENGTH);
            }
            finally
            {
                //Skip back last header cos this was only a test 
                moovBuffer.position(moovBuffer.position()-  Mp4BoxHeader.HEADER_LENGTH);
            }
        }

        //Defines where to start looking for the first child node
        int startPos = moovBuffer.position();        
        while (moovBuffer.position() < ((startPos + parentBoxHeader.getDataLength()) - Mp4BoxHeader.HEADER_LENGTH))
        {
            boxHeader = new Mp4BoxHeader(moovBuffer);
            if (boxHeader != null)
            {
                boxHeader.setFilePos(moovHeader.getFilePos() + moovBuffer.position());
                logger.finest("Atom " + boxHeader.getId() + " @ " + boxHeader.getFilePos() + " of size:" + boxHeader.getLength() + " ,ends @ " + (boxHeader.getFilePos() + boxHeader.getLength()));

                DefaultMutableTreeNode newAtom = new DefaultMutableTreeNode(boxHeader);
                parentNode.add(newAtom);

                if (boxHeader.getId().equals(Mp4AtomIdentifier.UDTA.getFieldName()))
                {
                    udtaNode = newAtom;
                }
                //only interested in metaNode that is child of udta node
                else if (boxHeader.getId().equals(Mp4AtomIdentifier.META.getFieldName())&&parentBoxHeader.getId().equals(Mp4AtomIdentifier.UDTA.getFieldName()))
                {
                    metaNode = newAtom;
                }
                else if (boxHeader.getId().equals(Mp4AtomIdentifier.HDLR.getFieldName())&&parentBoxHeader.getId().equals(Mp4AtomIdentifier.META.getFieldName()))
                {
                    hdlrWithinMetaNode = newAtom;
                }
                else if (boxHeader.getId().equals(Mp4AtomIdentifier.HDLR.getFieldName()))
                {
                    hdlrWithinMdiaNode = newAtom;
                }
                else if (boxHeader.getId().equals(Mp4AtomIdentifier.TAGS.getFieldName()))
                {
                    tagsNode = newAtom;
                }
                else if (boxHeader.getId().equals(Mp4AtomIdentifier.STCO.getFieldName()))
                {
                    stcos.add(new Mp4StcoBox(boxHeader, moovBuffer));
                    stcoNodes.add(newAtom);
                }
                else if (boxHeader.getId().equals(Mp4AtomIdentifier.ILST.getFieldName()))
                {
                    DefaultMutableTreeNode parent = (DefaultMutableTreeNode)parentNode.getParent();
                    if(parent!=null)
                    {
                        Mp4BoxHeader parentsParent = (Mp4BoxHeader)(parent).getUserObject();
                        if(parentsParent!=null)
                        {
                            if(parentBoxHeader.getId().equals(Mp4AtomIdentifier.META.getFieldName())&&parentsParent.getId().equals(Mp4AtomIdentifier.UDTA.getFieldName()))
                            {
                                ilstNode = newAtom;
                            }
                        }
                    }    
                }
                else if (boxHeader.getId().equals(Mp4AtomIdentifier.FREE.getFieldName()))
                {
                    //Might be multiple in different locations
                    freeNodes.add(newAtom);
                }
                else if (boxHeader.getId().equals(Mp4AtomIdentifier.TRAK.getFieldName()))
                {
                    //Might be multiple in different locations, although only one should be audio track
                    trakNodes.add(newAtom);
                }

                //For these atoms iterate down to build their children
                if ((boxHeader.getId().equals(Mp4AtomIdentifier.TRAK.getFieldName())) ||
                        (boxHeader.getId().equals(Mp4AtomIdentifier.MDIA.getFieldName())) ||
                        (boxHeader.getId().equals(Mp4AtomIdentifier.MINF.getFieldName())) ||
                        (boxHeader.getId().equals(Mp4AtomIdentifier.STBL.getFieldName())) ||
                        (boxHeader.getId().equals(Mp4AtomIdentifier.UDTA.getFieldName())) ||
                        (boxHeader.getId().equals(Mp4AtomIdentifier.META.getFieldName())) ||
                        (boxHeader.getId().equals(Mp4AtomIdentifier.ILST.getFieldName())))
                {                
                    buildChildrenOfNode(moovBuffer, newAtom);
                }
                //Now  adjust buffer for the next atom header at this level
                moovBuffer.position(moovBuffer.position() + boxHeader.getDataLength());

            }
        }
        moovBuffer.position(justAfterHeaderPos);
    }


    /**
     *
     * @return
     */
    public DefaultTreeModel getDataTree()
    {
        return dataTree;
    }


    /**
     *
     * @return
     */
    public DefaultMutableTreeNode getMoovNode()
    {
        return moovNode;
    }

    /**
     *
     * @return
     */
    public List<DefaultMutableTreeNode> getStcoNodes()
    {
        return stcoNodes;
    }

    /**
     *
     * @return
     */
    public DefaultMutableTreeNode getIlstNode()
    {
        return ilstNode;
    }

    /**
     *
     * @param node
     * @return
     */
    public Mp4BoxHeader getBoxHeader(DefaultMutableTreeNode node)
    {
        if (node == null)
        {
            return null;
        }
        return (Mp4BoxHeader) node.getUserObject();
    }

    /**
     *
     * @return
     */
    public DefaultMutableTreeNode getMdatNode()
    {
        return mdatNode;
    }

    /**
     *
     * @return
     */
    public DefaultMutableTreeNode getUdtaNode()
    {
        return udtaNode;
    }

    /**
     *
     * @return
     */
    public DefaultMutableTreeNode getMetaNode()
    {
        return metaNode;
    }

    /**
     *
     * @return
     */
    public DefaultMutableTreeNode getHdlrWithinMetaNode()
    {
        return hdlrWithinMetaNode;
    }

    /**
     *
     * @return
     */
    public DefaultMutableTreeNode getHdlrWithinMdiaNode()
    {
        return hdlrWithinMdiaNode;
    }

    /**
     *
     * @return
     */
    public DefaultMutableTreeNode getTagsNode()
    {
        return tagsNode;
    }

    /**
     *
     * @return
     */
    public List<DefaultMutableTreeNode> getFreeNodes()
    {
        return freeNodes;
    }

    /**
     *
     * @return
     */
    public List<DefaultMutableTreeNode> getTrakNodes()
    {
        return trakNodes;
    }

    /**
     *
     * @return
     */
    public List<Mp4StcoBox> getStcos()
    {
        return stcos;
    }

    /**
     *
     * @return
     */
    public ByteBuffer getMoovBuffer()
    {
        return moovBuffer;
    }

    /**
     *
     * @return
     */
    public Mp4BoxHeader getMoovHeader()
    {
        return moovHeader;
    }
}
