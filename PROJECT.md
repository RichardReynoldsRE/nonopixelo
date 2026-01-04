# Nonogram Puzzle Game

A mobile-first nonogram (picross) puzzle game with an integrated puzzle creator, built with Vue 3 + Vite + Capacitor.

---

## What We've Built

### Player Experience

**Core Gameplay**
- Classic nonogram puzzle solving with tap-to-fill mechanics
- Multi-color reveal images that appear as puzzles are completed
- Star rating system (1-3 stars based on performance)
- Progress tracking across all puzzle packs

**Puzzle Packs**
- 7 built-in packs: Getting Started, Animals, Tasty Treats, Nature, Vehicles, Space
- Custom packs created through the Creator tool
- Pack unlock progression system
- Featured packs with visual highlighting
- Event packs with start/end dates and countdown timers

**Daily Puzzles**
- Procedurally generated daily challenge
- Consistent puzzle for all players on the same day

### Creator Experience

**Puzzle Editor**
- Grid sizes from 5x5 to 20x20
- Drawing tools: Pencil, Eraser, Fill bucket
- Two-layer system: Solution (what player solves) + Reveal (colored image shown on completion)
- Color palette editor (2-8 colors per puzzle)
- Live preview with auto-generated clues
- Undo/Redo support

**Pack Management**
- Create, edit, delete puzzle packs
- Drag-and-drop pack reordering
- Pack metadata: name, icon, description
- Featured toggle with custom highlight colors
- Event scheduling with start/end dates
- Publish/unpublish control

**Deployment**
- One-click Deploy: syncs packs to game and rebuilds app
- Export packs as JSON for backup/sharing

---

## Technical Architecture

```
nonogram-game/
├── src/
│   ├── views/
│   │   ├── HomeView.vue        # Main menu
│   │   ├── LevelsView.vue      # Pack selection (player)
│   │   ├── PackView.vue        # Puzzle selection within pack
│   │   ├── GameView.vue        # Puzzle gameplay
│   │   ├── DailyView.vue       # Daily puzzle
│   │   ├── CreatorDashboard.vue # Creator home
│   │   ├── PackEditor.vue      # Edit pack details & puzzles
│   │   └── PuzzleEditor.vue    # Pixel art puzzle creator
│   ├── components/
│   │   ├── game/               # Gameplay components
│   │   └── creator/            # Creator tool components
│   ├── stores/
│   │   ├── progressStore.js    # Player progress (Pinia)
│   │   └── creatorStore.js     # Creator state (Pinia)
│   ├── data/puzzles/
│   │   ├── index.js            # Pack loading & helpers
│   │   └── custom.js           # Auto-generated from Creator
│   └── services/
│       └── api.js              # API client
├── server/
│   ├── index.js                # Express server entry
│   ├── storage.js              # JSON file storage
│   ├── routes/
│   │   ├── packs.js            # Pack CRUD + deploy
│   │   ├── puzzles.js          # Puzzle CRUD
│   │   └── daily.js            # Daily puzzle management
│   └── data/
│       └── packs.json          # Creator pack storage
└── dist/                       # Built app for Capacitor
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 (Composition API) |
| Build | Vite |
| State | Pinia |
| Routing | Vue Router |
| Styling | Tailwind CSS |
| Mobile | Capacitor (Android/iOS) |
| Backend | Express.js |
| Storage | JSON files |

### Key Data Structures

**Pack**
```javascript
{
  id: "pack_123",
  name: "My Pack",
  description: "...",
  icon: "🎨",
  published: true,
  featured: false,
  highlightColor: "#eab308",
  isEvent: false,
  eventStart: "2026-01-01T00:00:00Z",
  eventEnd: "2026-01-31T00:00:00Z",
  order: 0,
  puzzles: [...]
}
```

**Puzzle**
```javascript
{
  id: "puzzle_456",
  name: "Cat",
  size: 10,
  solution: [[0,1,0,...], ...],    // Binary grid (what player solves)
  palette: ["#FF0000", "#00FF00"], // Colors for reveal
  revealImage: [[0,1,2,...], ...]  // Color indices for reveal
}
```

---

## Running the Project

### Development

```bash
# Install dependencies
npm install

# Start dev server (game)
npm run dev

# Start API server (creator backend)
npm run server

# Access game at http://localhost:5173
# Access creator at http://localhost:5173/creator
```

### Building for Mobile

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## Future Roadmap

### High Priority

- [ ] **Hints System** - Let players reveal cells when stuck
- [ ] **Mistake Tracking** - Show errors, limit mistakes for star rating
- [ ] **Sound Effects** - Satisfying audio feedback for actions
- [ ] **Haptic Feedback** - Vibration on mobile for interactions
- [ ] **Tutorial** - Interactive onboarding for new players

### Medium Priority

- [ ] **Achievements** - Unlock badges for milestones
- [ ] **Statistics** - Track solve times, accuracy, streaks
- [ ] **Themes** - Dark mode, color themes
- [ ] **Offline Support** - Service worker for offline play
- [ ] **Cloud Save** - Sync progress across devices

### Creator Enhancements

- [ ] **Image Import** - Convert images to puzzles automatically
- [ ] **Puzzle Validation** - Check if puzzle is solvable without guessing
- [ ] **Difficulty Calculator** - Auto-rate puzzle difficulty
- [ ] **Batch Operations** - Edit multiple puzzles at once
- [ ] **Version History** - Undo/restore previous versions

### Social Features

- [ ] **Leaderboards** - Compare times with other players
- [ ] **Share Puzzles** - Generate shareable links
- [ ] **Community Packs** - Browse user-created content
- [ ] **Ratings & Reviews** - Rate puzzle packs

### Monetization (Future)

- [ ] **Premium Packs** - Purchasable puzzle packs
- [ ] **Remove Ads** - One-time purchase
- [ ] **Hint Packs** - Consumable hints

---

## Design Principles

1. **Mobile-First** - Touch-friendly, works on small screens
2. **Instant Feedback** - Every action has visual/audio response
3. **Progressive Difficulty** - Ease players into harder puzzles
4. **Creator Empowerment** - Make it easy to build great puzzles
5. **No Frustration** - Helpful hints, forgiving mistakes

---

## Known Limitations

- No multiplayer/real-time features
- Server required for Creator (no offline creation)
- Large puzzles (15x15+) may be challenging on small phones
- No puzzle solving algorithm validation yet

---

## Contributing

The project uses a simple architecture intentionally. Key areas for contribution:

1. **Gameplay Polish** - Animations, transitions, juice
2. **Accessibility** - Screen reader support, color blind modes
3. **Performance** - Large grid optimization
4. **Testing** - Unit and E2E test coverage

---

*Built with Claude Code*
