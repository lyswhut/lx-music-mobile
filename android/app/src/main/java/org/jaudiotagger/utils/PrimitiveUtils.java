package org.jaudiotagger.utils;

public class PrimitiveUtils {

	public static int safeLongToInt(long l) {
	    if (l < Integer.MIN_VALUE || l > Integer.MAX_VALUE) throw new IllegalArgumentException(l + " cannot be cast to int without changing its value.");
	    return (int) l;
	}
}
