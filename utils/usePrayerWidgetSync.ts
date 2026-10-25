import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePrayerStore } from '../store/prayerStore';
import { useUserStore } from '../store/userStore';
import { syncWidgetData } from './widgetData';

// Les widgets embarquent 7 jours d'horaires : un rafraîchissement par heure au
// retour au premier plan suffit largement à garder la fenêtre pleine.
const FOREGROUND_MIN_INTERVAL_MS = 60 * 60 * 1000;

function sync() {
  const u = useUserStore.getState();
  syncWidgetData({
    streak: u.streak,
    xp: u.xp,
    currentLesson: u.currentLesson,
    reminderHour: u.reminderHour,
  });
}

/**
 * Pousse les horaires de prière vers les widgets « Heures de prière » : au
 * lancement, à chaque changement de position, et au retour au premier plan.
 * Les autres synchros (série, XP…) partent déjà de userStore et portent elles
 * aussi les horaires (voir syncWidgetData). À monter une seule fois, dans le
 * layout racine.
 */
export function usePrayerWidgetSync() {
  const lastSyncAt = useRef(0);

  useEffect(() => {
    const run = () => {
      // Avant réhydratation, la série vaut 0 : écrire là remettrait les
      // widgets Série à zéro le temps d'un instant.
      if (!usePrayerStore.persist.hasHydrated() || !useUserStore.persist.hasHydrated()) return;
      lastSyncAt.current = Date.now();
      sync();
    };
    run();

    const unsubPrayer = usePrayerStore.subscribe((s, prev) => {
      if (s.latitude !== prev.latitude || s.longitude !== prev.longitude || s.cityName !== prev.cityName) run();
    });
    const unsubHydrate = usePrayerStore.persist.onFinishHydration(run);
    const unsubUserHydrate = useUserStore.persist.onFinishHydration(run);
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active' && Date.now() - lastSyncAt.current > FOREGROUND_MIN_INTERVAL_MS) run();
    });

    return () => {
      unsubPrayer();
      unsubHydrate();
      unsubUserHydrate();
      appState.remove();
    };
  }, []);
}
