import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { useAppConfigStore } from '../../store/appConfigStore';
import {
  fetchHousehold, createHousehold, deleteHousehold, leaveHousehold, transferHousehold,
  inviteToHousehold, acceptHouseholdInvite, declineHouseholdInvite,
  cancelHouseholdInvite, removeHouseholdMember, subscribePremium,
  type HouseholdView, type CheckoutSession,
} from '../../lib/api';
import { ApiError } from '../../lib/api/client';
import DexPayCheckout from '../../components/DexPayCheckout';
import { useT } from '../../lib/i18n';

function errMsg(e: unknown, fallback: string): string {
  return e instanceof ApiError && e.status !== 0 ? e.message : fallback;
}

// Plans familiaux : clés i18n (titre/détail/prix traduits & localisés).
const FAMILY_PLANS = [
  { id: 'famille_annuel' as const, titleKey: 'household.planAnnualTitle', detailKey: 'household.planAnnualDetail', priceKey: 'household.planAnnualPrice', best: true },
  { id: 'famille_mensuel' as const, titleKey: 'household.planMonthlyTitle', detailKey: 'household.planMonthlyDetail', priceKey: 'household.planMonthlyPrice', best: false },
] as const;

// Écran « Plan familial » (foyer). Créer un foyer, inviter jusqu'à 5 comptes,
// gérer les membres et les invitations, s'abonner au plan familial (tous les
// membres deviennent premium).
export default function HouseholdScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const paymentsEnabled = useAppConfigStore((s) => s.paymentsEnabled);

  const [data, setData] = useState<HouseholdView | null>(null);
  const [error, setError] = useState(false);
  // 404 = endpoint foyer pas encore déployé côté serveur → message dédié.
  const [notDeployed, setNotDeployed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [session, setSession] = useState<CheckoutSession | null>(null);

  const load = useCallback(async () => {
    setError(false);
    setNotDeployed(false);
    try {
      setData(await fetchHousehold());
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotDeployed(true);
      else setError(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Enveloppe : lance une action, rafraîchit, alerte en cas d'échec.
  const run = useCallback(async (key: string, fn: () => Promise<unknown>, okMsg?: string) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
      await load();
      if (okMsg) Alert.alert(tr('household.title'), okMsg);
    } catch (e) {
      Alert.alert(tr('household.title'), errMsg(e, tr('household.actionError')));
    } finally {
      setBusy(null);
    }
  }, [busy, load, tr]);

  const onInvite = () => {
    const e = email.trim();
    if (!e) return;
    run('invite', () => inviteToHousehold(e), tr('household.invitedMsg')).then(() => setEmail(''));
  };

  const confirmRemoveMember = (userId: string, name: string) => {
    Alert.alert(tr('household.removeMemberTitle'), tr('household.removeMemberMsg', { name }), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('household.remove'), style: 'destructive', onPress: () => run(`rm-${userId}`, () => removeHouseholdMember(userId)) },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(tr('household.deleteBtn'), tr('household.deleteMsg'), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('household.delete'), style: 'destructive', onPress: () => run('delete', deleteHousehold, tr('household.deletedMsg')) },
    ]);
  };

  const confirmLeave = () => {
    Alert.alert(tr('household.leaveBtn'), tr('household.leaveMsg'), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('household.leave'), style: 'destructive', onPress: () => run('leave', leaveHousehold, tr('household.leftMsg')) },
    ]);
  };

  // Active le plan familial choisi : crée la session de paiement DexPay puis
  // ouvre le checkout carte — l'abonnement (et le premium de tout le foyer)
  // n'est activé qu'à la confirmation du webhook, jamais avant (voir
  // components/DexPayCheckout.tsx).
  const subscribeFamily = (planId: 'famille_mensuel' | 'famille_annuel', titre: string, prix: string) => {
    Alert.alert(
      tr('household.activateTitle'),
      tr('household.activateConfirmMsg', { plan: titre, price: prix }),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('household.activate'),
          onPress: async () => {
            if (busy) return;
            setBusy('sub');
            try {
              setSession(await subscribePremium(planId));
            } catch (e) {
              Alert.alert(tr('household.title'), errMsg(e, tr('household.actionError')));
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  const h = data?.household ?? null;
  const received = data?.receivedInvitations ?? [];
  const full = h ? h.members.length + h.invitations.length >= h.maxMembers : false;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        {/* maxWidth : garde le contenu lisible/centré sur grand écran (tablette/web) */}
        <View style={styles.headerInner}>
          <Text style={styles.headerEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.headerTitle}>{tr('household.title')}</Text>
          <Text style={styles.headerSub}>{tr('household.headerSub')}</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {notDeployed ? (
        <View style={styles.stateBox}>
          <Text style={{ fontSize: 44 }}>🏡</Text>
          <Text style={[styles.stateText, { color: T.text, fontFamily: 'Nunito_800ExtraBold' }]}>
            {tr('household.notDeployedTitle')}
          </Text>
          <Text style={[styles.stateText, { color: T.textSecondary }]}>
            {tr('household.notDeployedSub')}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Feather name="wifi-off" size={32} color={T.textTertiary} />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('household.loadError')}</Text>
          <Pressable style={styles.retryBtn} onPress={load}><Text style={styles.retryLabel}>{tr('common.retry')}</Text></Pressable>
        </View>
      ) : !data ? (
        <View style={styles.stateBox}><ActivityIndicator size="large" color="#6B4DFF" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Invitations reçues */}
          {received.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('household.receivedTitle')}</Text>
              {received.map((inv) => (
                <View key={inv.token} style={[styles.card, { backgroundColor: T.cardBg }]}>
                  <Text style={[styles.cardTitle, { color: T.text }]} numberOfLines={2} ellipsizeMode="tail">
                    {tr('household.invitesYou', { name: inv.invitedBy })}
                  </Text>
                  <View style={styles.rowBtns}>
                    <Pressable
                      style={[styles.btn, styles.btnPrimary]}
                      onPress={() => run(`acc-${inv.token}`, () => acceptHouseholdInvite(inv.token), tr('household.acceptedMsg'))}
                      disabled={busy != null}
                    >
                      <Text style={styles.btnPrimaryText}>{tr('household.accept')}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.btn, styles.btnGhost, { borderColor: T.border }]}
                      onPress={() => run(`dec-${inv.token}`, () => declineHouseholdInvite(inv.token))}
                      disabled={busy != null}
                    >
                      <Text style={[styles.btnGhostText, { color: T.textSecondary }]}>{tr('household.decline')}</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Pas de foyer → créer */}
          {!h && (
            <View style={styles.section}>
              <View style={[styles.card, { backgroundColor: T.cardBg }]}>
                <Text style={{ fontSize: 40, textAlign: 'center' }}>🏡</Text>
                <Text style={[styles.cardTitle, { color: T.text, textAlign: 'center' }]}>{tr('household.createTitle')}</Text>
                <Text style={[styles.cardHint, { textAlign: 'center' }]}>
                  {tr('household.createHint')}
                </Text>
                <Pressable
                  style={[styles.btn, styles.btnPrimary, { marginTop: 14 }]}
                  onPress={() => run('create', createHousehold, tr('household.createdMsg'))}
                  disabled={busy != null}
                >
                  {busy === 'create' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{tr('household.createBtn')}</Text>}
                </Pressable>
              </View>
            </View>
          )}

          {/* Foyer existant */}
          {h && (
            <>
              {/* Statut de l'abonnement */}
              <View style={[styles.subCard, h.subscriptionActive ? styles.subActive : { backgroundColor: T.cardBg, borderColor: T.border }]}>
                <Feather name={h.subscriptionActive ? 'check-circle' : 'star'} size={22} color={h.subscriptionActive ? '#2A9E1C' : '#6B4DFF'} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subTitle, { color: T.text }]}>
                    {h.subscriptionActive ? tr('household.subActive') : tr('household.subInactive')}
                  </Text>
                  <Text style={styles.cardHint}>
                    {h.subscriptionActive
                      ? (h.subscriptionUntil
                          ? tr('household.subActiveHintUntil', { date: new Date(h.subscriptionUntil).toLocaleDateString() })
                          : tr('household.subActiveHint'))
                      : tr('household.subInactiveHint')}
                  </Text>
                </View>
              </View>

              {/* Choix du plan familial (propriétaire uniquement) — masqué si
                  les paiements sont désactivés (ex: revue store en cours). */}
              {h.isOwner && paymentsEnabled && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: T.text }]}>
                    {h.subscriptionActive ? tr('household.renewTitle') : tr('household.activateTitle')}
                  </Text>
                  {FAMILY_PLANS.map((p) => (
                    <Pressable
                      key={p.id}
                      style={[styles.planCard, { backgroundColor: T.cardBg, borderColor: p.best ? '#6B4DFF' : T.border }]}
                      onPress={() => subscribeFamily(p.id, tr(p.titleKey), tr(p.priceKey))}
                      disabled={busy != null}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {/* flexShrink+numberOfLines : le badge (largeur fixe) ne pousse jamais
                              le titre hors de la carte, même avec un texte traduit plus long. */}
                          <Text
                            style={[styles.planTitle, { color: T.text, flexShrink: 1 }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {tr(p.titleKey)}
                          </Text>
                          {p.best && (
                            <View style={[styles.planBadge, { flexShrink: 0 }]}>
                              <Text style={styles.planBadgeText}>{tr('household.planBest')}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.cardHint} numberOfLines={2}>{tr(p.detailKey)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.planPrice, { color: T.text }]}>{tr(p.priceKey)}</Text>
                        {busy === 'sub' ? <ActivityIndicator color="#6B4DFF" /> : <Feather name="chevron-right" size={20} color="#6B4DFF" />}
                      </View>
                    </Pressable>
                  ))}
                  <Text style={[styles.cardHint, { marginTop: 6 }]}>
                    {tr('household.planFootnote')}
                  </Text>
                </View>
              )}

              {/* Membres */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: T.text }]}>
                  {tr('household.membersTitle', { n: h.members.length, max: h.maxMembers })}
                </Text>
                <View style={[styles.card, { backgroundColor: T.cardBg }]}>
                  {h.members.map((m, i) => (
                    <View key={m.userId} style={[styles.memberRow, i > 0 && [styles.divider, { borderTopColor: T.divider }]]}>
                      <View style={styles.avatar}><Text style={styles.avatarText}>{m.avatarInitials || m.displayName.slice(0, 2).toUpperCase()}</Text></View>
                      <View style={{ flex: 1 }}>
                        {/* numberOfLines={1} : un nom/email long ne fait jamais grandir la
                            ligne au point de désaligner les boutons transférer/retirer. */}
                        <Text style={[styles.memberName, { color: T.text }]} numberOfLines={1} ellipsizeMode="tail">
                          {m.displayName}{m.isMe ? tr('household.you') : ''}
                        </Text>
                        <Text style={styles.cardHint} numberOfLines={1} ellipsizeMode="tail">
                          {m.role === 'owner' ? tr('household.roleOwner') : tr('household.roleMember')} · {m.email}
                        </Text>
                      </View>
                      {/* Le propriétaire peut retirer/transférer les autres membres */}
                      {h.isOwner && !m.isMe && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Pressable
                            hitSlop={8}
                            onPress={() => Alert.alert(tr('household.transferTitle'), tr('household.transferMsg', { name: m.displayName }), [
                              { text: tr('common.cancel'), style: 'cancel' },
                              { text: tr('household.transfer'), onPress: () => run(`tr-${m.userId}`, () => transferHousehold(m.userId), tr('household.transferredMsg')) },
                            ])}
                          >
                            <Feather name="award" size={20} color="#6B4DFF" />
                          </Pressable>
                          <Pressable hitSlop={8} onPress={() => confirmRemoveMember(m.userId, m.displayName)}>
                            <Feather name="user-x" size={20} color="#FF4B4B" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* Invitations en attente (propriétaire) */}
              {h.isOwner && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('household.inviteTitle')}</Text>
                  <View style={[styles.card, { backgroundColor: T.cardBg }]}>
                    <View style={[styles.inviteRow, { backgroundColor: T.inputBg, borderColor: T.border }]}>
                      <TextInput
                        style={[styles.input, { color: T.text }]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder={tr('household.invitePlaceholder')}
                        placeholderTextColor={T.textTertiary}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                      />
                      <Pressable
                        style={[styles.btn, styles.btnPrimary, styles.btnSmall, full && { opacity: 0.5 }]}
                        onPress={onInvite}
                        disabled={busy != null || full}
                      >
                        {busy === 'invite' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{tr('household.invite')}</Text>}
                      </Pressable>
                    </View>
                    {full && <Text style={[styles.cardHint, { marginTop: 8 }]}>{tr('household.full')}</Text>}

                    {h.invitations.map((inv) => (
                      <View key={inv.id} style={[styles.memberRow, styles.divider, { borderTopColor: T.divider }]}>
                        <Feather name="mail" size={18} color={T.textTertiary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.memberName, { color: T.text }]} numberOfLines={1} ellipsizeMode="tail">
                            {inv.email}
                          </Text>
                          <Text style={styles.cardHint}>{tr('household.pendingInvite')}</Text>
                        </View>
                        <Pressable hitSlop={8} onPress={() => run(`cancel-${inv.id}`, () => cancelHouseholdInvite(inv.id))}>
                          <Feather name="x" size={20} color="#FF4B4B" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Actions de fin */}
              <View style={styles.section}>
                {h.isOwner ? (
                  <Pressable style={[styles.dangerBtn, { borderColor: T.isDark ? '#4A2330' : '#FFD9D9' }]} onPress={confirmDelete} disabled={busy != null}>
                    <Feather name="trash-2" size={18} color="#FF4B4B" />
                    <Text style={styles.dangerText}>{tr('household.deleteBtn')}</Text>
                  </Pressable>
                ) : (
                  <Pressable style={[styles.dangerBtn, { borderColor: T.isDark ? '#4A2330' : '#FFD9D9' }]} onPress={confirmLeave} disabled={busy != null}>
                    <Feather name="log-out" size={18} color="#FF4B4B" />
                    <Text style={styles.dangerText}>{tr('household.leaveBtn')}</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
      </KeyboardAvoidingView>

      {session && (
        <DexPayCheckout
          visible
          paymentUrl={session.paymentUrl}
          reference={session.reference}
          onDone={async (outcome) => {
            setSession(null);
            if (outcome === 'success') {
              await load();
              Alert.alert(tr('household.title'), tr('household.activatedMsg'));
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 22, paddingHorizontal: 24, alignItems: 'center' },
  // Contenu du header borné + centré : sur tablette/web (react-native-web), le
  // dégradé reste plein écran mais le texte ne s'étire pas sur toute la largeur.
  headerInner: { width: '100%', maxWidth: 480, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 2 },
  headerEmoji: { fontSize: 34, marginTop: 6 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 4 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2, textAlign: 'center' },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  // width 100% + maxWidth + alignSelf center : pleine largeur sur téléphone,
  // colonne centrée et lisible sur tablette/web (au lieu de cartes étirées).
  body: { padding: 18, width: '100%', maxWidth: 560, alignSelf: 'center' },
  section: { marginBottom: 8 },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, marginTop: 16, marginBottom: 10 },
  card: {
    borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, marginTop: 6 },
  cardHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 12.5, color: '#8A8F99', marginTop: 3 },

  subCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 16, marginTop: 6, borderWidth: 1.5,
  },
  subActive: { backgroundColor: '#DEF5E5', borderColor: '#34C724' },
  subTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1.5,
  },
  planTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  planPrice: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17 },
  planBadge: { backgroundColor: '#6B4DFF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  planBadgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: '#fff' },

  rowBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 14 },
  btnPrimary: { backgroundColor: '#6B4DFF', flex: 1 },
  btnPrimaryText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },
  btnGhost: { borderWidth: 1.5, flex: 1 },
  btnGhostText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderTopWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EDE8FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: '#6B4DFF' },
  memberName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },

  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingLeft: 12, paddingRight: 6, paddingVertical: 4 },
  input: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 14, paddingVertical: 8 },

  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 15, borderWidth: 1.5, marginTop: 8,
  },
  dangerText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#FF4B4B' },
});
