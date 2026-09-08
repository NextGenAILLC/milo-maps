# Hard requirements — public Milo Maps

Without these, the product is a UI shell only.

## Legal / policy (blocks public launch)
- Google Cloud billing account on the project
- Maps Platform Terms + attribution on every grounded answer (`Google Maps`, source name + URL)
- Gemini Maps grounding usage requirements
- Privacy policy + ToS URLs on the live domain
- Do not scrape or cache Maps content beyond allowed use

## GCP APIs to enable
- Maps JavaScript API
- Places API
- Places API (New)
- Routes API (itinerary)
- Geocoding API
- Generative Language API (Gemini)
- Identity Toolkit / Firebase Auth
- Cloud Firestore
- Cloud Functions
- Firebase Hosting / App Hosting
- Firebase App Check

## Keys (two keys, never one)
1. **Browser Maps key** (`VITE_GOOGLE_MAPS_API_KEY`)
   - APIs: Maps JS, Places, Places New, Routes, Geocoding
   - Restrict: HTTP referrers = production domain + `localhost:5173`
2. **Server Gemini key** (`GEMINI_API_KEY`)
   - Restrict: APIs = Generative Language only
   - Store in Functions secret / Secret Manager
   - Never ship in the Vite bundle

## Firebase
- Auth: Google provider
- Authorized domains: Hosting domain + localhost
- Firestore rules from this repo deployed
- App Check (reCAPTCHA v3 or Enterprise) enforced before ads-scale traffic
- Functions secret: `firebase functions:secrets:set GEMINI_API_KEY`

## Stitch + Cursor
- stitch.withgoogle.com project **Milo Maps**
- Cursor `.cursor/mcp.json` with a real key
- DESIGN.md committed
- Do not treat Firebase Studio as source of truth (service sunsetting)

## Runtime
- Node 20
- HTTPS only
- Geolocation permission (falls back to Chicago)
- Quotas + budget alerts on Maps + Gemini (Maps grounding is billed)

## Public go-live gate
- [ ] Restricted keys
- [ ] Firestore rules live
- [ ] App Check on
- [ ] Attribution rendering verified
- [ ] Privacy/ToS
- [ ] Custom domain + SSL
- [ ] Budget cap
- [ ] GitHub `main` protected
