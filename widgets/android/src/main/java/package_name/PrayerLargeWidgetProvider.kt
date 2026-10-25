package com.tarteel.sn

import android.content.Context
import android.widget.RemoteViews

/** Journée + Qibla (4×4) — équivalent Android de PrayerLargeWidget (PrayerWidgets.swift). */
class PrayerLargeWidgetProvider : PrayerWidgetBase() {

    /** (ligne, nom, arabe, heure) — une ligne fixe par créneau, dans l'ordre du jour. */
    private val rowIds = listOf(
        intArrayOf(R.id.w_pl_row0, R.id.w_pl_row0_name, R.id.w_pl_row0_ar, R.id.w_pl_row0_time),
        intArrayOf(R.id.w_pl_row1, R.id.w_pl_row1_name, R.id.w_pl_row1_ar, R.id.w_pl_row1_time),
        intArrayOf(R.id.w_pl_row2, R.id.w_pl_row2_name, R.id.w_pl_row2_ar, R.id.w_pl_row2_time),
        intArrayOf(R.id.w_pl_row3, R.id.w_pl_row3_name, R.id.w_pl_row3_ar, R.id.w_pl_row3_time),
        intArrayOf(R.id.w_pl_row4, R.id.w_pl_row4_name, R.id.w_pl_row4_ar, R.id.w_pl_row4_time),
        intArrayOf(R.id.w_pl_row5, R.id.w_pl_row5_name, R.id.w_pl_row5_ar, R.id.w_pl_row5_time),
    )

    override fun buildViews(context: Context, state: PrayerState): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_prayer_large)
        views.setTextViewText(
            R.id.w_pl_header,
            context.getString(R.string.w_p_next_city_caps, prayerCity(context, state).uppercase()),
        )
        views.setTextViewText(R.id.w_pl_name, prayerName(context, state.next.key))
        views.setTextViewText(R.id.w_pl_arabic, prayerArabic(state.next.key))
        views.setTextViewText(R.id.w_pl_time, state.next.time)
        views.setTextViewText(R.id.w_pl_qibla, "${state.qibla}° ${qiblaCardinal(context, state.qibla)}")
        views.setProgressBar(R.id.w_pl_progress, 100, state.dayPercent, false)
        bindCountdown(context, views, R.id.w_pl_countdown, state)

        val ink = context.getColor(R.color.w_p_ink)
        val accent = context.getColor(R.color.w_p_accent)
        // Les pastilles de couleur sont fixes dans le layout (Fajr, Chourouq,
        // Dhuhr…) : on ne remplit que si le jour a bien ses 6 créneaux.
        state.today.take(6).forEachIndexed { i, slot ->
            val ids = rowIds[i]
            val isNext = slot.atMillis == state.next.atMillis
            val past = slot.atMillis < state.now && !isNext
            views.setTextViewText(ids[1], prayerName(context, slot.key))
            views.setTextViewText(ids[2], prayerArabic(slot.key))
            views.setTextViewText(ids[3], slot.time)
            views.setInt(ids[0], "setBackgroundResource", if (isNext) R.drawable.w_p_row_next else 0)
            views.setTextColor(ids[1], if (isNext) accent else ink)
            views.setTextColor(ids[3], if (isNext) accent else ink)
            views.setFloat(ids[0], "setAlpha", if (past) 0.45f else 1f)
        }

        views.setOnClickPendingIntent(R.id.w_pl_root, openAppIntent(context, PRAYER_DEEP_LINK))
        return views
    }
}
