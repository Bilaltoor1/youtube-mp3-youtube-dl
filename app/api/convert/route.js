import { run } from '../../api/_lib/shell';
import { spawnYtDlp, requestYtDlpConvert } from '../../api/_lib/ytdlp';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';

const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|shorts\/|.+\?v=)?([^&=%\?]{11})/i;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.url) {
      return Response.json({ error: 'JSON payload required' }, { status: 400 });
    }
    const url = String(body.url).trim();
    const bitrate = Math.min(Math.max(parseInt(body.bitrate || 128, 10) || 128, 64), 320);

    if (!YT_REGEX.test(url)) {
      return Response.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const id = randomUUID();
  // If using sidecar, we need a deterministic /tmp path shared via volume
  const sharedTmp = process.env.USE_YTDLP_CONTAINER ? '/tmp' : tmpdir();
  const outPath = join(sharedTmp, `${id}.mp3`);

    const args = [
      '-f', 'bestaudio/best',
      '-x', '--audio-format', 'mp3', '--audio-quality', String(bitrate),
      '--no-warnings', '--no-playlist', '--prefer-ffmpeg',
      '--extractor-args', 'youtube:player_client=android,tv',
      '-o', join(tmpdir(), `${id}.%(ext)s`),
      '--retries', '3', '--fragment-retries', '3',
      '--', url,
    ];

    const headers = [
      '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
      '--add-header', 'Accept-Language:en-US,en;q=0.5',
    ];

    const useSidecar = process.env.USE_YTDLP_CONTAINER === '1' || process.env.USE_YTDLP_CONTAINER === 'true';
    if (useSidecar) {
      await requestYtDlpConvert({ url, out: outPath, bitrate });
    } else {
      await new Promise((resolve, reject) => {
        const child = spawnYtDlp([...headers, ...args]);
        child.on('error', reject);
        child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`yt-dlp exited with code ${code}`))));
      });
    }

    if (!existsSync(outPath)) {
      return Response.json({ error: 'Conversion failed' }, { status: 500 });
    }

    const stream = createReadStream(outPath);
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="download.mp3"',
      }
    });
  } catch (err) {
    console.error('convert error:', err?.message);
    return Response.json({ error: 'Failed to download video. Video may be private or unavailable.' }, { status: 400 });
  }
}
