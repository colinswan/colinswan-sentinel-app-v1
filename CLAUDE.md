# CLAUDE.md

This file provides context for AI assistants working on the Sentinel codebase.

## Project Overview

**Sentinel** is a productivity and health enforcement system that PHYSICALLY forces users to take movement breaks by locking their computer screen and requiring a QR code scan (located away from the desk) to unlock.

### The Problem We Solve
Apps like LookAway are easy to ignore—users just wait out the timer and dismiss. For someone with health constraints (HME, DVT risk) or productivity challenges (imposter syndrome, procrastination), **willpower alone doesn't work**.

### Our Solution
- **The Hook**: Forced movement via QR code unlock (can't be ignored)
- **The Value**: AI mentor that knows your projects, goals, and psychology

### Target User
- Developers/knowledge workers who sit too long
- People with health conditions requiring regular movement (HME, DVT risk)
- Those struggling with procrastination, imposter syndrome, or focus issues

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Convex (real-time database, serverless functions) |
| **Desktop App** | Electron + React + TypeScript (electron-vite) |
| **Mobile App** | Next.js 16 PWA + React + TypeScript |
| **Styling** | Tailwind CSS |
| **AI** | OpenAI API (gpt-4o-mini) via Convex Actions |
| **Auth** | Simple device pairing (6-digit codes) |

## Project Structure

```
sentinel-app/
├── backend/                    # Convex backend (SOURCE OF TRUTH)
│   └── convex/
│       ├── schema.ts           # Database schema
│       ├── devices.ts          # Device lock/unlock mutations
│       ├── users.ts            # User management
│       ├── sessions.ts         # Work session tracking + health metrics
│       ├── pairing.ts          # Device pairing logic
│       ├── messages.ts         # Lock screen messages
│       ├── userProfiles.ts     # AI coaching preferences
│       └── ai.ts               # AI actions (coaching, feedback)
│
├── desktop/                    # Electron desktop app
│   └── src/
│       ├── main/index.ts       # Main process (window control, IPC)
│       ├── preload/index.ts    # IPC bridge to renderer
│       └── renderer/
│           ├── src/
│           │   ├── App.tsx     # Main app component
│           │   ├── screens/    # Timer, Locked, Setup, Profile, Health
│           │   └── components/ # CoachPanel, etc.
│           └── convex/         # SYNCED from backend/convex
│
├── mobile/                     # Next.js PWA mobile app
│   ├── app/
│   │   ├── page.tsx            # Dashboard
│   │   ├── scan/page.tsx       # QR scanner + accountability
│   │   └── pair/page.tsx       # Device pairing
│   ├── components/
│   │   └── QRScanner.tsx       # Camera QR scanner
│   └── convex/                 # SYNCED from backend/convex
│
└── CLAUDE.md                   # This file
```

## Common Commands

### Backend (Convex)

All Convex commands run from `backend/` directory:

```bash
cd backend

# Development (watches for changes)
npx convex dev

# Deploy once (no watch)
npx convex dev --once

# View dashboard
npx convex dashboard
```

**Environment Variables** (set in Convex dashboard):
- `OPENAI_API_KEY` - Required for AI features

### Desktop (Electron)

All desktop commands run from `desktop/` directory:

```bash
cd desktop

# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Build macOS app
npm run build:mac
```

**Environment Variables** (`.env` file):
- `VITE_CONVEX_URL` - Convex deployment URL

### Mobile (Next.js PWA)

All mobile commands run from `mobile/` directory:

```bash
cd mobile

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

**Environment Variables** (`.env.local` file):
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL

### Syncing Convex Files

**IMPORTANT**: The `convex/` folder in `desktop/src/renderer/` and `mobile/` are COPIES of `backend/convex/`. After modifying backend Convex files, sync them:

```bash
# Sync to mobile
cp backend/convex/*.ts mobile/convex/
cp -r backend/convex/_generated/* mobile/convex/_generated/

# Sync to desktop
cp backend/convex/*.ts desktop/src/renderer/convex/
cp -r backend/convex/_generated/* desktop/src/renderer/convex/_generated/
```

Always run `npx convex dev --once` in backend first to regenerate types.

## Architecture Patterns

### State Flow

```
Desktop Timer → Convex (lock) → Desktop subscribes → Enters kiosk mode
                                     ↓
Mobile scans QR → Convex (unlock) → Desktop subscription fires → Exits kiosk
```

### Key Convex Patterns

1. **Queries** - Real-time subscriptions (React `useQuery`)
2. **Mutations** - State changes (React `useMutation`)
3. **Actions** - External API calls like OpenAI (React `useAction`)

### Desktop Electron Architecture

- **Main Process** (`main/index.ts`): Window control, IPC handlers, system tray
- **Preload** (`preload/index.ts`): Exposes safe APIs via `window.sentinelAPI`
- **Renderer** (`renderer/`): React app with Convex subscriptions

### Lockdown Mode (macOS)

```typescript
// Enter lockdown
win.setKiosk(true);
win.setAlwaysOnTop(true, "screen-saver");
win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
win.setClosable(false);
```

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts with work/break duration settings |
| `devices` | Desktop/mobile devices, lock status, pairing codes |
| `sessions` | Work sessions with start/end times, notes, AI feedback |
| `userProfiles` | AI coaching preferences (challenges, motivation style) |
| `lockMessages` | Custom messages shown on lock screen |
| `emergencyUnlocks` | Log of emergency bypasses |
| `projects` | Project containers with goals, coaching modes, settings |
| `tasks` | Kanban tasks within projects (todo/in_progress/done) |

### Key Fields

**devices.status**: `"locked"` | `"unlocked"` - Desktop subscribes to this

**userProfiles.challenges**: Array of `"procrastination"` | `"imposter_syndrome"` | `"decision_paralysis"` | `"perfectionism"` | `"distraction"` | `"overwork"`

**userProfiles.motivationStyle**: `"tough_love"` | `"encouraging"` | `"analytical"` | `"collaborative"`

## AI System

### AI Actions (in `ai.ts`)

| Action | Purpose |
|--------|---------|
| `analyzeNote` | Post-session feedback on accomplishments |
| `suggestTask` | Pre-session task suggestions |
| `getCoachingHelp` | In-session coaching (stuck, procrastinating, doubting, etc.) |
| `getProactiveCheckIn` | Timed check-ins during session |

### AI Personalization

AI prompts are built dynamically based on:
1. `userProfiles.motivationStyle` - Tone (tough love vs encouraging)
2. `userProfiles.challenges` - What to be sensitive to
3. `userProfiles.personalContext` - Free text context
4. `userProfiles.bigPictureGoal` - Connect feedback to goals

### Coaching Types

- `procrastinating` - Help start with micro-action
- `stuck` - Break down the problem
- `doubting` - Counter imposter syndrome
- `overwhelmed` - Simplify and prioritize
- `unfocused` - Redirect to goal
- `motivation` - Quick energy boost

## Code Style

### TypeScript

- Use explicit types for function parameters and returns
- Use `Id<"tableName">` for Convex document IDs
- Prefer `const` over `let`

### React

- Functional components only
- Custom hooks in `hooks/` directory
- Screen components in `screens/` directory

### Tailwind CSS

- Use zinc color palette for dark theme
- Use green for positive/success states
- Use red for locked/error states
- Use amber for warnings and AI coach elements

### Convex Functions

```typescript
// Query pattern
export const getStatus = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    return device?.status;
  },
});

// Mutation pattern
export const lock = mutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deviceId, { status: "locked" });
  },
});

// Action pattern (external APIs)
export const analyzeNote = action({
  args: { note: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/...");
    return { feedback: "..." };
  },
});
```

## Development Workflows

### Adding a New Convex Function

1. Add function to appropriate file in `backend/convex/`
2. Run `npx convex dev --once` in backend
3. Sync files to mobile and desktop (see commands above)
4. Use in React with `useQuery`, `useMutation`, or `useAction`

### Adding a New Screen (Desktop)

1. Create component in `desktop/src/renderer/src/screens/`
2. Add screen type to `AppState` in `App.tsx`
3. Add case to `renderScreen()` switch
4. Add navigation handler if needed

### Adding a New AI Coaching Type

1. Add type to `CoachingType` union in `ai.ts`
2. Add prompt in `buildCoachingPrompt()` function
3. Add fallback response in `getCoachingHelp` handler
4. Add button in `CoachPanel.tsx`

### Testing QR Unlock Flow

1. Start desktop app (`cd desktop && npm run dev`)
2. Start mobile app (`cd mobile && npm run dev`)
3. Use ngrok for HTTPS: `ngrok http 3000`
4. Open ngrok URL on phone
5. Pair devices with 6-digit code
6. Start session on desktop, wait for lock
7. Scan QR code with phone to unlock

## Current Feature Status

### ✅ Completed

- [x] Convex backend with schema
- [x] Desktop Electron app with timer + lockdown
- [x] Mobile PWA with QR scanner
- [x] Device pairing flow
- [x] Pre-session goal input
- [x] Post-session AI feedback (Gatekeeper)
- [x] In-session AI coach panel
- [x] User profile onboarding
- [x] Health dashboard (DVT risk)
- [x] Emergency override
- [x] Dynamic lock messages
- [x] Win log (past accomplishments)
- [x] **Project system** (create, switch, per-project settings)
- [x] **Task/Kanban board** per project (To Do → In Progress → Done)
- [x] **Project-aware AI** (knows current project, tasks, goals)

### 🚧 Planned (Next Phase)

- [ ] Break timer (enforce rest after unlock)
- [ ] Smart reminders (proactive AI nudges)
- [ ] Calendar integration (meeting detection)
- [ ] Session-to-task linking (track time per task)

## Domain Terminology

| Term | Meaning |
|------|---------|
| **Sentinel** | The app name - a "guardian" that enforces breaks |
| **Lockdown** | When desktop enters kiosk mode after timer expires |
| **Checkpoint** | Physical QR code location (e.g., kitchen fridge) |
| **Gatekeeper** | The accountability prompt before unlocking |
| **Win Log** | History of accomplishments shown during unlock |
| **DVT Risk Score** | Calculated health metric based on sitting patterns |
| **Session** | A work period between unlock and next lock |

## Health Context

The primary user has:
- **HME** (Hereditary Multiple Exostoses) - requires regular movement
- **History of DVT** (Deep Vein Thrombosis) - cannot sit for extended periods

This is why the forced movement feature is critical, not just nice-to-have.

## Troubleshooting

### Desktop stuck in locked state after restart
The lock state is stored in Convex. Go to Convex dashboard and set `devices.status` to `"unlocked"`.

### Mobile camera not working
Mobile browsers require HTTPS for camera access. Use ngrok or deploy to Vercel.

### Convex types not updating
Run `npx convex dev --once` in backend, then sync `_generated/` folder to mobile and desktop.

### Emergency unlock
- **Dev mode**: Press `Cmd+Shift+Escape`
- **Production**: Tap top-left corner 5 times, type "I understand this defeats the purpose"
