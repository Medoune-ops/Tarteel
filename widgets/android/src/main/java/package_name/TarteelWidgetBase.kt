package com.tarteel.sn

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONObject
import java.util.Calendar

/**
 * Données partagées entre l'app et les widgets.
 *
 * L'app les écrit via `utils/widgetData.ts` -> module natif `ExpoWidgets`
 * (`setWidgetData`), qui les dépose dans les SharedPreferences
 * "<package>.widgetdata" sous la clé "widgetdata". On les relit ici.
 */
data class TarteelWidgetData(
    val streak: Int,
    val xp: Int,
    val currentLesson: Int,
    val lessonProgress: Int,
    val activeDays: List<Boolean>,
    val motivationMsg: String,
) {
    companion object {
        /** Valeurs de repli : un widget fraîchement posé, avant tout lancement de l'app. */
        private val EMPTY = TarteelWidgetData(0, 0, 1, 0, List(7) { false }, "")

        fun read(context: Context): TarteelWidgetData {
            return try {
                val prefs = context.getSharedPreferences(
                    "${context.packageName}.widgetdata",
                    Context.MODE_PRIVATE,
                )
                val raw = prefs.getString("widgetdata", null) ?: return EMPTY
                val json = JSONObject(raw)

                val daysArray = json.optJSONArray("activeDays")
                val days = (0 until 7).map { i ->
                    daysArray?.optBoolean(i, false) ?: false
                }

                TarteelWidgetData(
                    streak = json.optInt("streak", 0),
                    xp = json.optInt("xp", 0),
                    currentLesson = json.optInt("currentLesson", 1),
                    lessonProgress = json.optInt("lessonProgress", 0),
                    activeDays = days,
                    motivationMsg = json.optString("motivationMsg", ""),
                )
            } catch (_: Exception) {
                // JSON absent ou malformé : on affiche un widget vide plutôt
                // que de laisser planter le processus du lanceur.
                EMPTY
            }
        }
    }
}

/** Indice du jour courant, 0 = lundi … 6 = dimanche (comme côté iOS et JS). */
fun todayIndex(): Int {
    val wd = Calendar.getInstance().get(Calendar.DAY_OF_WEEK) // 1 = dimanche
    return if (wd == Calendar.SUNDAY) 6 else wd - 2
}

/**
 * Ouvre l'app sur un deep link (`tarteel://…`). Le schéma `tarteel` est déjà
 * déclaré dans app.json, donc pas de configuration supplémentaire.
 */
fun openAppIntent(context: Context, deepLink: String): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)).apply {
        `package` = context.packageName
    }
    return PendingIntent.getActivity(
        context,
        deepLink.hashCode(), // requestCode distinct par lien, sinon ils s'écrasent
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
}

/**
 * Socle commun aux trois widgets : relit les données et redessine, que la
 * mise à jour vienne du système ou d'un broadcast envoyé par l'app.
 */
abstract class TarteelWidgetBase : AppWidgetProvider() {

    /** Construit la vue d'un widget à partir des données courantes. */
    abstract fun buildViews(context: Context, data: TarteelWidgetData): RemoteViews

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        val data = TarteelWidgetData.read(context)
        for (id in appWidgetIds) {
            appWidgetManager.updateAppWidget(id, buildViews(context, data))
        }
    }
}
