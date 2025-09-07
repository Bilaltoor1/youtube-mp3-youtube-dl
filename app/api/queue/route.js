import { enqueue, getJob } from '../_lib/queue';

const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|shorts\/|.+\?v=)?([^&=%\?]{11})/i;

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.url) return Response.json({ error: 'JSON payload required' }, { status: 400 });
  const url = String(body.url).trim();
  const bitrate = Math.min(Math.max(parseInt(body.bitrate || 128, 10) || 128, 64), 320);
  if (!YT_REGEX.test(url)) return Response.json({ error: 'Invalid YouTube URL' }, { status: 400 });

  const taskId = enqueue(url, bitrate);
  const job = getJob(taskId);
  return Response.json({ taskId, job }, { status: 202 });
}
