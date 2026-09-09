# Status — 2026-09-08

## Done
- Public repo: https://github.com/NextGenAILLC/milo-maps
- UI: Ask Milo + map shell + attribution
- API: local server, Firebase Function, Vercel `/api/ask`
- Firestore rules + Auth hooks
- Cursor/Stitch MCP stubs

## Live
- Site deploys without keys in **demo mode**
- Full Maps + grounded answers need env vars on the host

## Blocked until you set these on Vercel/Firebase
- `VITE_GOOGLE_MAPS_API_KEY` (browser, referrer-restricted)
- `GEMINI_API_KEY` (server only)
- Optional Firebase web config for sign-in/saves
- Restrict keys to the live domain
- Privacy/ToS before advertising public use
