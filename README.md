# Tarteel — Frontend (React Native + Expo)

Application mobile (iOS / Android) d'apprentissage du Coran, dans l'esprit de Duolingo
(gamification, parcours en étapes, cœurs, streak, ligues), avec une mascotte loutre.

> **Auteur :** Medoune Seck
> **Stack :** React Native 0.81 · Expo SDK 54 · TypeScript · expo-router · Zustand
> **Migré de Flutter → React Native/Expo en juin 2026.**

---

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances (TOUJOURS avec --legacy-peer-deps)
npm install --legacy-peer-deps

# 2. Lancer le serveur de dev
npx expo start            # menu interactif (QR code Expo Go)
npx expo start --web      # ouvre dans le navigateur
npx expo start --tunnel   # téléphone hors du réseau / Wi-Fi restreint
```

Puis scannez le QR code avec **Expo Go** (téléphone) ou pressez `w` pour le web.

### ⚠️ Règles d'installation à respecter

| Règle | Pourquoi |
|-------|----------|
| `npm install --legacy-peer-deps` | Conflit de peer deps `react-dom@19` / Expo |
| `react` **===** `react-dom` (mêmes versions exactes) | Sinon écran noir sur le web |
| `react-native-worklets` matche la peer dep de Reanimated (4.1.x → worklets 0.5.x) | Sinon crash Reanimated |
| Babel : `react-native-worklets/plugin` (PAS `reanimated/plugin`) | Reanimated 4 |
| Tester la compat **Expo Go** avant tout bump de SDK | Expo Go App Store retarde le support des nouveaux SDK |

### 🌐 Tunnel (réseau restreint)

Le Wi-Fi en profil Public + l'absence de droits admin bloquent le LAN.
Utilisez `--tunnel`, puis récupérez l'URL ngrok :

```powershell
Invoke-RestMethod http://127.0.0.1:4040/api/tunnels
```

---

## 📦 Stack technique

| Domaine | Choix |
|---------|-------|
| Framework | **Expo SDK 54** (rétrogradé depuis 56 : Expo Go iOS ne supporte pas encore 56) |
| UI | React 19.1.0 · React Native 0.81.5 · react-native-web |
| Routing | **expo-router 6** (file-based, `typedRoutes` activé) · `main` = `expo-router/entry` |
| State | **Zustand 5** persisté via AsyncStorage |
| Animations | **Reanimated ~4.1** (+ `react-native-worklets` 0.5.1) |
| Graphiques | **react-native-svg** 15.12.1 · expo-linear-gradient |
| Icônes | `@expo/vector-icons` (Feather) + icônes islamiques custom (SVG) |
| Polices | `@expo-google-fonts` : **Baloo 2** (titres), **Nunito** (UI), **Scheherazade New** (arabe) |

### 🎨 Design tokens

Source de vérité : `../design_handoff_tarteel/` (22 écrans HiFi en HTML + specs).
Tokens centralisés dans [`constants/colors.ts`](constants/colors.ts).

- Primaire : `#6B4DFF` · Vert (succès) : `#34C724` · Fond : `#EDEDF2`

---

## 🗂️ Structure du projet

```
app/                            # Routes (expo-router, file-based)
├── _layout.tsx                 # Root layout (fonts, providers)
├── index.tsx                   # Redirection initiale (onboarding / app)
│
├── (onboarding)/               # Splash → onboarding 1/2/3 → signup
├── (setup)/                    # niveau · objectif · temps · plan
│
└── (app)/
    ├── (tabs)/                 # TabBar custom : parcours · ligues · coran · revisions · profil
    ├── docs/                   # Contenu pédagogique : islam, prière, ablutions, coran, prophètes
    ├── lesson/                 # Moteur de leçon (voir ci-dessous)
    ├── revision/flashcard.tsx  # Révisions (flashcards)
    ├── subscription.tsx        # Écran premium
    ├── settings.tsx · notifications.tsx · privacy.tsx

components/                     # UI réutilisable
├── Otter.tsx                   # Mascotte loutre (SVG animé)
├── CTAButton · OptionTile · ProgressBar · SegmentProgress
├── TabBar · LessonHeader · StatusBar · Toggle · Waveform
├── Confetti · IslamicIcons

constants/
├── colors.ts                   # Design tokens
├── parcours.ts                 # Données du parcours (miroir du futur GET /sections)
└── lessonEngine.ts             # Logique des exercices d'une leçon

store/
└── userStore.ts                # Zustand (streak, xp, hearts, premium, level, objectif…)
```

---

## 🧠 Mécaniques clés

### Parcours
Section 1 = **Alphabet Arabe**, puis 1 hizb = 1 section dans l'ordre **décroissant**
(Section N = Hizb 62−N) : on démarre par les sourates courtes (Juz Amma) et on remonte.
L'ordre des sourates **dans** un hizb suit le Mushaf.
Données dans [`constants/parcours.ts`](constants/parcours.ts), structurées en miroir du futur
`GET /sections` → au branchement de l'API, remplacer `PARCOURS_SECTIONS` par le `fetch`.

### Leçon — « Apprends PUIS Teste »
1. **Découverte** — `lesson/listen.tsx` : écouter / répéter le verset (**aucun cœur**).
2. **Test écrit** — `qcm` · `arrange` · `match` (1 faute = −1 cœur, pas de 2ᵉ chance).
3. **Test vocal** — `lesson/voice.tsx` : prononciation (évaluation **indulgente**, ≥70 % = OK
   quand Whisper sera branché).

On ne pénalise jamais un verset pas encore appris.

### Système de cœurs (monétisation) — `store/userStore.ts`
- Gratuit : **5 cœurs** (`MAX_HEARTS`), −1 par faute, blocage à 0.
- Régénération : **1 cœur / 4 h** (`HEART_REGEN_MS`), calculée via `lastHeartLossAt`.
- Premium : **cœurs illimités** (∞) + **XP doublés**.
- Écran de blocage : `lesson/out-of-hearts.tsx` (compte à rebours live + CTA premium).
- API exposée : `loseHeart`, `syncHearts`, `msUntilNextHeart`, `refillHearts`, `setPremium`, `addXP`.

---

## 🔌 État & intégration backend

Le store est entièrement **front** pour l'instant (valeurs initiales mockées).
Backend prévu (projet séparé) : **Node + TypeScript · Fastify · PostgreSQL · Prisma · JWT**
(pas de Supabase/Firebase). Points de branchement à venir :

- `GET /sections` → remplace `PARCOURS_SECTIONS`
- Auth JWT → `(onboarding)/signup.tsx` + `logout()`
- Régénération des cœurs côté serveur (anti-triche) + premium ∞ / XP×2
- Streak : 1 jour manqué = gelé, 2 jours = cassé (récupération payante)
- Ligues temps réel

---

## ✅ État d'avancement

- ✅ Les 22 écrans du handoff sont implémentés.
- ✅ `npx tsc --noEmit` passe sans erreur.
- ✅ Mécaniques interactives (arrange / match) fonctionnelles.
- 🚧 **Révisions** : non opérationnelle au lancement (feature à venir).
- 🚧 Audio réel (`expo-av`), enregistrement vocal, évaluation tajwid (Whisper).
- 🚧 Branchement de l'API maison (auth, parcours, cœurs serveur, ligues).

---

## 📜 Scripts

| Commande | Effet |
|----------|-------|
| `npm start` | `expo start` |
| `npm run android` | `expo start --android` |
| `npm run ios` | `expo start --ios` |
| `npm run web` | `expo start --web` |
| `npx tsc --noEmit` | Vérification TypeScript |
