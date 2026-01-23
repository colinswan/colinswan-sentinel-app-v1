# Sentinel App Features

## Overview

Sentinel is a cross-platform health enforcement system that **physically forces** users to take movement breaks by locking their computer screen and requiring a QR code scan (located away from the desk) to unlock.

---

## Core Features (Completed)

### Screen Lock Enforcement
- **Desktop lockdown mode**: Full kiosk mode that takes over the screen when timer expires
- **QR code unlock**: Must physically walk to checkpoint (e.g., fridge) and scan QR code
- **Real-time sync**: Desktop subscribes to Convex for instant lock/unlock state changes

### Device Pairing
- **6-digit pairing codes**: Desktop generates code, mobile enters it to link devices
- **5-minute expiry**: Codes auto-expire for security
- **Multi-device support**: One user can have multiple devices

### Timer System
- **Configurable work duration**: 15-90 minutes (default: 50 min)
- **Configurable break duration**: 5-30 minutes (default: 10 min)
- **Visual countdown**: Circular progress timer with session info

### Session Tracking
- **Session logging**: Records start/end times, duration, unlock method
- **Win log**: History of accomplishments from each session
- **Proper unlock tracking**: Distinguishes QR unlock vs emergency bypass

---

## AI Productivity Coach (Completed)

### User Profile System
Users complete onboarding to personalize AI coaching:

**Challenges** (multi-select):
- Procrastination
- Imposter syndrome
- Decision paralysis
- Perfectionism
- Distraction
- Overwork

**Motivation Style** (single-select):
- Tough love ("Stop making excuses")
- Encouraging ("You've got this!")
- Analytical ("Here's why this matters...")
- Collaborative ("Let's figure this out together")

**Personal Context**:
- Big picture goals (free text)
- Personal context (e.g., "I have ADHD")

### AI Coaching Modes
| Mode | Trigger | Behavior |
|------|---------|----------|
| Indecision Helper | User selects "I don't know" | Breaks down options, recommends action |
| Motivation Booster | Procrastination challenge | Energetic, action-focused language |
| Imposter Defense | Imposter syndrome challenge | Shows past wins, affirms belonging |
| Perfectionism Breaker | Perfectionism challenge | Emphasizes "done > perfect" |
| Overwhelm Reducer | Multiple tasks mentioned | Helps narrow to ONE thing |

### Coaching Types
- **Procrastinating**: Help start with micro-action
- **Stuck**: Break down the problem
- **Doubting**: Counter imposter syndrome
- **Overwhelmed**: Simplify and prioritize
- **Unfocused**: Redirect to goal
- **Motivation**: Quick energy boost

### Pre-Session Coaching
- Goal input before starting session
- "Help me decide" flow for indecisive users
- AI suggests tasks based on context

### Post-Session Feedback
- "Gatekeeper" accountability prompt before unlock
- AI analyzes accomplishments
- Feedback stored in win log

---

## Project System (Completed)

### Project Management
- Create multiple projects with descriptions
- Set active project for context
- Per-project settings and goals

### Project Coaching Modes
| Mode | AI Personality | Use Case |
|------|----------------|----------|
| Default | Balanced | General work |
| Startup Mode | Urgent, shipping-focused | MVPs, deadlines |
| Learning Mode | Patient, educational | Skill building |
| Maintenance Mode | Steady, low-pressure | Bug fixes, upkeep |
| Creative Mode | Exploratory, open | Design, ideation |

### Task/Kanban Board
- Tasks per project: To Do, In Progress, Done
- Drag-and-drop task management
- Task context available to AI

---

## Health Dashboard (Completed)

### Movement Health Metrics
- **Sitting streaks**: Longest time between breaks
- **Movement breaks per day**: Track compliance
- **DVT risk score**: Based on sedentary time
- **Break compliance rate**: Percentage of proper unlocks

### Session Analytics
- Sessions completed per day/week
- Average session length
- Most productive times
- Goal completion rate

### Accountability Metrics
- Win log (all accomplishments)
- AI feedback history
- Emergency unlock count

---

## Emergency Override (Completed)

### Hidden Panic Button
- Tap top-left corner 5 times to reveal
- Type confirmation phrase: "I understand this defeats the purpose"
- All emergency unlocks are logged

### Dev Mode
- `Cmd+Shift+Escape` for instant unlock
- Grace period on startup (3 seconds)
- DEV MODE banner visible

---

## Lock Screen Features (Completed)

### Dynamic Messages
- Rotating motivational messages
- Custom message management
- Context-aware (shows current task)

### Visual Design
- Full-screen takeover
- QR code display for scanning
- Animated pulsing attention grabber

---

## Platform Support

### Desktop (Electron)
- macOS (Apple Silicon + Intel)
- Windows
- Linux (AppImage)

### Mobile (PWA)
- iOS Safari (Add to Home Screen)
- Android Chrome
- Any modern mobile browser

---

## Planned Features (Next Phase)

### Break Timer
- [ ] Enforce minimum rest after unlock
- [ ] "Break mode" countdown
- [ ] Gentle reminders to return

### Smart Reminders
- [ ] Proactive AI nudges during session
- [ ] "You've been stuck for 10 minutes" detection
- [ ] Sentiment-based check-ins

### Calendar Integration
- [ ] Google Calendar / Outlook sync
- [ ] Auto-detect meetings
- [ ] Silent mode during meetings
- [ ] Smart break scheduling between meetings

### Session-to-Task Linking
- [ ] Track time per task
- [ ] Auto-complete tasks when session ends
- [ ] Task-based analytics

---

## Architecture

```
sentinel-app/
├── backend/          # Convex backend (source of truth)
│   └── convex/       # Schema, queries, mutations, actions
├── desktop/          # Electron + React + TypeScript
│   └── src/
│       ├── main/     # Main process (window control)
│       ├── preload/  # IPC bridge
│       └── renderer/ # React app
└── mobile/           # Next.js PWA
    └── app/          # Pages (dashboard, scan, pair)
```

### Data Flow
```
Desktop Timer → Convex (lock) → Desktop subscribes → Enters kiosk mode
                                     ↓
Mobile scans QR → Convex (unlock) → Desktop subscription fires → Exits kiosk
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Convex (real-time database, serverless functions) |
| Desktop | Electron + React + TypeScript (electron-vite) |
| Mobile | Next.js 16 PWA + React + TypeScript |
| Styling | Tailwind CSS |
| AI | OpenAI API (gpt-4o-mini) via Convex Actions |
| Auth | Simple device pairing (6-digit codes) |
