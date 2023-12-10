Fork From: https://github.com/hexise/jaudiotagger-android

Jaudiotagger for Android
======================
This is Jaudiotagger library for Android. Jaudiotagger is an Audio Tagging library.

This is a pure java library, you can compile the source to JAR file by yourself.

The compiled JAR library works on Android platform, has been tested on API level 14 and above.


<h2>Source</h2>

The source code is based on Jaudiotagger library version 2.2.6.

Jaudiotagger library version 2.2.6 is build on JDK 1.8 and uses lots of nio features, which are not compatible with Android version lower than API level 26.

This Jaudiotagger library changes all incompatible parts with compatible API calls, which can compile and run on Android API level 14 and above.

For more information about Jaudiotagger, please refer to this link: http://www.jthink.net/jaudiotagger/

<h2>Main changes comparing to official library</h2>

- org.jaudiotagger.tag.TagOptionSingleton:

   setAndroid() and isAndroid() methods are deleted, this library works and only works on Android.

- Image handling related classes have been removed. You can use your own image handling logic based on Android API.

   Removed classes:

   - org.jaudiotagger.tag.images.ImageHandler;
   - org.jaudiotagger.tag.images.StandardImageHandler;
   - org.jaudiotagger.tag.images.AndroidImageHandler;
   - org.jaudiotagger.tag.images.ImageHandlingFactory;
   - org.jaudiotagger.tag.images.Images;

- Artwork related classes have been modified.

   Removed classes:

   - org.jaudiotagger.tag.images.StandardArtwork;

   Modifed classes:

   - org.jaudiotagger.tag.images.ArtworkFactory: now only support AndroidArtwork.

- Java nio API calls are refactored:

   - The try-with-resources statements are replaced with RandomAccessFile, file channel and manually resource releasing.
   - Usages of java.nio.file.Path are replaced by java.io.File.
   - org.jaudiotagger.audio.generic.Permissions and its references are removed.
   - References to java.nio.charset.StandardCharsets are replaced with org.jaudiotagger.StandardCharsets.

- Java incompatible API change:

   - javax.imageio.* imports and calls are removed.
   - java.awt.* imports and calls are removed.
   - Character.isAlphabetic() call is changed since it is only available on Android 19.

- org.jaudiotagger.logging.LogFormatter:

   This class is removed since it is unnecessary for Android platform.

<h2>License</h2>

This library is licensed under LGPL([Lesser General Public License](http://www.gnu.org/copyleft/lesser.html)), same license as Jaudiotagger official library.
