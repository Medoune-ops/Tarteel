import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import {
  fetchHousehold, createHousehold, deleteHousehold, leaveHousehold, transferHousehold,
  inviteToHousehold, acceptHouseholdInvite, declineHouseholdInvite,
  cancelHouseholdInvite, removeHouseholdMember, subscribePremium,
  type HouseholdView,
} from '../../lib/api';
import { ApiError } from '../../lib/api/client';

function errMsg(e: unknown): string {
  return e instanceof ApiError && e.status !== 0 ? e.message : "Action impossible. Réessaie.";
}

// Écran « Plan familial » (foyer). Créer un foyer, inviter jusqu'à 5 comptes,
// gérer les membres et les invitations, s'abonner au plan familial (tous les
// membres deviennent premium).
export default function HouseholdScreen() {
  const router = useRouter();
  const T = useTheme();

  const [data, setData] = useState<HouseholdView | null>(null);
  const [error, setError] = useState(false);
  // 404 = endpoint foyer pas encore déployé côté serveur → message dédié.
  const [notDeployed, setNotDeployed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState('');

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
      if (okMsg) Alert.alert('Plan familial', okMsg);
    } catch (e) {
      Alert.alert('Plan familial', errMsg(e));
    } finally {
      setBusy(null);
    }
  }, [busy, load]);

  const onInvite = () => {
    const e = email.trim();
    if (!e) return;
    run('invite', () => inviteToHousehold(e), 'Invitation envoyée ✉️').then(() => setEmail(''));
  };

  const confirmRemoveMember = (userId: string, name: string) => {
    Alert.alert('Retirer ce membre', `Retirer ${name} du foyer ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => run(`rm-${userId}`, () => removeHouseholdMember(userId)) },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert('Supprimer le foyer', 'Tous les membres seront détachés et perdront le premium familial. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => run('delete', deleteHousehold, 'Foyer supprimé') },
    ]);
  };

  const confirmLeave = () => {
    Alert.alert('Quitter le foyer', 'Tu perdras le premium familial. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Quitter', style: 'destructive', onPress: () => run('leave', leaveHousehold, 'Tu as quitté le foyer') },
    ]);
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
        <Text style={styles.headerEmoji}>👨‍👩‍👧‍👦</Text>
        <Text style={styles.headerTitle}>Plan familial</Text>
        <Text style={styles.headerSub}>Jusqu'à 5 comptes premium sous un même foyer</Text>
      </LinearGradient>

      {notDeployed ? (
        <View style={styles.stateBox}>
          <Text style={{ fontSize: 44 }}>🏡</Text>
          <Text style={[styles.stateText, { color: T.text, fontFamily: 'Nunito_800ExtraBold' }]}>
            Le plan familial arrive bientôt
          </Text>
          <Text style={[styles.stateText, { color: T.textSecondary }]}>
            Cette fonctionnalité sera disponible dès la prochaine mise à jour du service.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Feather name="wifi-off" size={32} color={T.textTertiary} />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>Impossible de charger le foyer.</Text>
          <Pressable style={styles.retryBtn} onPress={load}><Text style={styles.retryLabel}>Réessayer</Text></Pressable>
        </View>
      ) : !data ? (
        <View style={styles.stateBox}><ActivityIndicator size="large" color="#6B4DFF" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Invitations reçues */}
          {received.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: T.text }]}>Invitations reçues</Text>
              {received.map((inv) => (
                <View key={inv.token} style={[styles.card, { backgroundColor: T.cardBg }]}>
                  <Text style={[styles.cardTitle, { color: T.text }]}>{inv.invitedBy} t'invite dans son foyer</Text>
                  <View style={styles.rowBtns}>
                    <Pressable
                      style={[styles.btn, styles.btnPrimary]}
                      onPress={() => run(`acc-${inv.token}`, () => acceptHouseholdInvite(inv.token), 'Tu as rejoint le foyer 🎉')}
                      disabled={busy != null}
                    >
                      <Text style={styles.btnPrimaryText}>Accepter</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.btn, styles.btnGhost, { borderColor: T.border }]}
                      onPress={() => run(`dec-${inv.token}`, () => declineHouseholdInvite(inv.token))}
                      disabled={busy != null}
                    >
                      <Text style={[styles.btnGhostText, { color: T.textSecondary }]}>Refuser</Text>
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
                <Text style={[styles.cardTitle, { color: T.text, textAlign: 'center' }]}>Crée ton foyer</Text>
                <Text style={[styles.cardHint, { textAlign: 'center' }]}>
                  Rassemble jusqu'à 5 comptes. Avec l'abonnement familial, tout le foyer devient premium.
                </Text>
                <Pressable
                  style={[styles.btn, styles.btnPrimary, { marginTop: 14 }]}
                  onPress={() => run('create', createHousehold, 'Foyer créé 🏡')}
                  disabled={busy != null}
                >
                  {busy === 'create' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Créer un foyer</Text>}
                </Pressable>
              </View>
            </View>
          )}

          {/* Foyer existant */}
          {h && (
            <>
              {/* Abonnement */}
              <View style={[styles.subCard, h.subscriptionActive ? styles.subActive : { backgroundColor: T.cardBg, borderColor: T.border }]}>
                <Feather name={h.subscriptionActive ? 'check-circle' : 'star'} size={22} color={h.subscriptionActive ? '#2A9E1C' : '#6B4DFF'} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subTitle, { color: T.text }]}>
                    {h.subscriptionActive ? 'Abonnement familial actif' : 'Abonnement familial inactif'}
                  </Text>
                  <Text style={styles.cardHint}>
                    {h.subscriptionActive
                      ? `Tout le foyer est premium${h.subscriptionUntil ? ` · jusqu'au ${new Date(h.subscriptionUntil).toLocaleDateString('fr-FR')}` : ''}`
                      : 'Abonne le foyer pour rendre tous les membres premium.'}
                  </Text>
                </View>
                {h.isOwner && (
                  <Pressable
                    style={[styles.btn, styles.btnPrimary, styles.btnSmall]}
                    onPress={() => run('sub', () => subscribePremium('famille_mensuel'), 'Abonnement familial activé 🎉')}
                    disabled={busy != null}
                  >
                    {busy === 'sub' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{h.subscriptionActive ? 'Renouveler' : "S'abonner"}</Text>}
                  </Pressable>
                )}
              </View>

              {/* Membres */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: T.text }]}>
                  Membres ({h.members.length}/{h.maxMembers})
                </Text>
                <View style={[styles.card, { backgroundColor: T.cardBg }]}>
                  {h.members.map((m, i) => (
                    <View key={m.userId} style={[styles.memberRow, i > 0 && [styles.divider, { borderTopColor: T.divider }]]}>
                      <View style={styles.avatar}><Text style={styles.avatarText}>{m.avatarInitials || m.displayName.slice(0, 2).toUpperCase()}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.memberName, { color: T.text }]}>
                          {m.displayName}{m.isMe ? ' (toi)' : ''}
                        </Text>
                        <Text style={styles.cardHint}>{m.role === 'owner' ? 'Propriétaire' : 'Membre'} · {m.email}</Text>
                      </View>
                      {/* Le propriétaire peut retirer/transférer les autres membres */}
                      {h.isOwner && !m.isMe && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Pressable
                            hitSlop={8}
                            onPress={() => Alert.alert('Transférer la propriété', `Faire de ${m.displayName} le propriétaire du foyer ?`, [
                              { text: 'Annuler', style: 'cancel' },
                              { text: 'Transférer', onPress: () => run(`tr-${m.userId}`, () => transferHousehold(m.userId), 'Propriété transférée') },
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
                  <Text style={[styles.sectionTitle, { color: T.text }]}>Inviter un compte</Text>
                  <View style={[styles.card, { backgroundColor: T.cardBg }]}>
                    <View style={[styles.inviteRow, { backgroundColor: T.inputBg, borderColor: T.border }]}>
                      <TextInput
                        style={[styles.input, { color: T.text }]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="email@exemple.com"
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
                        {busy === 'invite' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Inviter</Text>}
                      </Pressable>
                    </View>
                    {full && <Text style={[styles.cardHint, { marginTop: 8 }]}>Le foyer est complet (5 comptes max).</Text>}

                    {h.invitations.map((inv) => (
                      <View key={inv.id} style={[styles.memberRow, styles.divider, { borderTopColor: T.divider }]}>
                        <Feather name="mail" size={18} color={T.textTertiary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.memberName, { color: T.text }]}>{inv.email}</Text>
                          <Text style={styles.cardHint}>Invitation en attente</Text>
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
                    <Text style={styles.dangerText}>Supprimer le foyer</Text>
                  </Pressable>
                ) : (
                  <Pressable style={[styles.dangerBtn, { borderColor: T.isDark ? '#4A2330' : '#FFD9D9' }]} onPress={confirmLeave} disabled={busy != null}>
                    <Feather name="log-out" size={18} color="#FF4B4B" />
                    <Text style={styles.dangerText}>Quitter le foyer</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 22, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 2 },
  headerEmoji: { fontSize: 34, marginTop: 6 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 4 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2, textAlign: 'center' },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  body: { padding: 18 },
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
