import WidgetKit
import SwiftUI

struct TarteelEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

struct TarteelProvider: TimelineProvider {
    func placeholder(in context: Context) -> TarteelEntry {
        TarteelEntry(date: Date(), data: loadWidgetData())
    }

    func getSnapshot(in context: Context, completion: @escaping (TarteelEntry) -> Void) {
        completion(TarteelEntry(date: Date(), data: loadWidgetData()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TarteelEntry>) -> Void) {
        let entry = TarteelEntry(date: Date(), data: loadWidgetData())
        // Rafraîchit toutes les 15 minutes
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}
