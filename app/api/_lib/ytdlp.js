import { spawn } from 'node:child_process';

function useSidecar() {
  return process.env.USE_YTDLP_CONTAINER === '1' || process.env.USE_YTDLP_CONTAINER === 'true';
}

export function spawnYtDlp(args = [], options = {}) {
  if (useSidecar()) {
    // Execute yt-dlp inside the official tnk4on/yt-dlp container via docker exec
    return spawn('docker', ['exec', '-i', 'yttmp3_ytdlp', 'yt-dlp', ...args], { stdio: ['ignore', 'pipe', 'pipe'], ...options });
  }
  // Fallback: run yt-dlp locally
  return spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
}

// Simple wrapper for running yt-dlp and getting the result
export async function runYtDlp(args = []) {
  return new Promise((resolve, reject) => {
    const child = spawnYtDlp(args);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `yt-dlp exited with code ${code}`));
    });
  });
}