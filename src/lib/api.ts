import type { LatLng, MiloReply } from "./types";

export async function askMilo(prompt: string, location?: LatLng): Promise<MiloReply> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, location }),
  });
  const data = (await res.json()) as MiloReply;
  if (!res.ok && !data.text) {
    throw new Error(data.error || `Ask failed (${res.status})`);
  }
  return data;
}
