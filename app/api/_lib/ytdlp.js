import { spawn } from 'node:child_process';
import http from 'node:http';

function useSidecar() {
  return process.env.USE_YTDLP_CONTAINER === '1' || process.env.USE_YTDLP_CONTAINER === 'true';
}

export function spawnYtDlp(args = [], options = {}) {
  if (!useSidecar()) {
    return spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
  }
  // When using sidecar HTTP, we don’t stream directly; callers should switch to request helpers.
  throw new Error('spawnYtDlp is not supported with USE_YTDLP_CONTAINER; use requestYtDlpJson/requestYtDlpConvert');
}

export async function requestYtDlpJson(url) {
  const payload = JSON.stringify({ url });
  return httpRequest({ path: '/json', method: 'POST' }, payload);
}

export async function requestYtDlpConvert({ url, out, bitrate }) {
  const payload = JSON.stringify({ url, out, bitrate });
  return httpRequest({ path: '/convert', method: 'POST' }, payload);
}

function httpRequest({ path, method }, body) {
  const host = process.env.YTDLP_HOST || 'ytdlp';
  const port = Number(process.env.YTDLP_PORT || 8080);
  return new Promise((resolve, reject) => {
    const req = http.request({ host, port, path, method, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body || '') } }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(data || `Status ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}