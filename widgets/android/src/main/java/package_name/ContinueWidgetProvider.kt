package com.tarteel.sn

import android.content.Context
import android.widget.RemoteViews

/**
 * Widget Reprendre (2×2) — équivalent Android de ContinueSmallWidget.swift.
 * Leçon en cours, progression, et un bouton qui ouvre directement la leçon.
 */
class ContinueWidgetProvider : TarteelWidgetBase() {

    override fun buildViews(context: Context, data: TarteelWidgetData): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_continue)

        val lessonLabel = context.getString(R.string.w_lesson_prefix)
        views.setTextViewText(R.id.w_lesson_badge, "$lessonLabel ${data.currentLesson}")
        views.setTextViewText(R.id.w_continue_streak, "🔥 ${data.streak}")
        views.setProgressBar(R.id.w_progress, 100, data.lessonProgress, false)
        views.setTextViewText(R.id.w_progress_text, "${data.lessonProgress}%")

        // Le bouton ET le fond ouvrent la leçon en cours.
        val intent = openAppIntent(context, "tarteel://lesson")
        views.setOnClickPendingIntent(R.id.w_continue_btn, intent)
        views.setOnClickPendingIntent(R.id.w_continue_root, intent)

        return views
    }
}
