package org.jaudiotagger.tag.options;

/**
 * Number of padding zeroes digits 1- 9, numbers larger than nine will be padded accordingly based on the value.
 *
 * i.e
 * If set to PAD_ONE_ZERO,   9 -> 09 , 99 -> 99 , 999 ->999
 * If set to PAD_TWO_ZERO,   9 -> 009 , 99 -> 099 , 999 ->999
 * If set to PAD_THREE_ZERO, 9 -> 0009 , 99 -> 0099 , 999 ->0999
 *
 */
public enum PadNumberOption
{
    PAD_ONE_ZERO,
    PAD_TWO_ZERO,
    PAD_THREE_ZERO,

}
