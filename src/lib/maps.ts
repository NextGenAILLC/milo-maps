const LIBRARIES = "places,marker,routes";

export function loadMaps(apiKey: string): Promise<void> {
  if (!apiKey) return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  if (window.google?.maps) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>("script[data-milo-maps]");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Maps script failed")));
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.dataset.miloMaps = "1";
    s.async = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=${LIBRARIES}`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Maps script failed"));
    document.head.appendChild(s);
  });
}
