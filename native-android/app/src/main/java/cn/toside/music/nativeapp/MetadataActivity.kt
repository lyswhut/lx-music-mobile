package cn.toside.music.nativeapp

import android.app.Activity
import android.app.RecoverableSecurityException
import android.content.Context
import android.content.Intent
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Native tag editor with system-controlled write permission for shared media. */
class MetadataActivity : Activity() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private lateinit var song: Song
    private lateinit var titleInput: EditText
    private lateinit var artistInput: EditText
    private lateinit var albumInput: EditText
    private lateinit var lyricInput: EditText
    private lateinit var status: TextView
    private lateinit var save: Button
    private var original: LocalMetadata? = null
    private var image: Uri? = null
    private var removeImage = false
    private var permissionAttempted = false
    private var fileName = ""
    private var lyricDraft: java.io.File? = null
    private lateinit var coverPreview: android.widget.ImageView
    private fun preview(bytes: ByteArray?) {
        if (bytes == null) { coverPreview.setImageDrawable(null); return }
        val bounds = android.graphics.BitmapFactory.Options().apply { inJustDecodeBounds = true }
        android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        var sample = 1
        while (bounds.outWidth / sample > 512 || bounds.outHeight / sample > 512) sample *= 2
        coverPreview.setImageBitmap(android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size, android.graphics.BitmapFactory.Options().apply { inSampleSize = sample }))
    }
    override fun attachBaseContext(base: Context) = super.attachBaseContext(UiPreferences.context(base))
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        song = Song(intent.getLongExtra("id", -1), Uri.parse(intent.getStringExtra("uri")), intent.getStringExtra("title").orEmpty(),
            intent.getStringExtra("artist").orEmpty(), intent.getLongExtra("duration", 0), "local", intent.getStringExtra("info"))
        if (song.id < 0) { finish(); return }
        val draftName = savedInstanceState?.getString("lyricDraft")?.takeIf { it.matches(Regex("metadata-draft-[a-f0-9-]{36}\\.txt")) }
            ?: "metadata-draft-${java.util.UUID.randomUUID()}.txt"
        lyricDraft = java.io.File(cacheDir, draftName)
        image = savedInstanceState?.getString("image")?.let(Uri::parse); removeImage = savedInstanceState?.getBoolean("removeImage") ?: false
        permissionAttempted = savedInstanceState?.getBoolean("permissionAttempted") ?: false
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(24, 12, 24, 12) }
        fun field(resource: Int, lines: Int = 1): EditText {
            content.addView(TextView(this).apply { text = getString(resource) })
            return EditText(this).apply { contentDescription = getString(resource); minLines = lines; maxLines = if (lines == 1) 1 else 16; setSingleLine(lines == 1); isSaveEnabled = lines == 1; filters = arrayOf(android.text.InputFilter.LengthFilter(if (lines == 1) 500 else 2 * 1024 * 1024)); content.addView(this) }
        }
        content.addView(TextView(this).apply { text = getString(R.string.metadata_edit); textSize = 22f })
        titleInput = field(R.string.metadata_title); artistInput = field(R.string.metadata_artist); albumInput = field(R.string.metadata_album); lyricInput = field(R.string.metadata_lyric, 5)
        for (reverse in listOf(false, true)) content.addView(Button(this).apply {
            text = getString(if (reverse) R.string.metadata_parse_artist else R.string.metadata_parse_title)
            setOnClickListener {
                val parts = fileName.substringBeforeLast('.').split('-', limit = 2).map(String::trim)
                if (reverse) { artistInput.setText(parts.first()); parts.getOrNull(1)?.let(titleInput::setText) }
                else { titleInput.setText(parts.first()); parts.getOrNull(1)?.let(artistInput::setText) }
            }
        })
        coverPreview = android.widget.ImageView(this).apply { adjustViewBounds = true; maxHeight = (160 * resources.displayMetrics.density).toInt() }; content.addView(coverPreview)
        content.addView(Button(this).apply { text = getString(R.string.metadata_image_pick); setOnClickListener {
            startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE), IMAGE)
        } })
        content.addView(Button(this).apply { text = getString(R.string.metadata_image_remove); setOnClickListener { image = null; removeImage = true; preview(null); status.text = getString(R.string.metadata_image_removed) } })
        for (action in listOf("lyric", "pic")) content.addView(Button(this).apply {
            text = getString(if (action == "lyric") R.string.metadata_match_lyric else R.string.metadata_match_cover)
            setOnClickListener {
                isEnabled = false
                scope.launch {
                    try {
                        val reference = song.copy(title = titleInput.text.toString(), artist = artistInput.text.toString(), sourceInfo = org.json.JSONObject().put("albumName", albumInput.text.toString()).toString())
                        if (action == "lyric") lyricInput.setText(MetadataMatching.lyric(this@MetadataActivity, reference))
                        else {
                            val bytes = MetadataMatching.cover(this@MetadataActivity, reference)
                            val file = java.io.File(cacheDir, "matched-cover-${java.util.UUID.randomUUID()}.image")
                            withContext(Dispatchers.IO) { file.writeBytes(bytes) }
                            image = Uri.fromFile(file); removeImage = false; preview(bytes)
                        }
                    } catch (e: CancellationException) { throw e }
                    catch (e: Exception) { status.text = getString(R.string.metadata_error, e.localizedMessage.orEmpty()) }
                    finally { isEnabled = true }
                }
            }
        })
        status = TextView(this).also(content::addView)
        save = Button(this).apply { text = getString(R.string.metadata_save); isEnabled = false; setOnClickListener { saveMetadata() } }; content.addView(save)
        content.addView(Button(this).apply { text = getString(android.R.string.cancel); setOnClickListener { finish() } })
        val root = ScrollView(this).apply { addView(content) }; setContentView(root); ScreenInsets.install(window, root)
        scope.launch {
            try {
                fileName = ExternalAudio.name(this@MetadataActivity, song.uri)
                val value = LocalTags.read(this@MetadataActivity, song); original = value
                titleInput.setText(savedInstanceState?.getString("title") ?: value.title)
                artistInput.setText(savedInstanceState?.getString("artist") ?: value.artist)
                albumInput.setText(savedInstanceState?.getString("album") ?: value.album)
                val draft = withContext(Dispatchers.IO) { lyricDraft?.takeIf { it.isFile }?.inputStream()?.use { it.readBounded(8 * 1024 * 1024).toString(Charsets.UTF_8) } }
                lyricInput.setText(draft ?: value.lyric)
                if (!removeImage && image == null && value.artwork != null) status.text = getString(R.string.metadata_image_present)
                if (!removeImage) preview(image?.let { uri -> withContext(Dispatchers.IO) { contentResolver.openInputStream(uri)!!.use { it.readBounded(8 * 1024 * 1024) } } } ?: value.artwork)
                save.isEnabled = true
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { status.text = getString(R.string.metadata_error, e.localizedMessage.orEmpty()) }
        }
    }
    private fun saveMetadata() {
        if (!save.isEnabled) return
        val initial = original ?: return
        if (Build.VERSION.SDK_INT <= 28 && PermissionPolicy.requiresLibraryAccess(this, song) && checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(android.Manifest.permission.WRITE_EXTERNAL_STORAGE), WRITE_STORAGE); return
        }
        if (titleInput.text.isNullOrBlank()) { titleInput.error = getString(R.string.metadata_title_required); return }
        save.isEnabled = false
        scope.launch {
            try {
                val picture = if (removeImage) null else image?.let { uri -> withContext(Dispatchers.IO) {
                    contentResolver.openInputStream(uri)!!.use { it.readBounded(8 * 1024 * 1024) }
                } } ?: initial.artwork
                val value = LocalMetadata(titleInput.text.toString().trim(), artistInput.text.toString().trim(), albumInput.text.toString().trim(), lyricInput.text.toString(), picture)
                val updated = withContext(kotlinx.coroutines.NonCancellable) {
                    val updated = LocalTags.write(this@MetadataActivity, song, value)
                    Lyrics(this@MetadataActivity).clearOnlineCache(updated)
                    val lists = Playlists(applicationContext)
                    try { lists.updateLocalMetadata(updated) } finally { lists.close() }
                    updated
                }
                if (updated.uri.scheme == "file") MediaScannerConnection.scanFile(this@MetadataActivity, arrayOf(updated.uri.path), null, null)
                setResult(RESULT_OK, intentFor(this@MetadataActivity, updated)); finish()
            } catch (e: CancellationException) { throw e }
            catch (e: SecurityException) {
                if (!permissionAttempted && song.uri.authority == "media" && Build.VERSION.SDK_INT >= 29) {
                    permissionAttempted = true
                    try {
                        val sender = if (Build.VERSION.SDK_INT >= 30) MediaStore.createWriteRequest(contentResolver, listOf(song.uri)).intentSender
                            else (e as? RecoverableSecurityException)?.userAction?.actionIntent?.intentSender ?: throw e
                        startIntentSenderForResult(sender, WRITE, null, 0, 0, 0)
                    } catch (failure: Exception) { status.text = getString(R.string.metadata_error, failure.localizedMessage.orEmpty()) }
                } else status.text = getString(R.string.metadata_error, e.localizedMessage.orEmpty())
            } catch (e: Exception) { status.text = getString(R.string.metadata_error, e.localizedMessage.orEmpty()) }
            finally { save.isEnabled = true }
        }
    }
    @Deprecated("Deprecated in Android")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == IMAGE && resultCode == RESULT_OK) data?.data?.let { uri ->
            runCatching { contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            image = uri; removeImage = false; status.text = getString(R.string.metadata_image_selected)
            scope.launch { runCatching { withContext(Dispatchers.IO) { contentResolver.openInputStream(uri)!!.use { it.readBounded(8 * 1024 * 1024) } } }.getOrNull()?.let(::preview) }
        }
        if (requestCode == WRITE && resultCode == RESULT_OK) saveMetadata()
    }
    override fun onSaveInstanceState(outState: Bundle) {
        outState.putString("title", titleInput.text.toString()); outState.putString("artist", artistInput.text.toString()); outState.putString("album", albumInput.text.toString())
        // Long lyrics belong on disk, rather than in the Binder Activity-state transaction.
        lyricDraft?.let { file ->
            val atomic = android.util.AtomicFile(file)
            runCatching {
                val output = atomic.startWrite()
                try { output.write(lyricInput.text.toString().toByteArray(Charsets.UTF_8)); atomic.finishWrite(output) }
                catch (e: Exception) { atomic.failWrite(output); throw e }
                outState.putString("lyricDraft", file.name)
            }.onFailure { DiagnosticLog(this).record("app", "Could not preserve metadata lyric draft") }
        }
        outState.putString("image", image?.toString()); outState.putBoolean("removeImage", removeImage); outState.putBoolean("permissionAttempted", permissionAttempted)
        super.onSaveInstanceState(outState)
    }
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == WRITE_STORAGE && grantResults.firstOrNull() == android.content.pm.PackageManager.PERMISSION_GRANTED) saveMetadata()
    }
    override fun onDestroy() {
        if (isFinishing) lyricDraft?.delete()
        if (isFinishing && image?.scheme == "file") image?.path?.let { path ->
            val file = java.io.File(path)
            if (file.name.startsWith("matched-cover-") && file.canonicalFile.parentFile == cacheDir.canonicalFile) file.delete()
        }
        scope.cancel(); super.onDestroy()
    }
    companion object {
        private const val IMAGE = 1; private const val WRITE = 2; private const val WRITE_STORAGE = 3
        internal fun intentFor(context: Context, song: Song) = Intent(context, MetadataActivity::class.java)
            .putExtra("id", song.id).putExtra("uri", song.uri.toString()).putExtra("title", song.title).putExtra("artist", song.artist).putExtra("duration", song.duration).putExtra("info", song.sourceInfo)
    }
}
