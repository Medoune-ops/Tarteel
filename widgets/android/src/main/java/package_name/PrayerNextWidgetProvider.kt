package com.tarteel.sn

import android.content.Context
import android.widget.RemoteViews

/** Prochaine prière (2×2) — équivalent Android de PrayerNextWidget (PrayerWidgets.swift). */
class PrayerNextWidgetProvider : PrayerWidgetBase() {

    override fun buildViews(context: Context, state: PrayerState): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_prayer_next)
        views.setTextViewText(R.id.w_pn_arabic, prayerArabic(state.next.key))
        views.setTextViewText(R.id.w_pn_name, prayerName(context, state.next.key))
        views.setTextViewText(R.id.w_pn_time, state.next.time)
        views.setTextViewText(R.id.w_pn_city, prayerCity(context, state))
        bindCountdown(context, views, R.id.w_pn_countdown, state)
        views.setOnClickPendingIntent(R.id.w_pn_root, openAppIntent(context, PRAYER_DEEP_LINK))
        return views
    }
}
