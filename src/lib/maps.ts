/**
 * Google Maps loader with lazy script injection
 */

let mapsLoaded = false;
let mapsPromise: Promise<void> | null = null;

/**
 * Load Google Maps API library
 * @param apiKey Google Maps API key (restricted to Maps JS API)
 * @returns Promise that resolves when Maps is ready
 */
export function loadMaps(apiKey: string): Promise<void> {
  if (mapsPromise) {
    return mapsPromise;
  }

  if (mapsLoaded && window.google?.maps) {
    return Promise.resolve();
  }

  mapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=maps,marker&v=beta`;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => {
      mapsLoaded = true;
      resolve();
    });

    script.addEventListener('error', () => {
      mapsPromise = null;
      reject(new Error('Failed to load Google Maps API'));
    });

    document.head.appendChild(script);
  });

  return mapsPromise;
}
