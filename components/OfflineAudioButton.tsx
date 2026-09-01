/**
 * Bouton « Télécharger pour le mode hors-ligne » de l'écran Écoute du Coran.
 *
 * Le téléchargement des 114 récitations partait auparavant tout seul au
 * démarrage, sans rien afficher : l'utilisateur ne savait ni qu'il existait,
 * ni s'il avait abouti — et il consommait ses données mobiles sans son accord.
 * Il est désormais déclenché ici, explicitement, avec son état visible.
 *
 * Quatre états : à télécharger, en cours (avec progression), terminé, et
 * indisponible côté serveur — ce dernier étant distingué d'un échec réseau,
 * car réessayer n'y changerait rien.
 */
import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAudioDownloadStore } from '../store/audioDownloadStore';
import { fetchSudaisTotalMb } from '../constants/audioDownload';
import { useTheme } from '../utils/useTheme';
import { useT } from '../lib/i18n';

export default function OfflineAudioButton() {
  const T = useTheme();
  const tr = useT();

  // Poids annoncé avant de lancer : engager ~600 Mo de forfait sans le savoir
  // est le genre de surprise qui fait désinstaller une app. null tant qu'on
  // ne l'a pas, pour ne jamais bloquer l'affichage du bouton.
  const [totalMb, setTotalMb] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchSudaisTotalMb().then((mb) => { if (!cancelled) setTotalMb(mb); });
    return () => { cancelled = true; };
  }, []);

  const sudaisReady = useAudioDownloadStore((s) => s.sudaisReady);
  const isDownloading = useAudioDownloadStore((s) => s.isDownloading);
  const downloadedCount = useAudioDownloadStore((s) => s.downloadedCount);
  const totalCount = useAudioDownloadStore((s) => s.totalCount);
  const lastError = useAudioDownloadStore((s) => s.lastError);
  const startDownload = useAudioDownloadStore((s) => s.startDownload);

  // Déjà téléchargé : un simple rappel, pas un bouton — il n'y a plus rien
  // à faire et proposer une action inutile ne ferait qu'embrouiller.
  if (sudaisReady) {
    return (
      <View style={[styles.doneBox, { backgroundColor: T.cardBg }]}>
        <Feather name="check-circle" size={16} color="#2A9E1C" />
        <Text style={[styles.doneText, { color: T.textSecondary }]}>
          {tr('offlineAudio.ready')}
        </Text>
      </View>
    );
  }

  // Le serveur n'a aucun fichier : réessayer ne servirait à rien, on
  // l'explique au lieu d'afficher un bouton qui échouera à coup sûr.
  if (lastError === 'unavailable') {
    return (
      <View style={[styles.doneBox, { backgroundColor: T.cardBg }]}>
        <Feather name="clock" size={16} color={T.textTertiary} />
        <Text style={[styles.doneText, { color: T.textSecondary }]}>
          {tr('offlineAudio.unavailable')}
        </Text>
      </View>
    );
  }

  const pct = totalCount > 0 ? Math.round((downloadedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.btn, isDownloading && styles.btnBusy]}
        onPress={startDownload}
        disabled={isDownloading}
      >
        <Feather name={isDownloading ? 'download-cloud' : 'download'} size={17} color="#fff" />
        <Text style={styles.btnLabel}>
          {isDownloading
            ? tr('offlineAudio.downloading', { done: downloadedCount, total: totalCount })
            : tr('offlineAudio.download')}
        </Text>
      </Pressable>

      {isDownloading && (
        <View style={[styles.track, { backgroundColor: T.divider }]}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
      )}

      <Text style={[styles.hint, { color: T.textTertiary }]}>
        {lastError === 'failed'
          ? tr('offlineAudio.failed')
          : totalMb != null
            ? tr('offlineAudio.hintWithSize', { mb: totalMb })
            : tr('offlineAudio.hint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 14, gap: 8 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#8A5CF0', borderRadius: 14, paddingVertical: 13,
  },
  btnBusy: { opacity: 0.75 },
  btnLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#8A5CF0', borderRadius: 3 },

  hint: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 12, textAlign: 'center', lineHeight: 17,
  },

  doneBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 14, borderRadius: 12, paddingVertical: 11,
  },
  doneText: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
});
