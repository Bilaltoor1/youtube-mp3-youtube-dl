// Simple in-memory state for tasks and video info
// Note: resets on container restart. For persistence, move to Redis/DB.

export const progressMap = new Map();
export const infoMap = new Map();

export function setProgress(taskId, data) {
  progressMap.set(taskId, { ...data, updatedAt: new Date().toISOString() });
}

export function getProgress(taskId) {
  return progressMap.get(taskId);
}

export function clearTask(taskId) {
  progressMap.delete(taskId);
  infoMap.delete(taskId);
}
