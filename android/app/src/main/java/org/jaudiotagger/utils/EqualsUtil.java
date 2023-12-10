package org.jaudiotagger.utils;


/**
 * Collected methods which allow easy implementation of <code>equals</code>.
 *
 * Example use case in a class called Car:
 * <pre>
 * public boolean equals(Object aThat){
 * if ( this == aThat ) return true;
 * if ( !(aThat instanceof Car) ) return false;
 * Car that = (Car)aThat;
 * return
 * EqualsUtil.areEqual(this.fName, that.fName) &&
 * EqualsUtil.areEqual(this.fNumDoors, that.fNumDoors) &&
 * EqualsUtil.areEqual(this.fGasMileage, that.fGasMileage) &&
 * EqualsUtil.areEqual(this.fColor, that.fColor) &&
 * Arrays.equals(this.fMaintenanceChecks, that.fMaintenanceChecks); //array!
 * }
 * </pre>
 *
 * <em>Arrays are not handled by this class</em>.
 * This is because the <code>Arrays.equals</code> methods should be used for
 * array fields.
 */
public final class EqualsUtil
{

    static public boolean areEqual(boolean aThis, boolean aThat)
    {
        //System.out.println("boolean");
        return aThis == aThat;
    }

    static public boolean areEqual(char aThis, char aThat)
    {
        //System.out.println("char");
        return aThis == aThat;
    }

    static public boolean areEqual(long aThis, long aThat)
    {
        /*
        * Implementation Note
        * Note that byte, short, and int are handled by this method, through
        * implicit conversion.
        */
        //System.out.println("long");
        return aThis == aThat;
    }

    static public boolean areEqual(float aThis, float aThat)
    {
        //System.out.println("float");
        return Float.floatToIntBits(aThis) == Float.floatToIntBits(aThat);
    }

    static public boolean areEqual(double aThis, double aThat)
    {
        //System.out.println("double");
        return Double.doubleToLongBits(aThis) == Double.doubleToLongBits(aThat);
    }

    /**
     * Possibly-null object field.
     *
     * Includes type-safe enumerations and collections, but does not include
     * arrays. See class comment.
     */
    static public boolean areEqual(Object aThis, Object aThat)
    {
        //System.out.println("Object");
        return aThis == null ? aThat == null : aThis.equals(aThat);
    }
}


