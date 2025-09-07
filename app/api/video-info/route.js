import { run } from '../../api/_lib/shell';
import { spawnYtDlp, requestYtDlpJson } from '../../api/_lib/ytdlp';

const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|shorts\/|.+\?v=)?([^&=%\?]{11})/i;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.url) {
      return Response.json({ error: 'JSON payload required' }, { status: 400 });
    }
    const url = String(body.url).trim();
    if (!YT_REGEX.test(url)) {
      return Response.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const args = [
      '-J', // dump JSON
      '--no-warnings',
      '--no-playlist',
      '--extractor-args', 'youtube:player_client=android,tv',
      '--retries', '3',
      '--fragment-retries', '3',
      '--', url,
    ];

    const headers = [
      '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
      '--add-header', 'Accept-Language:en-US,en;q=0.5',
    ];

    const useSidecar = process.env.USE_YTDLP_CONTAINER === '1' || process.env.USE_YTDLP_CONTAINER === 'true';
    let jsonText;
    if (useSidecar) {
      jsonText = await requestYtDlpJson(url);
    } else {
      const child = spawnYtDlp([...headers, ...args]);
      let stdout = '';
      let stderr = '';
      await new Promise((resolve, reject) => {
        child.stdout.on('data', (d) => { stdout += d.toString(); });
        child.stderr.on('data', (d) => { stderr += d.toString(); });
        child.on('error', reject);
        child.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(stderr || `yt-dlp exited with code ${code}`));
        });
      });
      jsonText = stdout;
    }
    const info = JSON.parse(jsonText);

    const video = {
      id: info.id,
      title: info.title || 'Unknown Title',
      uploader: info.uploader || 'Unknown',
      duration: info.duration || 0,
      duration_string: info.duration_string || 'Unknown',
      view_count: info.view_count || 0,
      upload_date: info.upload_date || 'Unknown',
      description: (info.description || '').slice(0, 500),
      thumbnail: info.thumbnail || '',
      webpage_url: info.webpage_url || url,
      formats_available: Array.isArray(info.formats) ? info.formats.length : 0,
      is_live: !!info.is_live,
    };

    if (video.duration && video.duration > 1800) {
      video.duration_warning = 'Video exceeds 30-minute limit';
    }

    return Response.json(video, { status: 200 });
  } catch (err) {
    console.error('video-info error:', err?.message);
    return Response.json({ error: 'Failed to extract video info. Video may be private or unavailable.' }, { status: 400 });
  }
}
