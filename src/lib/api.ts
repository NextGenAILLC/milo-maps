/**
 * Milo API client for Maps-grounded answers from Gemini
 */

import type { LatLng, MiloReply } from './types';

const API_URL = process.env.VITE_API_URL || '/api';

/**
 * Ask Milo a question about places and get Maps-grounded answers
 * @param prompt User question or query
 * @param location Geographic location for grounding (lat/lng)
 * @returns MiloReply with text answer and place sources
 */
export async function askMilo(prompt: string, location: LatLng): Promise<MiloReply> {
  if (!prompt.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  try {
    const response = await fetch(`${API_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        location,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.text || 'No response',
      sources: data.sources || [],
      demo: data.demo || false,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to reach Milo API');
  }
}
