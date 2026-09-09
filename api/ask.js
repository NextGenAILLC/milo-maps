export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const KEY = process.env.GEMINI_API_KEY || "";
  const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = String(req.body?.prompt || "").slice(0, 2000);
  const location = req.body?.location || { lat: 41.8781, lng: -87.6298 };
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  if (!KEY) {
    return res.status(200).json({
      demo: true,
      text: `Demo mode (no GEMINI_API_KEY). For "${prompt}" near ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}: add a Gemini key in Vercel env for live Maps-grounded answers.`,
      sources: [
        {
          name: "Google Maps",
          url: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
          lat: location.lat,
          lng: location.lng,
        },
      ],
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(KEY)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `You are Milo, a maps assistant. Answer only with current, place-grounded facts. Include place names. Query: ${prompt}` }] }],
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: {
        retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } },
      },
    }),
  });
  const data = await r.json();
  if (!r.ok) return res.status(502).json({ error: data?.error?.message || "Gemini error" });

  const sources = [];
  for (const c of data.candidates || []) {
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
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text).filter(Boolean).join("\n");
  return res.status(200).json({ text: text || "No text returned.", sources });
}
