import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePrayerStore } from '../store/prayerStore';
import { useUserStore } from '../store/userStore';
import { syncPrayerReminders, type ReminderConfig } from '../lib/prayerReminders';

// Au retour au premier plan, on ne reprogramme pas plus souvent : la fenêtre
// de 7 jours n'a besoin d'être complétée qu'occasionnellement.
const FOREGROUND_MIN_INTERVAL_MS = 60 * 60 * 1000;

function currentConfig(): ReminderConfig {
  const s = usePrayerStore.getState();
  return {
    enabled: s.remindersEnabled,
    latitude: s.latitude,
    longitude: s.longitude,
    method: s.method,
    prayers: s.reminderPrayers,
  };
}

/**
 * Garde les rappels de prière programmés alignés sur les réglages : au
 * lancement (complète la fenêtre de 7 jours), à chaque changement de
 * position / méthode / prières / langue, et au retour au premier plan.
 * À monter une seule fois, dans le layout racine.
 */
export function usePrayerRemindersSync() {
  const lastSyncAt = useRef(0);

  useEffect(() => {
    const sync = () => {
      lastSyncAt.current = Date.now();
      syncPrayerReminders(currentConfig());
    };
    // Avant la réhydratation (AsyncStorage), l'état vaut encore les défauts
    // (rappels désactivés) : synchroniser là annulerait les rappels pour rien.
    // La réhydratation déclenche de toute façon l'abonnement ci-dessous si les
    // réglages stockés diffèrent des défauts.
    if (usePrayerStore.persist.hasHydrated()) sync();

    const unsubPrayer = usePrayerStore.subscribe((s, prev) => {
      if (
        s.remindersEnabled !== prev.remindersEnabled ||
        s.latitude !== prev.latitude ||
        s.longitude !== prev.longitude ||
        s.method !== prev.method ||
        s.reminderPrayers !== prev.reminderPrayers
      ) {
        sync();
      }
    });
    // Le texte des notifications est figé à la programmation : nouvelle langue → reprogrammer.
    const unsubLang = useUserStore.subscribe((s, prev) => {
      if (s.language !== prev.language) sync();
    });
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active' && Date.now() - lastSyncAt.current > FOREGROUND_MIN_INTERVAL_MS) sync();
    });

    return () => {
      unsubPrayer();
      unsubLang();
      appState.remove();
    };
  }, []);
}
