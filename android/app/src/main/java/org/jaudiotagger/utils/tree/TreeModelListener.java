/*
 * @(#)TreeModelListener.java	1.19 10/03/23
 *
 * Copyright (c) 2006, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

package org.jaudiotagger.utils.tree;

import java.util.EventListener;

/**
 * Defines the interface for an object that listens
 * to changes in a TreeModel.
 * For further information and examples see
 * <a
 href="http://java.sun.com/docs/books/tutorial/uiswing/events/treemodellistener.html">How to Write a Tree Model Listener</a>,
 * a section in <em>The Java Tutorial.</em>
 *
 * @version 1.19 03/23/10
 * @author Rob Davis
 * @author Ray Ryan
 */
public interface TreeModelListener extends EventListener {

    /**
     * <p>Invoked after a node (or a set of siblings) has changed in some
     * way. The node(s) have not changed locations in the tree or
     * altered their children arrays, but other attributes have
     * changed and may affect presentation. Example: the name of a
     * file has changed, but it is in the same location in the file
     * system.
     * <p>To indicate the root has changed, childIndices and children
     * will be null.
     * 
     * <p>Use <code>e.getPath()</code> 
     * to get the parent of the changed node(s).
     * <code>e.getChildIndices()</code>
     * returns the index(es) of the changed node(s).
     */
    void treeNodesChanged(TreeModelEvent e);

    /**
     * <p>Invoked after nodes have been inserted into the tree.
     * 
     * <p>Use <code>e.getPath()</code> 
     * to get the parent of the new node(s).
     * <code>e.getChildIndices()</code>
     * returns the index(es) of the new node(s)
     * in ascending order.
     */
    void treeNodesInserted(TreeModelEvent e);

    /**
     * <p>Invoked after nodes have been removed from the tree.  Note that
     * if a subtree is removed from the tree, this method may only be
     * invoked once for the root of the removed subtree, not once for
     * each individual set of siblings removed.
     *
     * <p>Use <code>e.getPath()</code> 
     * to get the former parent of the deleted node(s).
     * <code>e.getChildIndices()</code>
     * returns, in ascending order, the index(es) 
     * the node(s) had before being deleted.
     */
    void treeNodesRemoved(TreeModelEvent e);

    /**
     * <p>Invoked after the tree has drastically changed structure from a
     * given node down.  If the path returned by e.getPath() is of length
     * one and the first element does not identify the current root node
     * the first element should become the new root of the tree.<p>
     * 
     * <p>Use <code>e.getPath()</code> 
     * to get the path to the node.
     * <code>e.getChildIndices()</code>
     * returns null.
     */
    void treeStructureChanged(TreeModelEvent e);

}
