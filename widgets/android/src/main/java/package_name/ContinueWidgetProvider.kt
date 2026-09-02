package com.tarteel.sn

import android.content.Context
import android.widget.RemoteViews

/**
 * Widget Rappel (2×2) — équivalent Android de ContinueSmallWidget.swift.
 * Heure de rappel quotidien + message d'incitation à garder sa série.
 */
class ContinueWidgetProvider : TarteelWidgetBase() {

    override fun buildViews(context: Context, data: TarteelWidgetData): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_continue)

        views.setTextViewText(R.id.w_reminder_time, String.format("%02d:00", data.reminderHour))

        // Le widget entier ouvre l'app.
        val intent = openAppIntent(context, "tarteel://lesson")
        views.setOnClickPendingIntent(R.id.w_continue_root, intent)

        return views
    }
}
