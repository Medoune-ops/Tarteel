package com.tarteel.sn

import android.content.Context
import android.widget.RemoteViews

/**
 * Widget Série (2×2) — équivalent Android de StreakSmallWidget.swift.
 * Le nombre de jours en grand, plus les 7 pastilles de la semaine.
 */
class StreakWidgetProvider : TarteelWidgetBase() {

    override fun buildViews(context: Context, data: TarteelWidgetData): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_streak)

        views.setTextViewText(R.id.w_streak_value, data.streak.toString())

        // Un widget Android ne sait pas boucler sur des vues : chaque pastille
        // est adressée par son id.
        val dotIds = intArrayOf(
            R.id.w_d0, R.id.w_d1, R.id.w_d2, R.id.w_d3,
            R.id.w_d4, R.id.w_d5, R.id.w_d6,
        )
        val today = todayIndex()

        for (i in 0 until 7) {
            val drawable = when {
                i == today -> R.drawable.w_dot_today
                data.activeDays.getOrElse(i) { false } -> R.drawable.w_dot_active
                else -> R.drawable.w_dot_idle
            }
            views.setImageViewResource(dotIds[i], drawable)
        }

        // Toucher le widget ouvre l'app.
        views.setOnClickPendingIntent(
            R.id.w_streak_value,
            openAppIntent(context, "tarteel://"),
        )

        return views
    }
}
