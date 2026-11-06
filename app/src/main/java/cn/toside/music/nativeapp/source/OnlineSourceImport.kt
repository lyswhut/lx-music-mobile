package cn.toside.music.nativeapp.source

import android.content.Context
import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.utils.readBounded
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit

/** UserSource.import validates the LX protocol before saving or selecting a downloaded script. */
internal class OnlineSourceImport(private val context: Context) {
    suspend fun download(value: String): String {
        val url = value.trim().toHttpUrlOrNull()
        require(url != null) { context.getString(R.string.settings_source_invalid_url) }
        val call = client.newCall(Request.Builder().url(url).build())
        return suspendCancellableCoroutine { continuation ->
            continuation.invokeOnCancellation { call.cancel() }
            call.enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) { continuation.resumeWith(Result.failure(e)) }
                override fun onResponse(call: Call, response: Response) {
                    continuation.resumeWith(runCatching {
                        response.use {
                            check(it.isSuccessful) { context.getString(R.string.settings_source_http_error, it.code) }
                            val body = checkNotNull(it.body)
                            require(body.contentLength() <= MAX_BYTES) { context.getString(R.string.settings_source_too_large) }
                            val bytes = try { body.byteStream().use { stream -> stream.readBounded(MAX_BYTES) } }
                            catch (_: IllegalArgumentException) { error(context.getString(R.string.settings_source_too_large)) }
                            val script = bytes.toString(Charsets.UTF_8).removePrefix("\uFEFF")
                            require(script.isNotBlank()) { context.getString(R.string.settings_source_empty_response) }
                            val start = script.trimStart()
                            require(!start.startsWith("<!doctype html", true) && !start.startsWith("<html", true)) {
                                context.getString(R.string.settings_source_html_response)
                            }
                            script
                        }
                    })
                }
            })
        }
    }

    companion object {
        private const val MAX_BYTES = 2 * 1024 * 1024
        private val client = OkHttpClient.Builder().connectTimeout(13, TimeUnit.SECONDS)
            .readTimeout(13, TimeUnit.SECONDS).callTimeout(30, TimeUnit.SECONDS).build()
    }
}
