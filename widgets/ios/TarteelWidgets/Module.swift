import ExpoModulesCore
import WidgetKit

/// Pont app -> widgets iOS.
///
/// ⚠️ Ce fichier REMPLACE le module d'exemple livré par expo-widget
/// (node_modules/expo-widget/ios/ExpoWidgetsModule.swift), qui écrit dans
/// l'App Group de la démo du développeur ("group.expo.modules.widgets.
/// example.expowidgets", clé "MyData"). Sans cette redéfinition, les données
/// de Tarteel n'arrivaient jamais jusqu'aux widgets : ils affichaient donc
/// toujours leurs valeurs par défaut (série 0, XP 0).
///
/// Le nom du module ("ExpoWidgets") et celui de la fonction doivent
/// correspondre EXACTEMENT à l'appel fait côté JS dans utils/widgetData.ts.
public class ExpoWidgetsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoWidgets")

    // `data` est le JSON de WidgetData (voir WidgetData.swift pour le format
    // attendu côté lecture). La clé et le suite name doivent rester alignés
    // avec APP_GROUP dans WidgetData.swift.
    Function("setWidgetData") { (data: String) -> Void in
      let suite = UserDefaults(suiteName: "group.com.tarteel.app.expowidgets")
      suite?.set(data, forKey: "tarteel_widget_data")

      // Rafraîchit immédiatement les widgets pendant que l'app est ouverte —
      // ces mises à jour ne sont pas décomptées du budget de rafraîchissement
      // que le système alloue au widget.
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
