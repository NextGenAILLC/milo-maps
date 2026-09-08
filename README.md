# Milo Maps

Ask-Milo maps app. UI in this repo. Cursor is the builder. Stitch supplies screens. Gemini + Google Maps grounding answers. Firebase hosts, auths, and stores saves.

## What works now
- Ask rail + map shell
- `/api/ask` with Maps + Search grounding when `GEMINI_API_KEY` is set
- Demo reply if the Gemini key is missing (PoC UI still runs)
- Map + pins when `VITE_GOOGLE_MAPS_API_KEY` is set
- Optional Google sign-in + Firestore saved places

## Local
```bash
cp .env.example .env.local
# fill keys
npm install
npm run dev
```
UI: http://localhost:5173  
API: http://127.0.0.1:8787

## Public Firebase
```bash
npm run build
firebase login
firebase use milo-maps
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy
```

Restrict the Maps key to the Hosting domain before announcing.

## Stitch
1. Create project at https://stitch.withgoogle.com
2. Put the API key in `.cursor/mcp.json`
3. In Cursor: `list_projects` then implement those screens only

## Repo
https://github.com/NextGenAILLC/milo-maps
