import http from 'node:http';
import { spawn } from 'node:child_process';

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout });
      else reject(new Error(stderr || `yt-dlp exited ${code}`));
    });
  });
}

function send(res, status, obj, headers = {}) {
  const data = typeof obj === 'string' ? obj : JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { ok: true });
  }

  if (req.method === 'POST' && req.url === '/json') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', async () => {
      try {
        const { url } = JSON.parse(body || '{}');
        if (!url) return send(res, 400, { error: 'url required' });
        const headers = [
          '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
          '--add-header', 'Accept-Language:en-US,en;q=0.5',
        ];
        const args = [
          ...headers,
          '-J', '--no-warnings', '--no-playlist', '--extractor-args', 'youtube:player_client=android,tv', '--retries', '3', '--fragment-retries', '3', '--', url,
        ];
        const { stdout } = await runYtDlp(args);
        send(res, 200, stdout);
      } catch (e) {
        send(res, 400, { error: e.message || 'yt-dlp error' });
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/convert') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', async () => {
      try {
        const { url, out, bitrate = 128 } = JSON.parse(body || '{}');
        if (!url || !out) return send(res, 400, { error: 'url and out required' });
        const headers = [
          '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
          '--add-header', 'Accept-Language:en-US,en;q=0.5',
        ];
        const args = [
          ...headers,
          '--newline', '-f', 'bestaudio/best', '-x', '--audio-format', 'mp3', '--audio-quality', String(bitrate), '--no-warnings', '--no-playlist', '--prefer-ffmpeg',
          '--extractor-args', 'youtube:player_client=android,tv', '-o', out.replace(/\.mp3$/, '.%(ext)s'), '--retries', '3', '--fragment-retries', '3', '--', url,
        ];
        await runYtDlp(args);
        send(res, 200, { ok: true });
      } catch (e) {
        send(res, 400, { error: e.message || 'yt-dlp error' });
      }
    });
    return;
  }

  send(res, 404, { error: 'not found' });
});

server.listen(process.env.PORT || 8080, process.env.HOST || '0.0.0.0');