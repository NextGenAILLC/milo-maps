import http from "node:http";

const PORT = Number(process.env.PORT || 8787);
const KEY = process.env.GEMINI_API_KEY || "";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function json(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

function parsePlacesFromText(text) {
  const sources = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let m;
  while ((m = re.exec(text))) sources.push({ name: m[1], url: m[2] });
  return sources;
}

function extractSources(data) {
  const sources = [];
  const candidates = data?.candidates || [];
  for (const c of candidates) {
    const chunks = c.groundingMetadata?.groundingChunks || [];
    for (const ch of chunks) {
      const maps = ch.maps || ch.web || {};
      if (maps.title || maps.uri || maps.name || maps.url) {
        sources.push({
          name: maps.title || maps.name || "Google Maps place",
          url: maps.uri || maps.url,
          placeId: maps.placeId,
          lat: maps.latLng?.latitude ?? maps.latitude,
          lng: maps.latLng?.longitude ?? maps.longitude,
        });
      }
    }
  }
  const text = candidates[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n") || "";
  if (!sources.length) sources.push(...parsePlacesFromText(text));
  return { text, sources };
}

async function generate(prompt, location) {
  if (!KEY) {
    return {
      demo: true,
      text: `Demo mode (no GEMINI_API_KEY). For "${prompt}" near ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}: add a Gemini key to get live Maps-grounded answers.`,
      sources: [
        {
          name: "Google Maps",
          url: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
          lat: location.lat,
          lng: location.lng,
        },
      ],
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(KEY)}`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are Milo, a maps assistant. Answer only with current, place-grounded facts. Include place names. Query: ${prompt}`,
          },
        ],
      },
    ],
    tools: [{ googleMaps: {} }, { googleSearch: {} }],
    toolConfig: location
      ? {
          retrievalConfig: {
            latLng: { latitude: location.lat, longitude: location.lng },
          },
        }
      : undefined,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    return {
      text: "",
      sources: [],
      error: data?.error?.message || `Gemini ${res.status}`,
    };
  }
  const parsed = extractSources(data);
  return { text: parsed.text || "No text returned.", sources: parsed.sources };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.url !== "/api/ask" && req.url !== "/ask") {
    return json(res, 404, { error: "Not found" });
  }
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return json(res, 400, { error: "Invalid JSON" });
  }
  const prompt = String(payload.prompt || "").slice(0, 2000);
  const location = payload.location || { lat: 41.8781, lng: -87.6298 };
  if (!prompt) return json(res, 400, { error: "prompt required" });
  try {
    const reply = await generate(prompt, location);
    json(res, reply.error ? 502 : 200, reply);
  } catch (e) {
    json(res, 500, { error: e instanceof Error ? e.message : "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Milo API on :${PORT}`);
});
