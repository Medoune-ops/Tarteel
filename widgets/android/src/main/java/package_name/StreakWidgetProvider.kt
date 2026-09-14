package com.tarteel.sn

import android.content.Context
import android.graphics.Color
import android.widget.RemoteViews

/**
 * Widget Série (2×2) — calqué sur l'aperçu de l'app (app/(app)/widgets.tsx,
 * composant StreakPreview), qui fait foi pour le rendu Android.
 * Le nombre de jours en grand, les XP, plus les 7 pastilles de la semaine.
 */
class StreakWidgetProvider : TarteelWidgetBase() {

    override fun buildViews(context: Context, data: TarteelWidgetData): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_streak)

        views.setTextViewText(R.id.w_streak_value, data.streak.toString())
        // L'éclair fait partie du libellé : une RemoteViews ne peut pas poser
        // d'icône composée sur un TextView.
        views.setTextViewText(R.id.w_streak_xp, "⚡ ${data.xp} XP")

        // Un widget Android ne sait pas boucler sur des vues : chaque pastille
        // et chaque lettre est adressée par son id.
        val dotIds = intArrayOf(
            R.id.w_d0, R.id.w_d1, R.id.w_d2, R.id.w_d3,
            R.id.w_d4, R.id.w_d5, R.id.w_d6,
        )
        val labelIds = intArrayOf(
            R.id.w_l0, R.id.w_l1, R.id.w_l2, R.id.w_l3,
            R.id.w_l4, R.id.w_l5, R.id.w_l6,
        )
        val today = todayIndex()

        for (i in 0 until 7) {
            val drawable = when {
                i == today -> R.drawable.w_dot_today
                data.activeDays.getOrElse(i) { false } -> R.drawable.w_dot_active
                else -> R.drawable.w_dot_idle
            }
            views.setImageViewResource(dotIds[i], drawable)

            // La lettre du jour courant ressort en blanc plein, les autres
            // restent en blanc atténué (streakDayLabelToday dans l'aperçu) —
            // une couleur par jour ne peut se poser qu'ici, pas dans le layout.
            views.setTextColor(
                labelIds[i],
                if (i == today) Color.WHITE else Color.parseColor("#99FFFFFF"),
            )
        }

        // Toucher le widget ouvre l'app. Le clic est posé sur la RACINE : il
        // était attaché au seul nombre, donc taper ailleurs sur la carte (les
        // pastilles, les XP, la mascotte) ne déclenchait rien.
        views.setOnClickPendingIntent(
            R.id.w_streak_root,
            openAppIntent(context, "tarteel://"),
        )

        return views
    }
}
