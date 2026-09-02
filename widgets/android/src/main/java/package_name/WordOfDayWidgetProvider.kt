package com.tarteel.sn

import android.content.Context
import android.widget.RemoteViews

/**
 * Widget Mot du jour (2×2) — équivalent Android de WordOfDayWidget.swift.
 * Affiche un nom d'Allah différent chaque jour calendaire, calculé par date
 * (voir AsmaData.kt) et non lu depuis les données partagées app -> widget :
 * ce widget n'a donc pas besoin que l'app ait déjà été lancée pour afficher
 * un contenu correct.
 */
class WordOfDayWidgetProvider : TarteelWidgetBase() {

    override fun buildViews(context: Context, data: TarteelWidgetData): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_wordofday)
        val name = nameOfTheDay()

        views.setTextViewText(R.id.w_word_arabic, name.arabe)
        views.setTextViewText(R.id.w_word_translit, name.translitteration)
        views.setTextViewText(R.id.w_word_translation, name.fr)

        val prefix = context.getString(R.string.w_wordofday_badge_prefix)
        val suffix = context.getString(R.string.w_wordofday_badge_suffix)
        views.setTextViewText(R.id.w_word_badge, "$prefix ${name.numero} $suffix")

        return views
    }
}
