# Nonopixelo - Dev Notes

## Project Location
```
/home/richardreynolds/nonogram-game
```

## GitHub Repo
```
https://github.com/RichardReynoldsRE/nonopixelo (public)
```

## Key Files
| File | Purpose |
|------|---------|
| `src/services/updateService.js` | Version number (update this for new releases) |
| `src/stores/dailyStore.js` | Daily puzzle tracking & streaks |
| `src/composables/usePuzzleGenerator.js` | Daily puzzle loading |
| `src/data/dailyPuzzles.js` | Hand-crafted puzzles (Jan/Feb 2026) |
| `android/app/build/outputs/apk/debug/app-debug.apk` | Built APK |

## Common Commands
```bash
# Run dev server
npm run dev

# Build & create APK
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug

# Copy APK to Windows Downloads
cp android/app/build/outputs/apk/debug/app-debug.apk /mnt/c/Users/richa/Downloads/Nonopixelo-vX.X.X.apk

# Push to GitHub (will need token)
git add -A && git commit -m "message" && git push
```

## Release Workflow
1. Update version in `src/services/updateService.js`
2. Build APK (commands above)
3. Commit & push to GitHub
4. Create release at: github.com/RichardReynoldsRE/nonopixelo/releases/new
5. Tag: `vX.X.X`, attach APK

## Current State
- **Version:** 1.0.1
- **Android SDK:** `~/Android/Sdk`
- **Android Studio:** `~/android-studio/bin/studio.sh`
- **Features:** Daily puzzles, puzzle packs, achievements, dark mode, update checker
