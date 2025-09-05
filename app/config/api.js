// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  convert: `${API_BASE_URL}/convert`,
  health: `${API_BASE_URL}/health`,
  videoInfo: `${API_BASE_URL}/video-info`,
  progress: (taskId) => `${API_BASE_URL}/progress/${taskId}`,
  download: (taskId) => `${API_BASE_URL}/download/${taskId}`,
};
