/** Point d'entrée de la couche API. Importer depuis `lib/api`. */
export { API_URL, API_TIMEOUT_MS } from './config';
export { apiFetch, ApiError } from './client';
export { register, login, logout } from './auth';
export type { RegisterInput, LoginInput, RegisterResult } from './auth';
export { fetchMe, updateProfile, updateSettings, fetchActivity, fetchLearnedSourates, saveOnboarding, deleteAccount } from './me';
export { fetchNotificationPrefs, updateNotificationPrefs } from './notifications';
export type { NotificationPrefs } from './notifications';
export type { MeResponse, UpdateProfileInput, UpdateSettingsInput, OnboardingInput } from './me';
export { completeLesson, answerStep } from './lesson';
export type { CompleteLessonInput, AnswerInput, AnswerResult } from './lesson';
export { fetchSections, fetchLesson, fetchVersets, fetchSourates } from './content';
export type { SourateVersets, Verset, VersetMot, SourateListItem } from './content';
export { fetchMyLeague, joinLeague, getOrJoinLeague } from './leagues';
export type { LeagueView, LeagueMember } from './leagues';
export { fetchPodiums, claimPodium } from './rewards';
export { fetchGems, refillHeartsWithGems, reviewRegainHeart, buyStreakFreeze, buyDoubleXp, buyGemPack } from './gems';
export { subscribePremium, repairStreak, buyHearts, getTransaction, refreshAfterPayment } from './billing';
export type { PremiumPlan, CheckoutSession, Transaction, TransactionStatut } from './billing';
export { fetchReferral, redeemReferral } from './referral';
export type { ReferralInfo } from './referral';
export { sendSupportMessage, getSupportThread } from './support';
export type { SupportMessageResult, SupportThreadMessage } from './support';
export type { GemsStatus, GemLedgerEntry, GemPackId } from './gems';
export type { PodiumEntry, LigueTier } from './rewards';
export {
  reciteVerset, reciteVersetRange, reciteLessonStep, fetchRevisions, fetchSourateSegments,
  reviewSegment, fetchGuidedRevision, advanceGuidedRevision,
  fetchLettreRevisions, reviewLettre, reciteLettreStep,
} from './revision';
export type {
  ReciteVersetResult, ReciteStepResult, SourateRevisionView, SegmentRevisionView,
  SourateSegmentsView, RevisionQuality, LettreRevisionView, GuidedRevisionView,
} from './revision';
export { requestPasswordReset, confirmPasswordReset, changePassword } from './password';
export { verifyEmailCode, resendVerificationCode } from './emailVerification';
export { bootstrapSession } from './session';
export type { SessionStatus } from './session';
export { getDeviceId } from './tokens';
export {
  fetchHousehold, createHousehold, deleteHousehold, leaveHousehold, transferHousehold,
  inviteToHousehold, acceptHouseholdInvite, declineHouseholdInvite,
  cancelHouseholdInvite, removeHouseholdMember,
} from './household';
export type {
  HouseholdView, HouseholdMemberView, HouseholdInvitationView, ReceivedInvitationView,
} from './household';
export { fetchAppConfig } from './appConfig';
export type { AppConfig, AppConfigPricing } from './appConfig';
export { fetchSudaisManifest, sudaisFileUrl } from './audio';
export type { SudaisManifest, SudaisManifestEntry } from './audio';
