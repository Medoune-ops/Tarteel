package com.tarteel.sn

import android.content.Context
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews

/**
 * Widget Ma semaine (4×2) — calqué sur l'aperçu de l'app
 * (app/(app)/widgets.tsx, composant WeekPreview), qui fait foi pour le rendu.
 *
 * Deux contraintes propres aux RemoteViews, qui expliquent la forme du code :
 *
 *  - la ligne reliant les 7 jours ne peut pas être une barre unique dont on
 *    fait varier la largeur (setViewLayoutWidth n'existe qu'à partir de
 *    l'API 31, et minSdk vaut 24 ici) : elle est donc découpée en 6 segments
 *    fixes, colorés un par un ;
 *  - le fond d'une vue se change via setInt(..., "setBackgroundResource", ...),
 *    seule forme autorisée sur toutes les versions ; setViewBackgroundResource
 *    n'est pas disponible partout.
 */
class WeekWidgetProvider : TarteelWidgetBase() {

    /** Change la forme de fond d'une vue (pastille ou segment de ligne). */
    private fun RemoteViews.setBackground(viewId: Int, drawableRes: Int) {
        setInt(viewId, "setBackgroundResource", drawableRes)
    }

    override fun buildViews(context: Context, data: TarteelWidgetData): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.w_week)

        views.setTextViewText(R.id.w_week_streak, data.streak.toString())
        // L'éclair fait partie du libellé : une RemoteViews ne peut pas poser
        // d'icône composée sur un TextView.
        views.setTextViewText(R.id.w_week_xp, "⚡ ${data.xp} XP")
        views.setTextViewText(R.id.w_motivation, data.motivationMsg)

        val dotIds = intArrayOf(
            R.id.w_wd0, R.id.w_wd1, R.id.w_wd2, R.id.w_wd3,
            R.id.w_wd4, R.id.w_wd5, R.id.w_wd6,
        )
        val labelIds = intArrayOf(
            R.id.w_wl0, R.id.w_wl1, R.id.w_wl2, R.id.w_wl3,
            R.id.w_wl4, R.id.w_wl5, R.id.w_wl6,
        )
        // 6 segments pour 7 jours : le segment i reste entre le jour i et i+1.
        val lineIds = intArrayOf(
            R.id.w_wline0, R.id.w_wline1, R.id.w_wline2,
            R.id.w_wline3, R.id.w_wline4, R.id.w_wline5,
        )
        val today = todayIndex()

        for (i in 0 until 7) {
            val done = data.activeDays.getOrElse(i) { false }

            // Pastille : forme de fond + emoji au centre, comme dans l'aperçu
            // (▶ sur aujourd'hui, 🔥 sur un jour déjà validé, vide sinon).
            val shape = when {
                i == today -> R.drawable.w_dot_week_today
                done -> R.drawable.w_dot_week_active
                else -> R.drawable.w_dot_week_idle
            }
            views.setBackground(dotIds[i], shape)
            views.setTextViewText(
                dotIds[i],
                when {
                    i == today -> "▶"
                    done -> "🔥"
                    else -> ""
                },
            )
            // Le ▶ d'aujourd'hui est violet sur fond blanc ; la flamme garde sa
            // couleur propre, la valeur posée ici ne la change pas.
            views.setTextColor(
                dotIds[i],
                if (i == today) Color.parseColor("#6B4DFF") else Color.WHITE,
            )

            // Aujourd'hui en violet, les jours passés en gris moyen, ceux à
            // venir en gris clair — comme l'aperçu.
            val labelColor = when {
                i == today -> Color.parseColor("#6B4DFF")
                i < today -> Color.parseColor("#9AA0AA")
                else -> Color.parseColor("#C2C6CE")
            }
            views.setTextColor(labelIds[i], labelColor)
        }

        // Ligne de progression : orange jusqu'à aujourd'hui, gris au-delà.
        for (i in lineIds.indices) {
            views.setBackground(
                lineIds[i],
                if (i < today) R.drawable.w_week_line_done else R.drawable.w_week_line_todo,
            )
        }

        views.setOnClickPendingIntent(
            R.id.w_week_root,
            openAppIntent(context, "tarteel://"),
        )

        return views
    }
}
