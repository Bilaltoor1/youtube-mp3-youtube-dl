// API Configuration
// Build a single API prefix that always results in exactly one '/api' segment.
const base = (() => {
  const env = process.env.NEXT_PUBLIC_API_URL || '';
  if (!env) return '';
  return env.replace(/\/$/, ''); // strip trailing slash
})();

// If base already ends with '/api' (e.g., '/api' or 'https://x/api'), use it as-is.
// Otherwise, append '/api'. If base is empty, prefix becomes '/api'.
const API_PREFIX = base ? (base.endsWith('/api') ? base : `${base}/api`) : '/api';

export const API_ENDPOINTS = {
  convert: `${API_PREFIX}/convert`,
  health: `${API_PREFIX}/health`,
  videoInfo: `${API_PREFIX}/video-info`,
  progress: (taskId) => `${API_PREFIX}/progress/${taskId}`,
  download: (taskId) => `${API_PREFIX}/download/${taskId}`,
};
