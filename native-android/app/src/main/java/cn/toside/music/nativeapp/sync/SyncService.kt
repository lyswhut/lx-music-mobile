package cn.toside.music.nativeapp.sync

import cn.toside.music.nativeapp.R
import cn.toside.music.nativeapp.data.DislikeStore
import cn.toside.music.nativeapp.data.ExternalAudio
import cn.toside.music.nativeapp.data.LocalMusic
import cn.toside.music.nativeapp.data.Playlists
import cn.toside.music.nativeapp.ui.MainActivity
import cn.toside.music.nativeapp.ui.UiPreferences
import cn.toside.music.nativeapp.ui.syncMessage
import cn.toside.music.nativeapp.utils.DiagnosticLog
import cn.toside.music.nativeapp.utils.PermissionPolicy

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.IBinder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/** A started foreground service, independent of both the player and the bound Activity. */
class SyncService : Service() {
    inner class LocalBinder : Binder() { val service: SyncService get() = this@SyncService }
    private val binder = LocalBinder()
    private val lifetime = SupervisorJob()
    private val scope = CoroutineScope(lifetime + Dispatchers.Main.immediate)
    private lateinit var playlists: Playlists
    private lateinit var settings: BackgroundSyncSettings
    private lateinit var sync: BackgroundSync
    private var foreground = false
    internal val state get() = sync.state
    internal fun choose(id: Long, mode: String): Boolean = sync.choose(id, mode)

    override fun onCreate() {
        super.onCreate()
        playlists = Playlists(applicationContext)
        settings = BackgroundSyncSettings(applicationContext)
        val credentials = SyncCredentialStore(applicationContext)
        val device = "${Build.MANUFACTURER} ${Build.MODEL}".trim()
        sync = BackgroundSync(scope, playlists, DislikeStore(applicationContext), settings, {
            if (checkSelfPermission(PermissionPolicy.audio(Build.VERSION.SDK_INT)) == PackageManager.PERMISSION_GRANTED)
                LocalMusic(applicationContext).byLegacyPath() + ExternalAudio.existing(applicationContext) else ExternalAudio.existing(applicationContext)
        }, { address, code -> SyncAuth(address, device).authenticate(code, credentials.load(address)) }, credentials::save)
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(
            NotificationChannel(CHANNEL, "数据同步", NotificationManager.IMPORTANCE_LOW))
        scope.launch {
            var lastMessage: String? = null
            state.collect { value ->
                if (value.message != lastMessage) {
                    DiagnosticLog(applicationContext).record("sync", value.message, if (value.connected) "INFO" else "WARN")
                    lastMessage = value.message
                }
                if (foreground && value.active) updateNotification(value.message)
                else if (foreground && !value.active) {
                    stopForeground(STOP_FOREGROUND_REMOVE); foreground = false
                    if (value.message != "同步已断开") updateNotification(value.message)
                    stopSelf()
                }
            }
        }
    }
    override fun onBind(intent: Intent?): IBinder = binder
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_DISCONNECT || intent?.action == ACTION_EXIT) {
            sync.stop(disable = intent.action == ACTION_DISCONNECT)
            stopForeground(STOP_FOREGROUND_REMOVE); foreground = false; stopSelf()
            return START_NOT_STICKY
        }
        val connect = intent?.action == ACTION_CONNECT
        val address = if (connect) intent.getStringExtra(EXTRA_ADDRESS).orEmpty() else settings.address.takeIf { settings.enabled }.orEmpty()
        if (address.isBlank()) { stopSelf(); return START_NOT_STICKY }
        val notification = notification("正在连接同步服务…")
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            else startForeground(NOTIFICATION_ID, notification)
            foreground = true
        } catch (e: RuntimeException) {
            sync.stop("无法启动后台同步：${e.localizedMessage}", disable = false)
            stopSelf()
            return START_NOT_STICKY
        }
        val code = intent?.getStringExtra(EXTRA_CODE)
        intent?.removeExtra(EXTRA_CODE)
        sync.start(address, code)
        updateNotification(state.value.message)
        return START_STICKY
    }
    override fun onTimeout(startId: Int, fgsType: Int) {
        // Android 15+ limits dataSync FGS background runtime; stop promptly and retain intent/outboxes for resumption.
        sync.stop("已达到系统后台同步时限，返回应用后继续", disable = false)
        stopForeground(STOP_FOREGROUND_REMOVE); foreground = false; stopSelf()
    }
    private fun notification(message: String): Notification {
        val strings = UiPreferences.context(this, scaleFonts = false)
        val text = syncMessage(message)
        val open = PendingIntent.getActivity(this, 101, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val stop = PendingIntent.getService(this, 102, Intent(this, SyncService::class.java).setAction(ACTION_DISCONNECT),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        return Notification.Builder(this, CHANNEL).setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentTitle(strings.getString(R.string.sync_notification_title)).setContentText(text).setContentIntent(open)
            .setStyle(Notification.BigTextStyle().bigText(text)).setOnlyAlertOnce(true)
            .setOngoing(sync.state.value.active).setAutoCancel(!sync.state.value.active)
            .addAction(Notification.Action.Builder(null, strings.getString(R.string.sync_disconnect), stop).build()).build()
    }
    private fun updateNotification(message: String) {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(NOTIFICATION_ID, notification(message))
    }
    override fun onDestroy() {
        sync.close(); scope.cancel()
        // SQLite operations/authentication can still be completing on IO threads after cancellation.
        lifetime.invokeOnCompletion { playlists.close() }
        super.onDestroy()
    }
    companion object {
        private const val CHANNEL = "data-sync"
        private const val NOTIFICATION_ID = 101
        private const val ACTION_CONNECT = "cn.toside.music.nativeapp.SYNC_CONNECT"
        internal const val ACTION_DISCONNECT = "cn.toside.music.nativeapp.SYNC_DISCONNECT"
        internal const val ACTION_EXIT = "cn.toside.music.nativeapp.SYNC_EXIT"
        private const val EXTRA_ADDRESS = "address"
        private const val EXTRA_CODE = "code"
        internal fun connect(context: Context, address: String, code: String) {
            context.startForegroundService(Intent(context, SyncService::class.java).setAction(ACTION_CONNECT)
                .putExtra(EXTRA_ADDRESS, address).putExtra(EXTRA_CODE, code))
        }
        internal fun resumeIfEnabled(context: Context) {
            if (BackgroundSyncSettings(context).enabled) context.startForegroundService(Intent(context, SyncService::class.java))
        }
        internal fun disconnect(context: Context) {
            context.startService(Intent(context, SyncService::class.java).setAction(ACTION_DISCONNECT))
        }
    }
}
