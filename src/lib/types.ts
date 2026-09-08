export type LatLng = { lat: number; lng: number };

export type PlaceHit = {
  name: string;
  url?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
};

export type MiloReply = {
  text: string;
  sources: PlaceHit[];
  error?: string;
  demo?: boolean;
};

export type SavedPlace = PlaceHit & { id: string; savedAt: number };
