// API Configuration
// Prefer relative '/api' in the browser (goes through nginx),
// and fall back to the internal Docker hostname during SSR.
const runtimeBase = (() => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') return '/api';
  return 'http://backend:5000';
})();

export const API_BASE_URL = runtimeBase;

export const API_ENDPOINTS = {
  convert: `${API_BASE_URL}/convert`,
  health: `${API_BASE_URL}/health`,
  videoInfo: `${API_BASE_URL}/video-info`,
  progress: (taskId) => `${API_BASE_URL}/progress/${taskId}`,
  download: (taskId) => `${API_BASE_URL}/download/${taskId}`,
};
