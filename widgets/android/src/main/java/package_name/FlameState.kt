package com.tarteel.sn

import android.content.Context
import org.json.JSONObject
import java.util.Calendar
import java.util.concurrent.TimeUnit

/**
 * Série éteinte (maquette « Tarteel Widgets Retour »).
 *
 * Le widget Série (petit) et Ma semaine (moyen) basculent sur ces vues dès que
 * la flamme s'éteint :
 *  - petit : « Série éteinte » pendant 7 jours, puis « Tu nous manques » ;
 *  - moyen : « Recommencer » tant que la série n'est pas rallumée.
 *
 * La règle est celle de utils/flameTracking.ts, rejouée ici : le widget doit
 * voir la flamme s'éteindre même si l'app n'est pas rouverte.
 */
sealed class FlameState {
    object Burning : FlameState()
    /** Moins de 7 jours après la perte. */
    data class Ember(val lost: Int, val daysAway: Int) : FlameState()
    /** Au-delà : on parle d'absence plutôt que de série perdue. */
    data class Away(val lost: Int, val daysAway: Int) : FlameState()

    companion object {
        fun read(context: Context, streak: Int, now: Calendar = Calendar.getInstance()): FlameState {
            val flame = try {
                val raw = context
                    .getSharedPreferences("${context.packageName}.widgetdata", Context.MODE_PRIVATE)
                    .getString("widgetdata", null) ?: return Burning
                JSONObject(raw).optJSONObject("flame") ?: return Burning
            } catch (_: Exception) {
                return Burning
            }

            val today = startOfDay(now)
            val lastActive = parseDay(flame.optString("lastActiveDay", ""))
            val freezes = flame.optInt("freezes", 0)
            val lost: Int
            val lostDay: Calendar

            if (streak > 0) {
                val la = lastActive ?: return Burning
                // Hier lu (écart 1) : la flamme brûle encore. Chaque gel couvre
                // un jour manqué de plus.
                if (daysBetween(la, today) - 1 <= freezes) return Burning
                lost = streak
                lostDay = (la.clone() as Calendar).apply { add(Calendar.DAY_OF_MONTH, freezes + 2) }
            } else {
                val lostStreak = flame.optInt("lostStreak", 0)
                if (lostStreak <= 0) return Burning
                lost = lostStreak
                lostDay = parseDay(flame.optString("lostDay", "")) ?: today
            }

            val away = maxOf(1, lastActive?.let { daysBetween(it, today) } ?: (daysBetween(lostDay, today) + 1))
            return if (daysBetween(lostDay, today) < 7) Ember(lost, away) else Away(lost, away)
        }

        private fun startOfDay(c: Calendar): Calendar = (c.clone() as Calendar).apply {
            set(Calendar.HOUR_OF_DAY, 12) // midi : insensible aux changements d'heure
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        private fun parseDay(s: String): Calendar? {
            val p = s.split("-").mapNotNull { it.toIntOrNull() }
            if (p.size != 3) return null
            return Calendar.getInstance().apply {
                clear()
                set(p[0], p[1] - 1, p[2], 12, 0, 0)
            }
        }

        private fun daysBetween(a: Calendar, b: Calendar): Int {
            val ms = startOfDay(b).timeInMillis - startOfDay(a).timeInMillis
            return Math.round(ms / TimeUnit.DAYS.toMillis(1).toDouble()).toInt()
        }
    }
}

/** Message selon la durée d'absence (paliers de la maquette). */
fun awayMessageRes(days: Int): Int = when {
    days <= 1 -> R.string.w_away_t1
    days <= 3 -> R.string.w_away_t2
    days <= 7 -> R.string.w_away_t3
    else -> R.string.w_away_t4
}
