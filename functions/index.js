const { onRequest } = require("firebase-functions/v2/https");

const KEY = process.env.GEMINI_API_KEY || "";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function extractSources(data) {
  const sources = [];
  const candidates = data?.candidates || [];
  for (const c of candidates) {
    for (const ch of c.groundingMetadata?.groundingChunks || []) {
      const maps = ch.maps || ch.web || {};
      if (maps.title || maps.uri || maps.name || maps.url) {
        sources.push({
          name: maps.title || maps.name || "Google Maps place",
          url: maps.uri || maps.url,
          placeId: maps.placeId,
          lat: maps.latLng?.latitude,
          lng: maps.latLng?.longitude,
        });
      }
    }
  }
  const text = candidates[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n") || "";
  return { text, sources };
}

exports.ask = onRequest({ cors: true, secrets: ["GEMINI_API_KEY"] }, async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const prompt = String(req.body?.prompt || "").slice(0, 2000);
  const location = req.body?.location || { lat: 41.8781, lng: -87.6298 };
  if (!prompt) return res.status(400).json({ error: "prompt required" });
  if (!KEY) return res.status(503).json({ error: "GEMINI_API_KEY not bound" });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(KEY)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `You are Milo. Query: ${prompt}` }] }],
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: {
        retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } },
      },
    }),
  });
  const data = await r.json();
  if (!r.ok) return res.status(502).json({ error: data?.error?.message || "Gemini error" });
  const parsed = extractSources(data);
  res.json({ text: parsed.text || "No text returned.", sources: parsed.sources });
});
