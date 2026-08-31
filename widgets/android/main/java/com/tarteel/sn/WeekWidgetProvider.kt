package com.tarteel.sn

import android.content.Context
import android.graphics.Color
import android.widget.RemoteViews

/**
 * Widget Ma semaine (4×2) — équivalent Android de WeekMediumWidget.swift.
 * La série à gauche, les 7 jours et le message de motivation à droite.
 */
class WeekWidgetProvider : TarteelWidgetBase() {

    override fun buildViews(context: Context, data: TarteelWidgetData): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_week)

        views.setTextViewText(R.id.w_week_streak, data.streak.toString())
        views.setTextViewText(R.id.w_week_xp, "${data.xp} XP")
        views.setTextViewText(R.id.w_motivation, data.motivationMsg)

        val dotIds = intArrayOf(
            R.id.w_wd0, R.id.w_wd1, R.id.w_wd2, R.id.w_wd3,
            R.id.w_wd4, R.id.w_wd5, R.id.w_wd6,
        )
        val labelIds = intArrayOf(
            R.id.w_wl0, R.id.w_wl1, R.id.w_wl2, R.id.w_wl3,
            R.id.w_wl4, R.id.w_wl5, R.id.w_wl6,
        )
        val today = todayIndex()

        for (i in 0 until 7) {
            val drawable = when {
                i == today -> R.drawable.w_dot_week_today
                data.activeDays.getOrElse(i) { false } -> R.drawable.w_dot_week_active
                else -> R.drawable.w_dot_week_idle
            }
            views.setImageViewResource(dotIds[i], drawable)

            // Aujourd'hui en violet, les jours passés en gris moyen, ceux à
            // venir en gris clair — comme la version iOS.
            val labelColor = when {
                i == today -> Color.parseColor("#6B4DFF")
                i < today -> Color.parseColor("#9AA0AA")
                else -> Color.parseColor("#C2C6CE")
            }
            views.setTextColor(labelIds[i], labelColor)
        }

        views.setOnClickPendingIntent(
            R.id.w_week_root,
            openAppIntent(context, "tarteel://"),
        )

        return views
    }
}
