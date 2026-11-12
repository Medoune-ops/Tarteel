import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, Alert, TextInput, ScrollView,
  KeyboardAvoidingView, Keyboard, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FriendAvatar from './FriendAvatar';
import FriendButton from './FriendButton';
import { useTheme } from '../utils/useTheme';
import { friendPalette } from '../utils/friendTheme';
import {
  sendToFriend, fetchChallenges,
  type FriendUser, type ChallengeView,
} from '../lib/api';
import { ApiError } from '../lib/api/client';
import { useT } from '../lib/i18n';

type SendType = 'encouragement' | 'success' | 'reminder' | 'hadith';

interface Props {
  visible: boolean;
  friend: FriendUser | null;
  /** Référence à pré-remplir pour un envoi de hadith (Phase 4). */
  hadithRef?: { collectionId: string; n: number } | null;
  /** Type pré-sélectionné à l'ouverture (ex. « reminder » depuis un défi). */
  initialType?: SendType;
  /** Défi pré-sélectionné pour une relance (« remainder »). */
  reminderChallengeId?: string;
  /**
   * Numéro de sourate MAÎTRISÉE (renvoyé par le serveur, ex. `sourateMastered`).
   * Sa présence débloque l'envoi « réussite » : on ne partage qu'une réussite
   * écrite serveur (règle 2). L'option disparaît si absente.
   */
  successSourateNumero?: number | null;
  onClose: () => void;
  onSent?: () => void;
}

/**
 * Envoi « à un ami » (Phases 2/3/4) : encouragement, réussite, relance de défi
 * ou hadith. Passé par le quota serveur (3/jour, débité atomiquement).
 */
export default function FriendSendModal({ visible, friend, hadithRef, initialType, reminderChallengeId, successSourateNumero, onClose, onSent }: Props) {
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const MIN_INPUT = 60;
  const MAX_INPUT = 160;
  const [type, setType] = useState<SendType>('encouragement');
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(MIN_INPUT);
  const [challenges, setChallenges] = useState<ChallengeView[]>([]);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  /**
   * Le clavier se lève : la zone de saisie doit rester visible.
   *
   * La feuille remonte déjà (KeyboardAvoidingView sur le fond, voir plus bas),
   * mais quand le contenu est plus haut que la place restante (liste de défis,
   * long message…), il faut faire défiler jusqu'au champ.
   */
  const scrollToInput = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      // On laisse le clavier finir son animation, sinon le scroll part dans
      // le vide (la mise en page n'est pas encore faite).
      if (timer) clearTimeout(timer);
      timer = setTimeout(scrollToInput, 150);
    });
    return () => {
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, [scrollToInput]);

  useEffect(() => {
    if (!visible) return;
    const initial = initialType ?? (hadithRef ? 'hadith' : 'encouragement');
    // Pas de réussite sans attestation serveur (règle 2).
    setType(initial === 'success' && successSourateNumero == null ? 'encouragement' : initial);
    setText('');
    setInputHeight(MIN_INPUT);
    setSending(false);
    fetchChallenges()
      .then((r) => {
        const active = r.challenges.filter((c) => c.status === 'active');
        setChallenges(active);
        const wanted = reminderChallengeId ?? (initialType === 'reminder' ? active[0]?.id : undefined);
        setChallengeId(active.find((c) => c.id === wanted)?.id ?? active[0]?.id ?? null);
      })
      .catch(() => {});
  }, [visible, hadithRef, initialType, reminderChallengeId, successSourateNumero]);

  const types: { id: SendType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { id: 'encouragement', label: tr('friends.sendEncouragement'), icon: 'smile' },
    // « Réussite » n'est proposée que si le serveur a attesté une sourate
    // maîtrisée (règle 2) : jamais une réussite auto-déclarée par le client.
    ...(successSourateNumero != null
      ? [{ id: 'success' as const, label: tr('friends.sendSuccess'), icon: 'star' as const }]
      : []),
    { id: 'reminder', label: tr('friends.sendReminder'), icon: 'target' },
    { id: 'hadith', label: tr('friends.sendHadith'), icon: 'book-open' },
  ];

  const canSend =
    (type === 'encouragement' && text.trim().length > 0) ||
    (type === 'success' && successSourateNumero != null) ||
    (type === 'reminder' && challengeId != null) ||
    (type === 'hadith' && hadithRef != null);

  const onSend = useCallback(async () => {
    if (!friend || !canSend || sending) return;
    setSending(true);
    try {
      const payload =
        type === 'encouragement' ? { type, text: text.trim() } as const :
        type === 'success' ? { type, numero: successSourateNumero!, text: text.trim() || undefined } as const :
        type === 'reminder' ? { type, challengeId: challengeId! } as const :
        { type, collectionId: hadithRef!.collectionId, n: hadithRef!.n, text: text.trim() || undefined } as const;
      await sendToFriend(friend.id, payload);
      Alert.alert(tr('friends.sendDone'));
      onSent?.();
      onClose();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : tr('friends.errorCode');
      Alert.alert(tr('friends.addErrorTitle'), msg);
    } finally {
      setSending(false);
    }
  }, [friend, canSend, sending, type, text, challengeId, hadithRef, tr, onSent, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/*
        Le KeyboardAvoidingView enveloppe le FOND, pas la feuille : c'est lui
        qui doit rétrécir quand le clavier monte. Posé à l'intérieur de la
        feuille (comme avant), il n'avait aucune hauteur bornée : sur iOS son
        `padding` gonflait la feuille par le bas — le champ restait collé sous
        le clavier — et sur Android il ne rétrécissait rien du tout.

        - iOS      : `padding` → la zone visible perd la hauteur du clavier ;
        - Android  : `height`  → la hauteur du fond est réduite d'autant.
        Dans les deux cas la feuille, alignée en bas, REMONTE au-dessus du
        clavier.
      */}
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.sheet, { backgroundColor: T.pageBg }]}>
          <LinearGradient colors={['#8B5CF6', '#6B4DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accent} />
          <View style={styles.handle} />
          <View style={[styles.sheetHeader, { borderBottomColor: T.divider }]}>
            <FriendAvatar name={friend?.displayName ?? '?'} id={friend?.id} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: T.text }]}>
                {tr('friends.sendTo', { name: friend?.displayName ?? '' })}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={24} color={T.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.typeRow}>
              {types.map((t) => {
                const on = type === t.id;
                return (
                  <Pressable
                    key={t.id}
                    style={[styles.typeChip, { backgroundColor: on ? P.tint : T.cardBg, borderColor: on ? '#6B4DFF' : T.border }]}
                    onPress={() => setType(t.id)}
                  >
                    <Feather name={t.icon} size={16} color={on ? '#6B4DFF' : T.textSecondary} />
                    <Text style={[styles.typeChipText, { color: on ? '#6B4DFF' : T.textSecondary }]}>{t.label}</Text>
                    {on && <Feather name="check" size={14} color="#6B4DFF" />}
                  </Pressable>
                );
              })}
            </View>

            {type === 'hadith' && (
              <View style={[styles.hintBox, { backgroundColor: T.cardBg }]}>
                <Feather name="book-open" size={20} color="#6B4DFF" />
                <Text style={[styles.hintText, { color: T.textSecondary }]}>
                  {hadithRef ? tr('friends.sendHadithHint') : tr('friends.sendHadithHint')}
                </Text>
              </View>
            )}

            {type === 'reminder' && (
              <View style={[styles.challengeList, { backgroundColor: T.cardBg }]}>
                {challenges.length === 0 ? (
                  <Text style={[styles.hintText, { color: T.textSecondary, padding: 14 }]}>
                    {tr('friends.noChallenges')}
                  </Text>
                ) : (
                  challenges.map((c) => {
                    const on = challengeId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        style={[styles.challengeRow, { borderColor: T.divider }, on && { backgroundColor: P.tint }]}
                        onPress={() => setChallengeId(c.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.challengeName, { color: T.text }]}>{c.title}</Text>
                          <Text style={[styles.challengeMeta, { color: T.textSecondary }]}>
                            {c.metric === 'streak' && tr('friends.challengeTargetStreak')}
                            {c.metric === 'sourates' && tr('friends.challengeTargetSourates')}
                            {' → '}{c.targetValue}
                          </Text>
                        </View>
                        {on && <Feather name="check-circle" size={20} color="#6B4DFF" />}
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}

            {(type === 'encouragement' || type === 'success' || (type === 'hadith' && hadithRef)) && (
              <View style={[styles.inputBox, { backgroundColor: T.cardBg }]}>
                <TextInput
                  style={[styles.input, { color: T.text, height: inputHeight }]}
                  placeholder={tr('friends.sendPlaceholder')}
                  placeholderTextColor="#A0A5AE"
                  multiline
                  scrollEnabled={false}
                  value={text}
                  onChangeText={setText}
                  onFocus={scrollToInput}
                  onContentSizeChange={(e) => {
                    const h = e.nativeEvent.contentSize.height;
                    setInputHeight(Math.min(MAX_INPUT, Math.max(MIN_INPUT, h)));
                  }}
                  maxLength={140}
                />
              </View>
            )}

            <FriendButton label={tr('friends.send')} icon="send" onPress={onSend} loading={sending} disabled={!canSend} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 26, maxHeight: '85%', overflow: 'hidden' },
  accent: { height: 5, width: '100%' },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#C9CCD4', alignSelf: 'center', marginTop: 10 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1,
  },
  sheetTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17 },
  sheetBody: { padding: 18, gap: 14 },
  // `flexShrink: 1` : la feuille a une hauteur MAX (85 %) mais pas de hauteur
  // fixe. Sans ça, le ScrollView garde la hauteur de son contenu, la feuille
  // le découpe (overflow hidden) et le bas — champ de saisie, bouton —
  // disparaît au lieu de défiler.
  sheetScroll: { flexShrink: 1 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9 },
  typeChipText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14 },
  hintText: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  challengeList: { borderRadius: 16, overflow: 'hidden' },
  challengeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1 },
  challengeName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  challengeMeta: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 2 },
  // Pas de maxHeight ici : la hauteur du champ est déjà plafonnée
  // (MAX_INPUT), un maxHeight sur la boîte le rognerait.
  inputBox: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  input: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, minHeight: 60, padding: 0, textAlignVertical: 'top' },
});
