package com.tarteel.sn

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import android.widget.RemoteViews
import org.json.JSONObject
import java.util.Calendar
import java.util.Locale
import kotlin.math.ceil
import kotlin.math.roundToInt

/**
 * Horaires de prière pour les widgets « Heures de prière ».
 *
 * L'app ne laisse PAS le widget calculer : la librairie `adhan` est en JS.
 * Elle écrit 7 jours de créneaux dans le même JSON que les autres widgets
 * (champ `prayer`, voir utils/widgetData.ts) ; on choisit ici, selon l'heure,
 * la prière en cours et la suivante.
 */
data class PrayerSlot(val key: String, val atMillis: Long) {
    /** Le chourouq est affiché mais n'est jamais « la prochaine prière ». */
    val isMain: Boolean get() = key != "sunrise"
    val time: String get() = formatHm(atMillis)
}

data class PrayerState(
    val now: Long,
    val city: String?,
    val qibla: Int,
    /** Les 6 créneaux du jour (5 prières + chourouq), dans l'ordre. */
    val today: List<PrayerSlot>,
    val next: PrayerSlot,
    val after: PrayerSlot?,
    val previous: PrayerSlot?,
) {
    val mainToday: List<PrayerSlot> get() = today.filter { it.isMain }

    /** Avancée entre le créneau précédent et la prochaine prière, 0…100. */
    val segmentPercent: Int
        get() {
            val start = previous?.atMillis ?: (next.atMillis - 6 * 3_600_000L)
            val span = next.atMillis - start
            if (span <= 0) return 0
            return (((now - start).toDouble() / span) * 100).roundToInt().coerceIn(0, 100)
        }

    /** Avancée de la journée, du Fajr à l'Isha, 0…100. */
    val dayPercent: Int
        get() {
            val first = mainToday.firstOrNull()?.atMillis ?: return 0
            val last = mainToday.lastOrNull()?.atMillis ?: return 0
            val span = last - first
            if (span <= 0) return 0
            return (((now - first).toDouble() / span) * 100).roundToInt().coerceIn(0, 100)
        }

    companion object {
        fun read(context: Context, now: Long = System.currentTimeMillis()): PrayerState? {
            return try {
                val prefs = context.getSharedPreferences("${context.packageName}.widgetdata", Context.MODE_PRIVATE)
                val raw = prefs.getString("widgetdata", null) ?: return null
                val prayer = JSONObject(raw).optJSONObject("prayer") ?: return null
                val arr = prayer.optJSONArray("slots") ?: return null
                val slots = (0 until arr.length()).mapNotNull { i ->
                    val o = arr.optJSONObject(i) ?: return@mapNotNull null
                    PrayerSlot(o.optString("k"), (o.optDouble("t", 0.0) * 1000).toLong())
                }.sortedBy { it.atMillis }

                val today = slots.filter { sameDay(it.atMillis, now) }
                val mains = slots.filter { it.isMain }
                val nextIdx = mains.indexOfFirst { it.atMillis > now }
                // Plus aucune prière à venir : l'app n'a pas été ouverte depuis
                // une semaine. État vide plutôt qu'un horaire faux.
                if (today.isEmpty() || nextIdx < 0) return null

                val city = if (prayer.isNull("city")) null else prayer.optString("city").ifBlank { null }
                PrayerState(
                    now = now,
                    city = city,
                    qibla = prayer.optDouble("qibla", 0.0).roundToInt(),
                    today = today,
                    next = mains[nextIdx],
                    after = mains.getOrNull(nextIdx + 1),
                    previous = slots.lastOrNull { it.atMillis <= now },
                )
            } catch (_: Exception) {
                null
            }
        }
    }
}

private fun sameDay(a: Long, b: Long): Boolean {
    val ca = Calendar.getInstance().apply { timeInMillis = a }
    val cb = Calendar.getInstance().apply { timeInMillis = b }
    return ca.get(Calendar.YEAR) == cb.get(Calendar.YEAR) &&
        ca.get(Calendar.DAY_OF_YEAR) == cb.get(Calendar.DAY_OF_YEAR)
}

fun formatHm(millis: Long): String {
    val c = Calendar.getInstance().apply { timeInMillis = millis }
    return String.format(Locale.ROOT, "%02d:%02d", c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE))
}

/** Nom localisé d'un créneau (strings.xml, FR par défaut, EN dans values-en). */
fun prayerName(context: Context, key: String): String = context.getString(
    when (key) {
        "fajr" -> R.string.w_p_fajr
        "sunrise" -> R.string.w_p_sunrise
        "dhuhr" -> R.string.w_p_dhuhr
        "asr" -> R.string.w_p_asr
        "maghrib" -> R.string.w_p_maghrib
        else -> R.string.w_p_isha
    },
)

private val PRAYER_AR = mapOf(
    "fajr" to "الفجر", "sunrise" to "الشروق", "dhuhr" to "الظهر",
    "asr" to "العصر", "maghrib" to "المغرب", "isha" to "العشاء",
)

fun prayerArabic(key: String): String = PRAYER_AR[key] ?: ""

/** Ville choisie, ou « Ma position » pour une position GPS brute. */
fun prayerCity(context: Context, s: PrayerState): String =
    s.city ?: context.getString(R.string.w_p_my_location)

/** Point cardinal de la Qibla, lettres localisées (« E », « SO »…). */
fun qiblaCardinal(context: Context, deg: Int): String {
    val arr = context.resources.getStringArray(R.array.w_p_cardinals)
    return arr[(((deg % 360) + 360 + 22) / 45) % 8]
}

/**
 * Compte à rebours vers la prochaine prière, en direct : un Chronometer en
 * mode décompte (Android 7+) avance seul, sans que le widget ait à être
 * redessiné chaque minute. Le texte affiché est « dans 2:11:00 ».
 */
fun bindCountdown(context: Context, views: RemoteViews, viewId: Int, s: PrayerState) {
    val remaining = (s.next.atMillis - System.currentTimeMillis()).coerceAtLeast(0)
    views.setChronometer(viewId, SystemClock.elapsedRealtime() + remaining, context.getString(R.string.w_p_in_format), true)
    views.setChronometerCountDown(viewId, true)
}

/** Minutes restantes arrondies — pour les textes figés. */
fun minutesUntil(s: PrayerState): Int = ceil((s.next.atMillis - s.now) / 60_000.0).toInt().coerceAtLeast(0)

/**
 * Socle des widgets prière : redessine à chaque mise à jour, et programme un
 * réveil à la prochaine prière pour basculer sur la suivante.
 *
 * `AlarmManager.set` (non exact) : pas de permission SCHEDULE_EXACT_ALARM à
 * demander. Android peut décaler le réveil de quelques minutes en veille
 * profonde ; le compte à rebours, lui, reste juste (Chronometer).
 */
abstract class PrayerWidgetBase : AppWidgetProvider() {

    abstract fun buildViews(context: Context, state: PrayerState): RemoteViews

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val state = PrayerState.read(context)
        for (id in appWidgetIds) {
            val views = if (state != null) buildViews(context, state) else emptyViews(context)
            appWidgetManager.updateAppWidget(id, views)
        }
        scheduleNextUpdate(context, state)
    }

    override fun onDisabled(context: Context) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        am.cancel(updateIntent(context))
    }

    private fun emptyViews(context: Context): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_prayer_empty)
        views.setOnClickPendingIntent(R.id.w_prayer_empty_root, openAppIntent(context, PRAYER_DEEP_LINK))
        return views
    }

    private fun updateIntent(context: Context): PendingIntent {
        val ids = AppWidgetManager.getInstance(context).getAppWidgetIds(ComponentName(context, javaClass))
        val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
            .setComponent(ComponentName(context, javaClass))
            .putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        return PendingIntent.getBroadcast(
            context,
            javaClass.name.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun scheduleNextUpdate(context: Context, state: PrayerState?) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        // Prochain changement d'affichage : la prochaine prière, ou au plus
        // tard minuit passé (la liste du jour change), ou dans 6 h sans données.
        val now = System.currentTimeMillis()
        val midnight = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 1)
            set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        val at = when {
            state == null -> now + 6 * 3_600_000L
            else -> minOf(state.next.atMillis + 1_000, midnight)
        }
        try {
            am.set(AlarmManager.RTC, at, updateIntent(context))
        } catch (_: Exception) {
            // Jamais bloquant : le widget se mettra à jour à la prochaine ouverture de l'app.
        }
    }
}

const val PRAYER_DEEP_LINK = "tarteel://prieres"
