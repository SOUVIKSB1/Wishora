# 🎂 WISHORA — Birthday Wish Experience App
## Complete System Design Prompt for Antigravity

> **Design Directive:** Anti-AI-generated. Every screen must feel hand-crafted, intentional, and opinionated — inspired by CRED's dark-glass premium UI meets iOS's fluid haptic-first interactions. No generic gradients. No template chrome. No rounded-card SaaS grids.

---

## SECTION 1 — CONCEPT ENHANCEMENT & APP IDENTITY

### App Name: **WISHORA**
*Tagline: "Make them feel special."*

### Enhanced Core Concept

WISHORA is not a card-sender. It is a **cinematic birthday experience engine** — a personal film director for emotional moments. The sender is the director. The recipient is the audience. The experience is a 90-second immersive birthday film, personalized by AI, themed by personality, and delivered as a link that opens like a sealed letter.

### Market Differentiators (Added to Original Idea)
- **Reaction Layer:** After the recipient finishes the experience, they can record a 15-second "reaction video/voice note" which is sent back to the sender as a surprise
- **Memory Capsule:** Every wish is auto-archived in a "Memory Vault" — revisit past birthdays
- **Group Wish Collaboration:** Multiple senders can contribute photos/messages that merge into one cinematic experience
- **Wish Analytics:** Sender sees heatmap of when/where/how many times link was opened
- **Occasion Expand:** Anniversary, Graduation, New Year — same engine, different themes (future roadmap hook)
- **Freemium Gating:** 1 free wish/month; Premium unlocks unlimited + custom music + HD export + no WISHORA watermark
- **Wish Marketplace:** Community templates created by designers/animators, purchasable

---

## SECTION 2 — TECHNICAL ARCHITECTURE

### Tech Stack Decision

**Frontend (Mobile):** Flutter 3.x
- Reason: Superior animation control (CustomPainter, Rive, Lottie), single codebase for Android/iOS/Web, 60/120fps rendering, responsive across all screen sizes natively

**Frontend (Web — Shared Links):** Flutter Web + Vercel Edge
- The shared wish link opens as a Flutter Web experience — same codebase, zero re-implementation

**Backend:** Node.js (TypeScript) + Fastify
- REST API for core CRUD
- WebSockets for real-time countdown sync

**Database:** PostgreSQL (Supabase) + Redis (caching/sessions)

**Storage:** Cloudflare R2 (S3-compatible, egress-free) for photos, audio

**AI Layer:** build own model dont api based online model
- Wish text generation, multilingual suggestions, tone adjustment

**Auth:** Supabase Auth (Google OAuth + Email)

**Notifications:** Firebase Cloud Messaging (FCM)

**CSV Processing:** Papa Parse (client-side) + backend validation

**Music Trimming:** Web Audio API + FFmpeg (WASM, client-side trimming)

**Animations:** Rive (interactive), Lottie (celebratory), Flutter CustomPainter (cake/candles/balloons)

**Analytics:** PostHog (self-hosted) — wish open counts, geography, device

**CDN:** Cloudflare

---

## SECTION 3 — UI/UX DESIGN SYSTEM

### Visual Identity

**Design Language:** "Velvet Glass" — a dark, tactile premium feel with depth, blur layers, and intentional light. Inspired by CRED's dark surfaces and iOS's material translucency. Nothing flat. Nothing generic.

**Color System:**

```
--color-void:       #08080C    /* base background — not pure black */
--color-surface:    #111118    /* card surfaces */
--color-glass:      rgba(255,255,255,0.04)  /* glassmorphism layer */
--color-border:     rgba(255,255,255,0.08)  /* subtle borders */
--color-accent:     #C8A96E    /* gold — premium, warm, not garish */
--color-glow:       #C8A96E26  /* accent ambient glow */
--color-text-1:     #F2F0ED    /* primary text */
--color-text-2:     #8A8898    /* secondary text */
--color-text-3:     #3D3D52    /* ghost text */

/* Gender/Age-adaptive palette — injected at runtime */
/* Boy 15-45: Electric Midnight */
--theme-boy:        #0A0E1A, #1A2744, #2563EB, #60A5FA
/* Girl 15-45: Rose Dusk */
--theme-girl:       #150A1A, #2D1139, #DB2777, #F9A8D4
/* Child <15: Candy World */
--theme-child:      #0A1A10, #1A3A20, #10B981, #FCD34D, #F472B6
/* Neutral/Other: Cosmic */
--theme-neutral:    #0A0A1A, #1A1A3A, #7C3AED, #A78BFA
```

**Typography:**

```
Display Font:  "Clash Display" — Variable weight 300–700
               Used for names, countdown numbers, emotional headlines
               Letter-spacing: -0.03em on large sizes

Body Font:     "Satoshi" — Variable 300–700
               Used for all interface text, wish messages
               
Accent Font:   "Instrument Serif" — Italic only
               Used for wish messages being displayed (reading feel)

Mono Font:     "Geist Mono" — For dates, timecodes, technical labels
```
> Import via Google Fonts CDN or bundle locally for offline support

**Border Radius Scale:**
```
--radius-sm:  8px    (inputs, chips)
--radius-md:  16px   (cards)
--radius-lg:  24px   (bottom sheets, modals)
--radius-xl:  32px   (large panels)
--radius-pill: 999px (buttons, tags)
```

**Elevation / Depth:**
```
/* Use backdrop-filter blur instead of drop shadows */
Level 1: backdrop-filter: blur(12px) — overlays
Level 2: backdrop-filter: blur(24px) — modals
Level 3: box-shadow: 0 0 80px rgba(200,169,110,0.15) — gold accent glow
```

**Motion Principles:**
- Spring physics everywhere (Flutter: `SpringSimulation`, `CurvedAnimation`)
- Entrance: elements rise 24px with fade — staggered, not simultaneous
- Exit: dissolve + scale to 0.96 — never slide off-screen
- Transitions between screens: shared element transitions (hero animation)
- Haptic feedback on every meaningful interaction (Flutter HapticFeedback)
- Micro-interactions: button press scales to 0.97 with 80ms spring
- NO: auto-playing parallax sections, scroll-triggered fade-in on every element

---

## SECTION 4 — INFORMATION ARCHITECTURE

```
WISHORA App
├── Onboarding (3 screens — first launch only)
│   ├── Welcome Cinematic
│   ├── Permission Requests (Notifications, Mic, Storage)
│   └── Quick Google Sign-In
│
├── Home Tab
│   ├── Upcoming Birthdays Ribbon (next 30 days)
│   ├── Recent Creations Grid (folders)
│   ├── "Create New Wish" FAB
│   └── Quick Stats (wishes sent, people who opened)
│
├── Create Wish Flow (Multi-step modal sheet)
│   ├── Step 1: Person Details (Name, DOB, Gender)
│   ├── Step 2: Wish Message (AI-assisted, multilingual)
│   ├── Step 3: Photos Upload (up to 12 photos)
│   ├── Step 4: Music Selection (default library or upload+trim)
│   ├── Step 5: Theme Preview (auto-selected by age/gender, can override)
│   └── Step 6: Review & Generate Link
│
├── My Wishbook Tab
│   ├── Folders (user-named)
│   ├── Drafts Section
│   ├── Sent Archive
│   └── Memory Vault (received reactions)
│
├── Contacts Tab
│   ├── Birthday Contacts List
│   ├── Add Manually
│   ├── Import via CSV
│   └── Notification Settings per Person
│
├── Profile & Settings
│   ├── Account (Google-linked)
│   ├── Premium Upgrade
│   ├── Notification Preferences
│   ├── App Language
│   └── About / Help
│
└── Shared Wish Experience (Web/App Deep Link — NO LOGIN REQUIRED)
    ├── Screen 1: Sealed Envelope Reveal
    ├── Screen 2: Countdown (if pre-birthday)
    ├── Screen 3: Cake + Mic Blow
    ├── Screen 4: Journey Timeline
    ├── Screen 5: Interactive Photo Album
    ├── Screen 6: Final Celebration + Balloon Burst
    └── Screen 7: CTA (Try WISHORA / Create for a Friend)
```

---

## SECTION 5 — FEATURE SPECIFICATIONS (DEEP DIVE)

### 5.1 CREATE WISH FLOW

**Step 1 — Person Details**
- Full name input (max 30 chars) with live preview showing how name will appear in animation
- Date of Birth picker — custom wheel picker (no default OS picker — build custom in Flutter)
- Gender selector: Boy / Girl / Non-binary / Child / Prefer not to say
- Age auto-calculated and stored
- "Is this for someone under 15?" auto-detected from DOB, theme adjusted

**Step 2 — AI Wish Generation**
- Text area with placeholder: "Start writing or let AI inspire you..."
- Top bar: language selector (supports: English, Bengali, Hindi, Spanish, French, German, Portuguese, Arabic, Chinese, Japanese, Korean — 11 languages)
- "AI Suggest" pill button → opens bottom sheet with 3 AI-generated wish variations
- Each suggestion has a "Tone" tag: Funny / Heartfelt / Poetic / Short & Sweet
- User can tap any suggestion, tap "Mix" to blend two, or edit freely
- Character counter with soft limit 280 / hard limit 500
- AI prompt template (sent to Claude):
  ```
  Generate 3 birthday wish messages for {NAME}, who is turning {AGE} years old.
  The recipient is {GENDER}. The sender's relationship: {RELATIONSHIP}.
  Tone options: [Funny, Heartfelt, Poetic, Short & Sweet].
  Language: {LANGUAGE}. Each wish should feel human, warm, specific to their age.
  Do NOT use generic phrases like "May all your dreams come true."
  Format: JSON array with fields: tone, message, emoji_suggestion.
  ```

**Step 3 — Photo Upload**
- Drag-and-drop grid (mobile: tap to add)
- Min 1 photo, Max 12 photos
- Photos are auto-cropped to 1:1 for album, but original stored
- Face detection (ML Kit) highlights faces — used for album focus animation
- Photo order = timeline order (user can reorder via long-press drag)
- Caption per photo (optional, max 40 chars) — appears as subtitle in album

**Step 4 — Music Selection**
- Category tabs: Birthday Classics / Bollywood / Lo-fi Chill / Orchestral / Jazz / Upload Your Own
- Each song shows: title, duration, BPM mood tag, 15-sec waveform preview
- "Upload Your Own": accepts MP3/M4A/WAV up to 15MB
  - Custom trim UI: waveform scrubber, start/end handles, loop preview
  - FFmpeg.wasm handles client-side trim — no server round trip
  - Volume normalize applied automatically
- Selected music previews in bottom bar with mute toggle throughout creation

**Step 5 — Theme Preview**
- Auto-selected theme based on DOB/gender computation:
  - Age < 15 → Candy World (cartoonish, Lottie-heavy, bright, rounded shapes)
  - Age 15-45 + Male → Electric Midnight (sharp, cinematic, blue-electric)
  - Age 15-45 + Female → Rose Dusk (soft-bloom, particle-rich, pink-gold)
  - Age > 45 → Timeless Gold (elegant, serif-forward, warm amber)
  - Non-binary/Other → Cosmic Purple (fluid, iridescent, inclusive)
- User can override with manual theme picker (shows all 5 with animated previews)
- Color palette preview shows real-time example of name card

**Step 6 — Review & Generate**
- Summary card: name, age, # photos, music title, theme
- Estimated experience duration shown (auto-calculated)
- Toggle: "Send immediately" or "Schedule for birthday at midnight"
- Generate Link button → spinner with fun loading messages:
  "Wrapping the wish in gold..." / "Teaching candles to flicker..." / "Hiding confetti inside the envelope..."
- On success: share sheet auto-opens with:
  - Copy link
  - WhatsApp (native intent)
  - Instagram Stories (share as sticker link)
  - SMS
  - Email

---

### 5.2 THE WISH EXPERIENCE (RECIPIENT VIEW)

**This experience runs at: wishora.app/w/{unique_id}**
No login required. Works on any browser. Optimized for mobile-first.

---

**SCREEN 1 — THE ENVELOPE**

Visual: Full dark screen. A single wax-sealed envelope drifts down from top with gentle physics (gravity simulation). Sender's initials embossed on wax seal. Recipient name in Clash Display appears below: "This is for {NAME}."

Interaction: Tap or swipe up to unseal. Envelope unfolds with a paper-crinkle sound effect + haptic. Letter slides out with spring animation.

Duration: 4–6 seconds

---

**SCREEN 2 — THE COUNTDOWN (if > 0 days until birthday)**

Visual: Full bleed. Countdown in giant Clash Display numerals (DD:HH:MM:SS). Background: animated particle field in theme color. Message: "Your moment is almost here, {NAME}."

If birthday = today: Skip countdown, go directly to Screen 3.

On birthday day: Countdown explodes into confetti at 00:00:00 and auto-advances.

---

**SCREEN 3 — THE CAKE + CANDLE BLOW**

Visual: Handcrafted birthday cake illustration (gender/age themed):
- Child: Cartoon tiered cake, bright colors, googly eyes on candles
- Girl theme: Elegant multi-layer cake, rose gold, macarons, flowers
- Boy theme: Sleek dark geometric cake, metallic accents, flames
- Classic: Traditional white-cream cake, golden candles

Candles: Flickering in real-time using Flutter CustomPainter (flame simulation with noise function)

**Mic Interaction:**
- Bottom text: "Blow out the candles 🎤"
- Mic permission requested with friendly animation
- Uses Flutter's microphone_a_star package to detect blow (amplitude spike > threshold)
- On successful blow: Flames animate out one-by-one with particle smoke effect
- Fallback: "Tap to blow" for mic-denied users
- After all candles out: Confetti burst + "🎉 HAPPY BIRTHDAY {NAME}!" in massive type

Duration: 8–12 seconds

---

**SCREEN 4 — THE JOURNEY TIMELINE**

Visual: Horizontal scrolling timeline revealing years from birth year to current year.

Age/Year milestones with contextual auto-generated copy:
- "Born in {YEAR} — the world got a little better" (AI-generated, cached per year)
- "Turned 5 — probably loved {popular show of that year}" (world event hooks)
- "Turning {AGE} today — and here you are ✨"

Age-themed visual style per theme variant.

Duration: User-controlled scroll, auto-advances after 12 seconds

---

**SCREEN 5 — THE PHOTO ALBUM**

Entry animation: Photos fly in from different angles and stack into an album.

Navigation: Swipe left/right. Each photo:
1. Blurred entry → sharp reveal (2D Gaussian blur removal animation)
2. Caption fades in below (Instrument Serif italic)
3. Soft spotlight on detected face(s)
4. Subtle parallax on swipe

Album style per theme:
- Child: Polaroid frames with crayon-style borders
- Girl: Soft vignette, blush overlay, petal particles floating
- Boy: Sharp frame edges, cinematic letterbox bars, film grain

Last photo: Holds for 2 seconds then fades to white/dark for transition.

Duration: ~4 seconds per photo, user-skippable

---

**SCREEN 6 — THE FINAL CELEBRATION**

Visual: Best photo (first in album, or user-designated) fills full screen with Ken Burns zoom. 

Overlays layered:
1. Balloon animation (Rive-based): 12 balloons in theme colors rise from bottom, each with micro-bobbing physics. Balloons have slight latex texture.
2. Confetti cannon bursts from corners (particle system, respects reduced-motion)
3. Wish message appears in Instrument Serif italic, centered, with soft glow
4. Star-burst animation: "{NAME}, wishing you a year full of..."
5. Music swells at this point (if volume was muted, nudge user with animation)

Duration: 10–15 seconds, then auto-loops or user taps to continue.

---

**SCREEN 7 — THE CTA**

Simple, honest, non-pushy:
```
"Made with WISHORA 🎂"
[Create a wish for your friend] — primary CTA
[Download WISHORA]           — secondary
```
Design: Minimal. Dark. One action. No cluttered text.

---

### 5.3 BIRTHDAY CONTACTS & CSV IMPORT

**Manual Add:**
- Name, Nickname, Relationship (Friend / Family / Colleague / Partner / Other)
- Date of Birth (day-month-year, year optional)
- Gender
- Phone/Email (optional, for notification delivery hint)
- Profile photo (optional)
- Note (optional, max 100 chars — "loves cats, hates loud music")

**CSV Import:**
- Required columns: `name`, `dob` (any format — auto-parsed), `gender`
- Optional recognized columns: `nickname`, `email`, `phone`, `relationship`, `note`
- Unknown columns: stored as key-value metadata in `contact_extra_fields` JSONB column
- Example CSV processing:
  ```
  name, dob, gender, department, employee_id
  Priya, 14/03/1995, female, Engineering, EMP-001
  ```
  → `department` and `employee_id` stored in extra_fields, shown in contact detail view
- Conflict resolution: if name+DOB already exists → prompt user: Update / Skip / Duplicate

**Notification System:**
- Per-contact settings: Notify X days before (options: Same day / 1 day / 3 days / 1 week / 2 weeks)
- Custom reminder message template per person (e.g., "Don't forget to wish Priya!")
- Daily digest mode: 8 AM daily notification listing all birthdays within user-set window
- Silent hours: do not disturb between 11PM–8AM

---

### 5.4 FOLDER SYSTEM & DRAFTS

**Folders:**
- Default folder: "My Wishes"
- User can create named folders (e.g., "Family", "Work", "College Friends")
- Folder has: name, cover color (from palette), wish count
- Drag-and-drop to move wishes between folders
- Folder sharing (future: share a folder publicly as a "team")

**Drafts:**
- Any incomplete wish creation auto-saves to Drafts on exit
- Drafts show progress indicator (which step completed)
- Drafts expire after 90 days with 7-day warning notification

**Wish States:**
```
draft → generated → scheduled → sent → opened → reacted
```

---

## SECTION 6 — DATABASE SCHEMA

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  google_id     TEXT UNIQUE,
  plan          TEXT DEFAULT 'free', -- 'free' | 'premium'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Birthday Contacts
CREATE TABLE contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  nickname        TEXT,
  dob_day         SMALLINT,
  dob_month       SMALLINT NOT NULL,
  dob_year        SMALLINT,
  gender          TEXT, -- 'male'|'female'|'nonbinary'|'child'|'unspecified'
  relationship    TEXT,
  email           TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  note            TEXT,
  extra_fields    JSONB DEFAULT '{}',
  notify_days     INT[] DEFAULT '{1, 3}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Folders
CREATE TABLE folders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#C8A96E',
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Wishes
CREATE TABLE wishes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  folder_id       UUID REFERENCES folders(id) ON DELETE SET NULL,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  slug            TEXT UNIQUE NOT NULL, -- short unique URL slug
  recipient_name  TEXT NOT NULL,
  recipient_dob   DATE NOT NULL,
  recipient_gender TEXT,
  wish_text       TEXT,
  wish_language   TEXT DEFAULT 'en',
  theme           TEXT DEFAULT 'auto', -- 'auto'|'candy'|'electric'|'rose'|'gold'|'cosmic'
  music_id        UUID REFERENCES music_tracks(id),
  custom_music_url TEXT,
  music_trim_start FLOAT,
  music_trim_end   FLOAT,
  status          TEXT DEFAULT 'draft', -- 'draft'|'generated'|'scheduled'|'sent'
  scheduled_for   TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  open_count      INT DEFAULT 0,
  last_opened_at  TIMESTAMPTZ,
  reaction_url    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Wish Photos
CREATE TABLE wish_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id     UUID REFERENCES wishes(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  caption     TEXT,
  sort_order  INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Music Library
CREATE TABLE music_tracks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  artist      TEXT,
  duration    INT, -- seconds
  genre       TEXT,
  mood_tags   TEXT[],
  storage_url TEXT NOT NULL,
  preview_url TEXT,
  is_premium  BOOLEAN DEFAULT FALSE
);

-- Wish Opens (analytics)
CREATE TABLE wish_opens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id     UUID REFERENCES wishes(id) ON DELETE CASCADE,
  ip_hash     TEXT, -- hashed for privacy
  country     TEXT,
  device_type TEXT,
  opened_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Queue
CREATE TABLE notification_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id) ON DELETE CASCADE,
  notify_at       TIMESTAMPTZ NOT NULL,
  message         TEXT,
  sent            BOOLEAN DEFAULT FALSE,
  sent_at         TIMESTAMPTZ
);
```

---

## SECTION 7 — API DESIGN

### Base URL: `https://api.wishora.app/v1`

**Auth:** Bearer token (Supabase JWT)

```
# Auth
POST   /auth/google          → exchange Google token, get app JWT
POST   /auth/refresh         → refresh token

# Contacts
GET    /contacts             → list with upcoming birthday sort
POST   /contacts             → create single
POST   /contacts/import      → bulk CSV import (multipart/form-data)
PUT    /contacts/:id         → update
DELETE /contacts/:id         → delete

# Wishes
GET    /wishes               → list (filter by folder, status)
POST   /wishes               → create (returns draft)
PUT    /wishes/:id           → update any field
DELETE /wishes/:id           → soft delete
POST   /wishes/:id/generate  → trigger link generation
POST   /wishes/:id/share     → get shareable link + preview metadata

# AI
POST   /ai/suggest-wish      → generate wish text suggestions
  body: { name, age, gender, language, relationship }
  response: [{ tone, message, emoji }]

# Music
GET    /music                → list library tracks
POST   /music/upload         → user uploads custom track (presigned S3)

# Public (no auth)
GET    /w/:slug              → get wish experience data
POST   /w/:slug/open         → log an open event (anonymous)
POST   /w/:slug/react        → submit reaction (video/voice blob URL)

# Folders
GET    /folders
POST   /folders
PUT    /folders/:id
DELETE /folders/:id

# Notifications
GET    /notifications/settings
PUT    /notifications/settings
```

---

## SECTION 8 — ANIMATION SPECIFICATION MATRIX

| Screen | Animation Engine | Key Technique | FPS Target | Reduced Motion Alt |
|--------|-----------------|---------------|------------|-------------------|
| Envelope drop | Flutter Physics | GravitySimulation + spring on tap | 60fps | Simple fade |
| Candle flame | CustomPainter | Perlin noise vertex displacement | 60fps | Static flame SVG |
| Mic blow detection | N/A | Amplitude threshold via mic stream | — | Tap fallback |
| Candle extinguish | Particle system | Emitter burst (smoke) + Lottie | 60fps | Instant hide |
| Journey timeline | Scroll physics | BouncingScrollPhysics + stagger | 60fps | Static list |
| Photo reveal | Blur animation | ImageFilter.blur from 12→0 | 60fps | Crossfade |
| Balloon physics | Rive | Spring + drift offset randomized | 60fps | Static balloons |
| Confetti | CustomPainter | Particle system with gravity+spin | 60fps | Static sparkle |
| Theme particles | CustomPainter | Ambient dot field, slow drift | 30fps | Disabled |
| Screen transitions | Hero animation | Shared element + fade bridge | 60fps | Simple crossfade |

---

## SECTION 9 — GENDER/AGE THEME MATRIX

| Segment | Age | Colors | Font Weight | Animation Style | Illustration Style |
|---------|-----|--------|-------------|-----------------|-------------------|
| Child | < 15 | Candy: green/yellow/pink | Bold 700 | Bouncy, rubber physics | Cartoon vector, thick outlines |
| Teen Girl | 15–18 | Lavender/Pink | Semi 600 | Sparkle-forward, dreamy | Anime-inspired, pastels |
| Woman | 19–45 | Rose Dusk: pink/gold | Regular 400 | Fluid, bloom particles | Modern editorial, flowers |
| Woman | 46+ | Warm Amber | Light 300 | Elegant, slow dissolve | Classic, refined |
| Teen Boy | 15–18 | Neon Blue/Green | Bold 700 | Sharp, energetic, glitch | Graffiti-edged, angular |
| Man | 19–45 | Electric Midnight: blue | Medium 500 | Cinematic, clean | Minimal, geometric |
| Man | 46+ | Timeless Gold | Regular 400 | Steady, dignified | Photography-forward |
| Non-binary | Any | Cosmic: purple/iridescent | Variable | Fluid, shape-morphing | Abstract, gradient |

---

## SECTION 10 — RESPONSIVE LAYOUT STRATEGY

```
Device breakpoints (Flutter):
- Compact:   < 600dp  → Mobile (primary design target)
- Medium:    600–840dp → Tablet / Foldable
- Expanded:  > 840dp  → Desktop / Web

Layout rules:
- Compact:   Single column. Bottom sheet modals. Tab bar at bottom.
- Medium:    Two-column on creation flow. Side panel for contacts.
- Expanded:  Three-column master-detail. Top navigation bar. Sidebar.

All animations scale by screen diagonal. Text scales via Flutter's MediaQuery textScaleFactor capped at 1.3.

Safe area: Always respect notches, Dynamic Island (iOS), cutouts (Android) using SafeArea widget.

Font size scaling:
- Display (countdown): clamp(48px, 12vw, 120px)
- Headline: clamp(28px, 5vw, 48px)
- Body: 16px fixed (never scale body on mobile — designer choice)
```

---

## SECTION 11 — PRIVACY & COMPLIANCE

- Recipient's experience link: wishora.app/w/{slug} — SLUG is non-guessable (nanoid 12 chars, 56M+ combinations)
- Photos stored encrypted at rest (Cloudflare R2 + AES-256)
- Open analytics: IP is SHA-256 hashed before storage — no raw IP retained
- GDPR: "Delete my account" removes all data within 30 days
- Children's privacy: If recipient age < 13, no tracking, no analytics stored
- Music uploads: User certifies ownership in upload flow; WISHORA is not liable (ToS clause)
- AI text generation: Wish text sent to Anthropic API — no PII beyond first name + age
- Shared links expire: 1 year after creation (user can manually extend)

---

## SECTION 12 — MONETIZATION

**Free Tier:**
- 1 active wish at a time
- Default music library (5 tracks)
- WISHORA watermark on experience
- Max 6 photos per wish
- Standard themes

**Premium (₹199/month or ₹1499/year):**
- Unlimited wishes
- Full music library (50+ tracks) + custom upload
- No watermark
- 12 photos per wish
- All themes + early access to new ones
- Advanced analytics (geo heatmap, device breakdown)
- Group wish collaboration
- Priority AI suggestions
- CSV import (free: 20 contacts, premium: unlimited)

**WISHORA Credits (one-time purchases):**
- Buy premium templates from creator marketplace
- Tip a template creator (30% to creator, 70% to WISHORA)

---

## SECTION 13 — COMPLETE ANTIGRAVITY SYSTEM PROMPT

Use the following as your master prompt when building WISHORA in Antigravity (or any AI-assisted development environment):

---

```
PROJECT: WISHORA — A cinematic birthday wish experience mobile app

PLATFORM: Flutter 3.x (Android, iOS, Web — shared codebase)
BACKEND: Node.js (TypeScript) + Fastify + PostgreSQL via Supabase
STORAGE: Cloudflare R2
AUTH: Supabase Auth with Google OAuth
AI: Anthropic Claude API (claude-sonnet-4-6) for wish text generation

DESIGN LANGUAGE:
Build with "Velvet Glass" design system. Dark base (#08080C). 
Gold accent (#C8A96E). Glass surfaces (backdrop blur, not drop shadows).
Typography: Clash Display (display) + Satoshi (body) + Instrument Serif (wish text).
ZERO generic SaaS card grids. ZERO all-caps labels. ZERO auto-parallax.
Every screen must feel handcrafted. Think CRED app meets Apple iOS Human Interface.
Motion: spring physics only. Stagger entrance (never simultaneous). Haptic on every tap.

ADAPTIVE THEMING:
Age < 15 → Candy World theme (cartoon, bright, bouncy)
Female 15–45 → Rose Dusk theme (pink/gold, bloom particles, editorial)
Male 15–45 → Electric Midnight theme (blue, cinematic, sharp)
Female 46+ → Warm Amber theme (elegant, slow)
Male 46+ → Timeless Gold (dignified, photography-forward)
Non-binary → Cosmic Purple (fluid, iridescent)

CORE SCREENS TO BUILD:
1. Onboarding (3 steps: cinematic welcome → permissions → Google sign-in)
2. Home (upcoming birthdays ribbon + creation grid + FAB)
3. Create Wish Flow (6-step multi-step bottom-sheet wizard)
4. Shared Wish Experience (7 sequential screens, no auth required)
   - Envelope animation → Countdown → Cake + mic blow → Journey timeline
   → Photo album → Final celebration → CTA
5. My Wishbook (folders + drafts + archive)
6. Contacts (birthday contacts list + manual add + CSV import)
7. Profile & Settings

CRITICAL INTERACTIONS:
- Mic-based candle blow: use amplitude detection, not speech recognition
- Photo album: detect faces (ML Kit), animate spotlight on face
- Music trim: waveform UI with draggable handles, real-time preview
- Countdown: real-time WebSocket sync, explodes at 00:00:00 on birthday day
- AI suggestions: streaming response from Claude API, show typing indicator

ANIMATIONS (all at 60fps):
- Envelope: GravitySimulation physics drop, spring on unseal
- Candles: CustomPainter Perlin-noise flame simulation
- Balloons: Rive, 12 balloons with spring physics + random drift
- Confetti: CustomPainter particle system with gravity + rotation
- Photo reveal: blur (ImageFilter) from 12px→0 over 800ms
- All transitions: Hero shared-element animations

STATE MANAGEMENT: Riverpod (Flutter)
ROUTING: go_router with deep link support for /w/:slug
OFFLINE: Cache contacts and drafts in Hive (local DB)

DATABASE TABLES: users, contacts, folders, wishes, wish_photos, music_tracks, wish_opens, notification_queue
(Full schema provided in system design document)

API ENDPOINTS: RESTful under /api/v1
Public endpoint: GET /w/:slug (no auth), POST /w/:slug/open, POST /w/:slug/react

NOTIFICATIONS: Firebase Cloud Messaging. Pre-birthday alerts (days configurable per contact).

RESPONSIVE: Compact < 600dp (mobile-first), Medium 600–840dp (tablet), Expanded > 840dp (desktop/web)

OUTPUT STANDARD:
- Every widget must have a const constructor where possible
- Use flutter_animate package for declarative animations
- All strings externalized (AppStrings class) for i18n
- Error states must have illustrated empty-state widgets (not generic text)
- Loading states: shimmer skeleton screens (shimmer package), never spinners alone
- Accessibility: all interactive elements min 48x48dp tap target, semantic labels

DO NOT:
- Use Material 2 widgets (use Material 3 with custom theme)
- Use Google Fonts package defaults without custom sizing
- Use any stock Lottie without referencing source (build custom or cite)
- Use SnackBar for errors (use custom toast from the bottom)
- Use AlertDialog for confirmations (use custom bottom sheet with spring animation)
- Use white backgrounds on any screen
- Use drop-down menus (replace with bottom-sheet pickers)
```

---

## SECTION 14 — LAUNCH ROADMAP

**Phase 1 — MVP (8 weeks):**
Create wish flow → Share link → Envelope + Cake + Album + Final Screen → Google Auth → Contacts (manual) → Push notifications

**Phase 2 — AI + Music (4 weeks):**
Claude AI integration → Music library + custom upload → CSV import → Drafts + Folders

**Phase 3 — Social + Premium (4 weeks):**
Reaction capture → Analytics dashboard → Freemium gating → Premium IAP → Group wishes

**Phase 4 — Growth (ongoing):**
Template marketplace → Occasion expansion → Web widget embed → Referral program

---

*WISHORA System Design v1.0*
*Developer : Souvik Sinhababu*
