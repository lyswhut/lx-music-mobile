/*
 * @(#)TreeNode.java	1.26 10/03/23
 *
 * Copyright (c) 2006, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

package org.jaudiotagger.utils.tree;

import java.util.Enumeration;

/**
 * Defines the requirements for an object that can be used as a
 * tree node in a JTree.
 * <p>
 * Implementations of <code>TreeNode</code> that override <code>equals</code>
 * will typically need to override <code>hashCode</code> as well.  Refer
 * to {@link javax.swing.tree.TreeModel} for more information.
 *
 * For further information and examples of using tree nodes,
 * see <a
 href="http://java.sun.com/docs/books/tutorial/uiswing/components/tree.html">How to Use Tree Nodes</a>
 * in <em>The Java Tutorial.</em>
 *
 * @version 1.26 03/23/10
 * @author Rob Davis
 * @author Scott Violet
 */

public interface TreeNode
{
    /**
     * Returns the child <code>TreeNode</code> at index 
     * <code>childIndex</code>.
     */
    TreeNode getChildAt(int childIndex);

    /**
     * Returns the number of children <code>TreeNode</code>s the receiver
     * contains.
     */
    int getChildCount();

    /**
     * Returns the parent <code>TreeNode</code> of the receiver.
     */
    TreeNode getParent();

    /**
     * Returns the index of <code>node</code> in the receivers children.
     * If the receiver does not contain <code>node</code>, -1 will be
     * returned.
     */
    int getIndex(TreeNode node);

    /**
     * Returns true if the receiver allows children.
     */
    boolean getAllowsChildren();

    /**
     * Returns true if the receiver is a leaf.
     */
    boolean isLeaf();

    /**
     * Returns the children of the receiver as an <code>Enumeration</code>.
     */
    Enumeration children();
}
