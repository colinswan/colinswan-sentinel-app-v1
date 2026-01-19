# Sentinel - Health Enforcement System

A cross-platform health enforcement system that forces physical movement breaks by locking your computer screen and requiring you to physically walk to a checkpoint (QR code) to unlock it.

Built for people with medical conditions (HME, DVT history) who cannot rely on willpower alone to take regular movement breaks.

## Architecture

```
sentinel-app/
├── backend/     # Convex backend (real-time sync)
├── mobile/      # Next.js 16 PWA (the "Key")
└── desktop/     # Electron app (the "Lock")
```

## Quick Start

### 1. Set Up Convex Backend

```bash
cd backend
npm install
npx convex dev
```

This will:
- Create a Convex project (requires login)
- Deploy your schema and functions
- Give you a deployment URL

### 2. Set Up Mobile PWA

```bash
cd mobile
npm install

# Create .env.local with your Convex URL
echo "NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud" > .env.local

npm run dev
```

Open http://localhost:3000 on your phone (or use ngrok for testing).

### 3. Set Up Desktop App

```bash
cd desktop
npm install

# Create .env with your Convex URL
echo "VITE_CONVEX_URL=https://your-project.convex.cloud" > .env

npm run dev
```

## How It Works

### Setup Flow
1. Launch the desktop app and enter your name
2. A pairing code appears - enter it on your phone
3. Both devices are now linked

### Work Session
1. Start a timer on the desktop (default: 50 minutes)
2. When the timer expires, the screen locks in kiosk mode
3. Walk to your checkpoint (e.g., fridge with QR code)
4. Scan the QR code with the mobile app
5. Desktop unlocks, ready for the next session

## QR Code Setup

Print a QR code containing the text: `sentinel-checkpoint-fridge`

Tape it somewhere that requires you to walk (fridge, mailbox, bathroom, etc.)

Free QR code generators:
- https://www.qr-code-generator.com/
- https://www.the-qrcode-generator.com/

## Configuration

### Work/Break Duration
Set during initial setup, or modify in the Convex database:
- `workDurationMins`: Default 50 minutes
- `breakDurationMins`: Default 10 minutes

### Convex URLs
Both apps need the same Convex deployment URL:
- Mobile: `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
- Desktop: `VITE_CONVEX_URL` in `.env`

## Building for Production

### Mobile (Deploy to Vercel)
```bash
cd mobile
npm run build
# Deploy the .next folder to Vercel
```

### Desktop (Build macOS App)
```bash
cd desktop
npm run build:mac
# Output: dist/Sentinel-*.dmg
```

For distribution outside the Mac App Store, you'll need:
- Apple Developer ID certificate
- Notarization (configure in package.json build settings)

## Tech Stack

- **Backend**: Convex (real-time database, TypeScript functions)
- **Mobile**: Next.js 16, React 19, Tailwind CSS, html5-qrcode
- **Desktop**: Electron, React 18, Tailwind CSS, electron-vite

## Security Notes

- The desktop lockdown uses Electron's kiosk mode
- On macOS, it hides the dock and covers all workspaces
- The lock can technically be bypassed (force quit), but the goal is to create friction, not be unbreakable
- For medical compliance, the psychological barrier is usually sufficient

## Future Features (Phase 2)

The schema supports these planned features:
- **Accountability Log**: "What did you accomplish?" prompt before unlock
- **AI Coach**: OpenAI integration for motivational feedback
- **Multiple Checkpoints**: Database-driven checkpoint locations
- **Session Statistics**: Track compliance rate over time
- **Clerk Auth**: Replace device pairing with proper authentication

## License

MIT
