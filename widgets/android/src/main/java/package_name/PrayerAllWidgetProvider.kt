package com.tarteel.sn

import android.content.Context
import android.widget.RemoteViews

/** Toutes les prières (4×2) — équivalent Android de PrayerAllWidget (PrayerWidgets.swift). */
class PrayerAllWidgetProvider : PrayerWidgetBase() {

    private val colIds = listOf(
        Triple(R.id.w_pa_col0, R.id.w_pa_col0_label, R.id.w_pa_col0_time),
        Triple(R.id.w_pa_col1, R.id.w_pa_col1_label, R.id.w_pa_col1_time),
        Triple(R.id.w_pa_col2, R.id.w_pa_col2_label, R.id.w_pa_col2_time),
        Triple(R.id.w_pa_col3, R.id.w_pa_col3_label, R.id.w_pa_col3_time),
        Triple(R.id.w_pa_col4, R.id.w_pa_col4_label, R.id.w_pa_col4_time),
    )

    override fun buildViews(context: Context, state: PrayerState): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_prayer_all)
        views.setTextViewText(R.id.w_pa_name, prayerName(context, state.next.key))
        views.setTextViewText(R.id.w_pa_arabic, prayerArabic(state.next.key))
        views.setTextViewText(R.id.w_pa_time, state.next.time)
        bindCountdown(context, views, R.id.w_pa_countdown, state)
        views.setTextViewText(R.id.w_pa_city, prayerCity(context, state))

        val prev = state.previous
        views.setTextViewText(
            R.id.w_pa_prev,
            if (prev != null) "${prayerName(context, prev.key)} ${prev.time}" else "",
        )
        views.setTextViewText(R.id.w_pa_next, "${prayerName(context, state.next.key)} ${state.next.time}")
        views.setProgressBar(R.id.w_pa_progress, 100, state.segmentPercent, false)
        views.setTextViewText(R.id.w_pa_elapsed, context.getString(R.string.w_p_elapsed, state.segmentPercent))

        val ink = context.getColor(R.color.w_p_ink)
        val muted = context.getColor(R.color.w_p_muted)
        val white = context.getColor(R.color.w_white)
        state.mainToday.take(5).forEachIndexed { i, slot ->
            val (col, label, time) = colIds[i]
            val isNext = slot.atMillis == state.next.atMillis
            val past = slot.atMillis < state.now && !isNext
            views.setTextViewText(label, prayerShort(slot.key))
            views.setTextViewText(time, slot.time)
            views.setInt(col, "setBackgroundResource", if (isNext) R.drawable.w_p_pill_accent else 0)
            views.setTextColor(label, if (isNext) white else muted)
            views.setTextColor(time, if (isNext) white else ink)
            views.setFloat(col, "setAlpha", if (past) 0.45f else 1f)
        }

        views.setOnClickPendingIntent(R.id.w_pa_root, openAppIntent(context, PRAYER_DEEP_LINK))
        return views
    }
}

/** Libellé court des colonnes (FAJR, DHUHR, ASR, MAGH, ISHA). */
fun prayerShort(key: String): String = when (key) {
    "maghrib" -> "MAGH"
    "sunrise" -> "SHUR"
    else -> key.uppercase()
}
