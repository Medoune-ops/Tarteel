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
        //
        // Cible « tarteel:// » et NON « tarteel://lesson » : le dossier
        // app/(app)/lesson/ ne contient pas d'index (seulement play, qcm,
        // listen, voice…), donc ce lien ne correspondait a AUCUNE route. Une
        // lecon se lance depuis le parcours, avec son identifiant — on ouvre
        // donc l'accueil, comme les autres widgets.
        val intent = openAppIntent(context, "tarteel://")
        views.setOnClickPendingIntent(R.id.w_continue_root, intent)

        return views
    }
}
