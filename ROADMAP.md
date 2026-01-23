# Sentinel Roadmap

## Vision

**Sentinel is not two apps merged. It's one app with a unique advantage: the forced break.**

Most productivity apps are easy to ignore. You can close Notion. You can dismiss a reminder. But you **cannot ignore a locked screen** that requires you to physically walk to another room.

**The break IS the feature.** It's the moment of maximum leverage where:

- You can't keep spiraling on pointless work
- You have a natural checkpoint to reflect
- The AI has your full attention
- You've physically moved, changing your mental state

The kanban and tasks exist to give the AI **context**. The coaching happens at the break. It's all connected.

### Target User Challenges

- **Post-thrombotic syndrome / DVT risk** - Needs enforced movement, not optional reminders
- **Decision paralysis** - Struggles to pick what to work on
- **Imposter syndrome** - Needs evidence of progress and encouragement
- **Productive procrastination** - Reorganizes tasks instead of doin
- g them

### Design Reference: LookAway

[LookAway](https://lookaway.app) is the gold standard for macOS break enforcement UX. Key lessons:

**What LookAway does well (adopt):**

- Smart Pause (mic detection, screen sharing, typing deferral)
- Polite interruption (countdown before lock, blur overlay)
- Enforcement gradient (Casual → Balanced → Hardcore)
- Idle tracking (reset timer if user walks away)
- Clean settings UI with grouped sections

**Where Sentinel differs (our edge):**

- LookAway lock screen = rest. Sentinel lock screen = **review + physical challenge**
- LookAway is passive. Sentinel requires **QR scan + calf raises**
- LookAway has no project/task management. Sentinel does.
- LookAway has no AI coaching. Sentinel does.

**The rule:** Be as polite as LookAway about _when_ to interrupt. Be ruthless about _what_ you must do once interrupted.

---

## Completed Features

### Core System

- [x] Convex backend with real-time sync
- [x] Desktop Electron app with timer
- [x] Mobile PWA with QR scanner
- [x] Device pairing (6-digit codes)
- [x] Multi-monitor lockdown support

### Lock/Unlock Flow

- [x] Kiosk mode lockdown when timer expires
- [x] QR code unlock at physical checkpoint
- [x] Emergency override (5 taps + confirmation phrase)
- [x] Dynamic lock screen messages
- [x] Dev mode escape hatch (Cmd+Shift+Escape)

### AI Productivity Coach

- [x] User profile onboarding (challenges, motivation style)
- [x] Pre-session goal input
- [x] Post-session AI feedback (Gatekeeper)
- [x] In-session coaching panel (6 help types)
- [x] Personalized AI responses based on profile
- [x] Win log (past accomplishments)

### Project System

- [x] Create/edit projects
- [x] Per-project coaching modes (ship_fast, learning, maintenance, creative)
- [x] Active project selection
- [x] Project-aware AI coaching
- [x] Project stats (tasks, time, completion rate)

### Task/Kanban Board

- [x] Custom kanban columns (add, edit, delete, reorder)
- [x] Default columns: To Do, In Progress, Done
- [x] Create/edit/delete tasks
- [x] Move tasks between columns
- [x] Task priorities (high/medium/low)
- [x] Session tracking per task

### Health Dashboard

- [x] DVT risk score calculation
- [x] Session history visualization
- [x] Movement break tracking
- [x] Sitting streak monitoring

### Distribution

- [x] macOS build (ZIP for Apple Silicon + Intel)
- [x] Windows build (EXE)
- [x] Linux build (AppImage)
- [x] Landing page with downloads
- [x] GitHub Actions CI/CD

---

## Priority Implementation Queue

### P-1: Passive Enforcement & Onboarding (IN PROGRESS)

**Status:** In Progress
**Why:** The app should be "set and forget" - launch at startup, auto-lock after sitting too long. Without this, users must remember to start sessions manually, defeating the purpose.

**Setup Checklist (Timer Screen):**

- [x] Show setup status card when device not paired
- [x] Visual checklist: Account created, Phone paired, QR checkpoint
- [x] Link to pairing flow from checklist
- [ ] Dismissible after setup complete

**Auto-Start on Login:**

- [ ] macOS: Register as Login Item via Electron
- [x] Setting toggle in Settings → General
- [x] Default: enabled for new users

**Auto-Start Timer on Launch:**

- [x] Automatically begin countdown when app opens
- [x] Setting toggle in Settings → General
- [x] Configurable default duration (default: 60 mins)
- [x] Default: enabled
- [x] Show subtle notification: "Session started automatically"

**Background/Menu Bar Mode (Future):**

- [ ] App runs in system tray/menu bar
- [ ] Minimal UI until lock screen
- [ ] Quick access to meeting mode, timer status

---

### P0: Smart Pause System (CRITICAL - Business Survival)

**Status:** Not Started
**Why:** If Sentinel locks during a client call or while you're typing, you will uninstall it.

**Manual Meeting Mode (MVP):**

- [ ] Add `meetingModeUntil` timestamp to device/user
- [ ] System tray button: "Meeting Mode" with duration options (30m, 1h, 2h)
- [ ] Skip auto-lock while meeting mode active
- [ ] Visual indicator in UI showing meeting mode is on
- [ ] Auto-expire after duration

**Auto-Detection (Phase 2):**

- [ ] Microphone active detection → auto-pause timer
- [ ] Screen sharing detection → auto-pause timer
- [ ] Cooldown after smart pause ends (1 minute grace period)

**Typing Deferral:**

- [ ] If last keypress < 2 seconds ago, delay lock by 10 seconds
- [ ] Prevents interrupting mid-sentence

### P1: Polite Lock (The "LookAway" UX)

**Status:** In Progress
**Why:** Jarring black screen feels aggressive. Polite interruption = users keep using the app.

**Pre-Lock Countdown:**

- [x] Show 10-second countdown overlay with animated arrow (LookAway-style)
- [x] Overlay appears on top of ALL windows, not just within app
- [x] Click-through so user can keep working
- [ ] Configurable duration (5s, 10s, 15s) - currently hardcoded to 10s
- [x] Allows user to finish their thought

**Blur Overlay:**

- [ ] Replace black screen with blurred screenshot of desktop
- [ ] Feels like "pause" not "removal"
- [ ] Session stats overlaid on blur: "You worked on [Task] for 50m"
- [ ] QR code + instructions overlaid

**Overtime Nudge:**

- [ ] If user continues past scheduled break, show subtle "45 minutes without a break" indicator
- [ ] Shake to dismiss (or click)

### P2: Unlock Gating (Core Behavior Fix)

**Status:** Completed
**Why:** Currently desktop unlocks on QR scan. Must gate behind accountability.

Current flow (weak):

```
Scan QR → Desktop Unlocks
```

New flow (bulletproof):

```
Scan QR (proves location)
  → Mobile: "Did you finish [Task Name]?" (Done / In Progress / Blocked)
  → Mobile: "Physical challenge complete?" (checkbox)
  → Server receives "complete" signal
  → Desktop unlocks
```

- [x] Rewrite unlock flow - mobile form submission required BEFORE unlock
- [x] Add "session review" screen on mobile after QR scan
- [x] Task status selection: Done / In Progress / Blocked
- [x] Physical challenge checkbox (calf raises)
- [x] Desktop waits for Convex signal, not just QR scan event
- [ ] Done → log to win log, ask "What's next?" (partial - logs but no "what's next")
- [ ] In Progress → "How much longer?" (helps estimation)
- [ ] Blocked → "Why?" (Tech issue / Scope creep / Fatigue) → AI suggests easier task

### P3: Session Commitment (Prevent Drift)

**Status:** Not Started
**Why:** Without commitment, you can "work" without actually doing anything.

- [ ] Cannot start timer without selecting ONE task
- [ ] Selected task shown prominently during session (always visible)
- [ ] "Abort Session" button with friction:
  - Requires reason (text input)
  - 2-minute cooldown timer (stare at "Resetting..." screen)
- [ ] Inbox note capture (quick thoughts without opening board)

### P4: Estimation Field (Stagnation Detection)

**Status:** Not Started
**Why:** Simple math beats magic AI. `Time_Spent - Time_Estimated = Delta`

- [ ] Add `estimatedSessions` integer field to tasks
- [ ] Prompt for estimate when creating task: "How many sessions? (1 session = 50 min)"
- [ ] Track `sessionsSpent` per task (auto-increment on session complete)
- [ ] AI intervention when `sessionsSpent > estimatedSessions`:
  - "You estimated 2 sessions. You're on session 4. Are you stuck or did you underestimate?"
  - Options: [Stuck - break it down] [Underestimated] [Scope creep - cut scope]

### P5: Board Lock During Session (Prevent Productive Procrastination)

**Status:** Not Started
**Why:** Reorganizing tasks feels like work but isn't.

- [ ] Disable drag-and-drop while timer active
- [ ] Disable task editing while timer active
- [ ] Disable column management while timer active
- [ ] Allow ONLY:
  - View current task
  - "Inbox Note" quick capture (separate list, process later)
- [ ] Visual indicator: "Planning locked during session"
- [ ] Board unlocks when timer stops (break time = planning time)

### P6: Physical Challenge (Medical Necessity)

**Status:** Phase 1 Complete
**Why:** Walking to kitchen is passive. Calf muscle pump needs active contraction for PTS/DVT prevention.

**Phase 1 (MVP - Checkbox):**

- [x] Checkbox on mobile unlock screen: "I completed 15 calf raises"
- [x] Required before unlock signal sent
- [ ] Configurable exercise and rep count (currently hardcoded to 15)

**Phase 2 (Verified - Accelerometer):**

- [ ] Accelerometer detection of vertical oscillation
- [ ] Count actual calf raises (phone in hand or pocket)
- [ ] Verified counter: "12/15 calf raises detected"

### P7: Enforcement Gradient

**Status:** Not Started
**Why:** New users need onboarding. Hardcore mode from day 1 = uninstall.

Three modes (like LookAway):

- [ ] **Casual**: Emergency unlock always available, no physical challenge required
- [ ] **Balanced**: 5-second wait before emergency unlock appears, physical challenge is checkbox
- [ ] **Hardcore**: No emergency unlock, physical challenge verified by accelerometer

- [ ] Default new users to Balanced
- [ ] Suggest Hardcore after 1 week of consistent use
- [ ] Allow per-project override (Hardcore for "Ship Fast" projects)

### P8: Idle Tracking

**Status:** Not Started
**Why:** If user walks away naturally, don't punish them when they return.

- [ ] Detect mouse/keyboard inactivity
- [ ] Pause timer after 1 minute of inactivity
- [ ] Reset timer after 5 minutes of inactivity (assume natural break taken)
- [ ] Configurable thresholds
- [ ] Resume timer when activity detected (with notification)

---

## Planned Features (After P0-P8)

### Wellness Reminders (LookAway-inspired)

- [ ] Blink reminder: Subtle eye icon every 10 minutes (dry eye prevention)
- [ ] Posture reminder: "Sit up straight" nudge every 15 minutes
- [ ] Dim screen when showing reminders
- [ ] Sound effects (optional)
- [ ] Don't show during smart pause

### Break Timer

- [ ] Enforce minimum rest period after unlock (e.g., 5 minutes before next session)
- [ ] Break countdown timer on desktop
- [ ] "Break mode" screen with stretching suggestions
- [ ] Configurable break duration

### Calendar Integration (Auto Meeting Mode)

- [ ] Google Calendar sync
- [ ] Outlook Calendar sync
- [ ] Auto-detect meetings → auto smart pause
- [ ] Smart break scheduling between meetings

### Decision Paralysis Helper

- [ ] "Pick for me" button when starting session
- [ ] AI selects task based on: priority, deadline, value rating, estimated sessions remaining
- [ ] Removes choice anxiety completely

### Analytics & Insights

- [ ] Weekly productivity reports
- [ ] Best productive hours analysis
- [ ] Estimation accuracy tracking ("You underestimate by 40% on average")
- [ ] AI-generated insights

---

## Future Ideas (Backlog)

- [ ] Value tagging on tasks (high-value vs maintenance vs rabbit-hole-risk)
- [ ] Team/accountability partner features
- [ ] Pomodoro mode option (25/5 instead of 50/10)
- [ ] Website/app blocking during sessions
- [ ] Apple Watch / wearable integration (HR-based break suggestions)
- [ ] Custom checkpoint QR codes (multiple locations)
- [ ] Force longer breaks after 3+ hours continuous work (medical necessity)
- [ ] Voice commands for hands-free control
- [ ] iPhone Screen Time API integration (block phone apps during desktop lock)
- [ ] Deep focus apps whitelist (don't interrupt in specific apps)
- [ ] Long breaks: "Every 4th break is 15 minutes"
- [ ] Office hours (only enforce during set times)

---

## Recently Completed

- [x] Pre-lock countdown overlay (LookAway-style animated arrow)
- [x] Unlock gating - task status + accountability note required
- [x] Physical challenge checkbox (calf raises on mobile unlock)
- [x] Auto-start timer on app launch
- [x] Setup checklist on Timer screen
- [x] Streamlined onboarding (skip profile setup, move to Settings)
- [x] AI coaching profile in Settings → Coaching Style
- [x] Custom kanban columns (add/edit/delete/reorder)
- [x] Column-based task system (replaces hardcoded status)
- [x] AI coaching field fixes
- [x] Multi-monitor lockdown
- [x] macOS build reliability (DMG → ZIP)
- [x] Convex URL build configuration

---

## Architecture Notes

### The "Gatekeeper" Flow

```
Planning Mode (Timer Off)
  → Organize tasks, set estimates, prioritize
  → Board is fully editable

Commitment (Timer Start)
  → Must select ONE task
  → Board locks
  → Enforcement mode applies (Casual/Balanced/Hardcore)

Execution (Timer Running)
  → Board read-only
  → Inbox notes only
  → Committed task visible
  → Idle tracking active

Pre-Lock (Timer < 10 seconds)
  → Countdown overlay: "Locking in 10..."
  → Typing deferral: wait if actively typing

Lock (Timer Expires)
  → Blur overlay (not black screen)
  → Session stats shown
  → QR code + instructions
  → Must go to checkpoint

Review (Mobile Unlock Flow)
  → QR scan proves location
  → Session review: Done/In Progress/Blocked
  → Physical challenge (calf raises)
  → AI coaching based on response

Unlock (Desktop)
  → Only after mobile form complete
  → Next task ready based on answers
  → Break timer starts (optional)
```

### Key Principles

1. **Polite then ruthless** - Be polite about _when_ to interrupt. Be ruthless about _what_ you must do.
2. **Math over magic** - Use estimation deltas, not AI prediction models
3. **Friction as feature** - Abort costs 2 minutes, meeting mode is manual
4. **Physical enforcement** - Can't ignore locked screen or skip calf raises
5. **Context is king** - AI is only useful because it knows your tasks/goals
6. **Progressive enforcement** - Start Casual, graduate to Hardcore

### UI/UX Design Guidelines (LookAway-inspired)

- Dark theme: `#0a0a0b` background, zinc grays
- Accent gradients: Pink/orange/purple for mode selection cards
- Clean sidebar navigation with grouped sections
- Toggle switches: Blue when active
- Visual previews for settings that affect appearance
- Subtle animations, nothing jarring
- Blur effects for overlays (feels like pause, not removal)
