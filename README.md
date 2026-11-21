# 🎵 SOMLENG (សំឡេង) — PWA Music Player with SQLite Track Library (Nuxt 3)

A responsive, mobile-first music Progressive Web App (PWA) built with **Nuxt 3**, **SQLite 3 (WebAssembly + IndexedDB)**, **Pinia**, **Tailwind CSS**, and the **YouTube IFrame API**.

---

## ✨ Features

- **Progressive Web App (PWA)**:
  - Installable on iOS, Android, macOS, and Windows desktop with standalone mode.
  - Service worker caching (`sw.js`) for offline shell and asset delivery.
  - Web App Manifest (`manifest.webmanifest`) with custom branding and icons.
- **SQLite Track Library**:
  - WebAssembly-powered SQLite database (`sql.js`) with persistent binary storage in browser IndexedDB.
  - **Downloads Menu**: dedicated tab to save, view, play, and manage track metadata locally.
  - **Export & Import**: Download your SQLite database as `.sqlite` file and restore backups anytime.
  - **Interactive SQL Console**: Run live SQL queries (`SELECT * FROM downloads;`) directly inside the app.
  - Track audio is streamed from YouTube; audio files are not downloaded or stored offline.
- **Custom Logo & Design System**:
  - Custom vector logo matching `media_1795250353327_39b6ecdf.jpg`: mechanical gear with music note, sound frequency bars, audio wave ribbon, and equalizer sliders badge.
  - Harmonized with the application brand color system (Rose `#f43f5e`, Neon Cyan `#06b6d4`, Indigo `#6366f1`, Dark Slate `#07090e`).
- **Mobile Native UI/UX**:
  - **Floating Mini Player**: Stays pinned above the navigation bar with real-time audio progress indicator, live track details, play/pause, and favorite toggles.
  - **Full-Screen Now Playing Sheet**: Ambient dynamic album glow, vinyl card view, interactive scrubbable progress bar, shuffle/repeat modes, and volume control.
  - **Video / Audio Toggle**: Switch seamlessly between full album artwork mode and direct YouTube video playback mode.
  - **5-Tab Navigation Bar**: Native navigation between **Home**, **Search**, **Library**, **Downloads (SQLite)**, and **Settings**.
- **State Management with Pinia**:
  - Global reactive store located at `stores/player.ts`.
  - Supports continuous music playback across all views without interruption.
  - Native **MediaSession API** integration for lock screen and Bluetooth headphone controls.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
APP_NAME=SOMLENG
YOUTUBE_API_KEY=your_youtube_data_api_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile or desktop browser.

### 4. Build Production PWA
```bash
npm run build
```
