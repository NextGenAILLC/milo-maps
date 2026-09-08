import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { askMilo } from "./lib/api";
import { loadMaps } from "./lib/maps";
import {
  firebaseReady,
  getFirebase,
  removeSaved,
  savePlace,
  signInGoogle,
  signOutUser,
  watchSaved,
} from "./lib/firebase";
import type { LatLng, MiloReply, PlaceHit, SavedPlace } from "./lib/types";

const CHICAGO: LatLng = { lat: 41.8781, lng: -87.6298 };
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const PROMPTS = [
  "Best coffee within a 12-minute walk",
  "Plan a 4-stop afternoon in this neighborhood",
  "Quiet dinner with outdoor seating nearby",
];

export default function App() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [loc, setLoc] = useState<LatLng>(CHICAGO);
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [busy, setBusy] = useState(false);
  const [mapsOk, setMapsOk] = useState(false);
  const [mapsErr, setMapsErr] = useState("");
  const [replies, setReplies] = useState<MiloReply[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<SavedPlace[]>([]);
  const fbOn = useMemo(() => firebaseReady(), []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!MAPS_KEY || !mapEl.current) return;
    let dead = false;
    loadMaps(MAPS_KEY)
      .then(async () => {
        if (dead || !mapEl.current) return;
        const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        mapRef.current = new Map(mapEl.current, {
          center: loc,
          zoom: 14,
          mapId: "DEMO_MAP_ID",
          disableDefaultUI: true,
          zoomControl: true,
        });
        setMapsOk(true);
      })
      .catch((e: Error) => setMapsErr(e.message));
    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    mapRef.current?.setCenter(loc);
  }, [loc]);

  useEffect(() => {
    if (!fbOn) return;
    const { auth } = getFirebase();
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, [fbOn]);

  useEffect(() => {
    if (!user) {
      setSaved([]);
      return;
    }
    return watchSaved(user.uid, setSaved);
  }, [user]);

  async function plot(sources: PlaceHit[]) {
    if (!mapRef.current || !window.google?.maps) return;
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      "marker",
    )) as google.maps.MarkerLibrary;
    markers.current.forEach((m) => (m.map = null));
    markers.current = [];
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(loc);
    sources.forEach((s, i) => {
      if (s.lat == null || s.lng == null) return;
      const pin = new AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: s.lat, lng: s.lng },
        title: s.name || `Place ${i + 1}`,
      });
      markers.current.push(pin);
      bounds.extend({ lat: s.lat, lng: s.lng });
    });
    if (markers.current.length) mapRef.current.fitBounds(bounds, 80);
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!prompt.trim() || busy) return;
    setBusy(true);
    try {
      const reply = await askMilo(prompt.trim(), loc);
      setReplies((r) => [reply, ...r]);
      await plot(reply.sources);
    } catch (err) {
      setReplies((r) => [
        { text: "", sources: [], error: err instanceof Error ? err.message : "Ask failed" },
        ...r,
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" />
          <div>
            <h1>Milo Maps</h1>
            <p>Grounded in Google Maps</p>
          </div>
        </div>
        <div className="ask">
          <form onSubmit={submit}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Milo for places, routes, or a day plan"
            />
            <div className="row">
              <button type="submit" disabled={busy}>
                {busy ? "Asking…" : "Ask Milo"}
              </button>
              {fbOn && !user && (
                <button type="button" className="chip" onClick={() => signInGoogle()}>
                  Sign in
                </button>
              )}
              {user && (
                <button type="button" className="chip" onClick={() => signOutUser()}>
                  Sign out
                </button>
              )}
            </div>
            <div className="row" style={{ flexWrap: "wrap", marginTop: 4 }}>
              {PROMPTS.map((p) => (
                <button key={p} type="button" className="chip" onClick={() => setPrompt(p)}>
                  {p}
                </button>
              ))}
            </div>
          </form>
        </div>
        <div className="feed">
          {replies.length === 0 && (
            <div className="card">
              <h3>Ready</h3>
              <p>
                Location used: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}. Answers come from Gemini
                with Google Maps grounding. Sources must stay visible.
              </p>
            </div>
          )}
          {replies.map((r, i) => (
            <article className="card" key={i}>
              <h3>{r.error ? "Error" : r.demo ? "Demo reply" : "Milo"}</h3>
              <p className="answer">{r.error || r.text}</p>
              {r.sources.length > 0 && (
                <div className="sources">
                  {r.sources.map((s, j) => (
                    <a key={j} href={s.url || "#"} target="_blank" rel="noreferrer">
                      {s.name}
                    </a>
                  ))}
                </div>
              )}
              {user &&
                r.sources.slice(0, 3).map((s, j) => (
                  <button
                    key={j}
                    className="chip"
                    style={{ marginTop: 8 }}
                    onClick={() => savePlace(user.uid, s)}
                  >
                    Save {s.name}
                  </button>
                ))}
              <div className="attr">
                Sources: <span translate="no">Google Maps</span>
              </div>
            </article>
          ))}
          {saved.length > 0 && (
            <div className="card">
              <h3>Saved</h3>
              {saved.map((s) => (
                <p key={s.id}>
                  {s.name}{" "}
                  <button className="chip" onClick={() => removeSaved(s.id)}>
                    Remove
                  </button>
                </p>
              ))}
            </div>
          )}
        </div>
      </aside>
      <section className="map-wrap">
        <div className="map" ref={mapEl} />
        {!MAPS_KEY && (
          <div className="overlay warn">
            Set <code>VITE_GOOGLE_MAPS_API_KEY</code>. Map, Places, and pins stay off until the
            restricted Maps JS key is present.
          </div>
        )}
        {mapsErr && <div className="overlay warn">{mapsErr}</div>}
        <div className="status">
          {mapsOk ? "Map live" : "Map standby"} · API {MAPS_KEY ? "key set" : "key missing"} ·{" "}
          {fbOn ? (user ? user.email : "auth ready") : "local saves off"}
        </div>
      </section>
    </div>
  );
}
