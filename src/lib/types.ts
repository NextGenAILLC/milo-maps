/**
 * Type definitions for Milo Maps application
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceHit {
  name: string;
  url?: string;
  placeId?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface MiloReply {
  text: string;
  sources: PlaceHit[];
  error?: string;
  demo?: boolean;
}

export interface SavedPlace extends PlaceHit {
  id: string;
  userId: string;
  savedAt: number;
}

export interface AskRequest {
  prompt: string;
  location: LatLng;
}

export interface AskResponse {
  text: string;
  sources: PlaceHit[];
  error?: string;
  demo?: boolean;
}
