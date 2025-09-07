import { runYtDlp } from './ytdlp';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { EventEmitter } from 'node:events';

const queue = [];
const jobs = new Map();
const emitters = new Map();
let running = false;

export function createEmitter(taskId) {
  const em = new EventEmitter();
  emitters.set(taskId, em);
  return em;
}

export function getEmitter(taskId) {
  return emitters.get(taskId);
}

function emit(taskId, type, data) {
  const em = emitters.get(taskId);
  if (em) em.emit(type, data);
}

export function getJob(taskId) {
  return jobs.get(taskId);
}

export function enqueue(url, bitrate = 128) {
  const taskId = randomUUID();
  const useSidecar = process.env.USE_YTDLP_CONTAINER === '1' || process.env.USE_YTDLP_CONTAINER === 'true';
  const baseDir = useSidecar ? '/tmp' : tmpdir();
  const outPath = join(baseDir, `${taskId}.mp3`);
  const job = {
    id: taskId,
    url,
    bitrate,
    status: 'queued',
    progress: 0,
    message: 'Queued',
    filePath: outPath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.set(taskId, job);
  queue.push(taskId);
  runLoop();
  return taskId;
}

function update(taskId, patch) {
  const j = jobs.get(taskId);
  if (!j) return;
  Object.assign(j, patch, { updatedAt: new Date().toISOString() });
  emit(taskId, 'progress', j);
}

function parseProgress(line) {
  // yt-dlp progress lines often contain "Downloading" and percentage like  12.3%
  const m = line.match(/(\d{1,3}\.\d|\d{1,3})%/);
  if (m) return Math.max(0, Math.min(100, parseFloat(m[1])));
  return null;
}

async function processJob(taskId) {
  const job = jobs.get(taskId);
  if (!job) return;
  update(taskId, { status: 'downloading', message: 'Starting download...' });

  const useSidecar = process.env.USE_YTDLP_CONTAINER === '1' || process.env.USE_YTDLP_CONTAINER === 'true';
  const args = [
    '--newline',
    '-f', 'bestaudio/best',
    '-x', '--audio-format', 'mp3', '--audio-quality', String(job.bitrate),
    '--no-warnings', '--no-playlist', '--prefer-ffmpeg',
    '--extractor-args', 'youtube:player_client=android,tv',
    '-o', useSidecar ? `/media/${job.id}.%(ext)s` : job.filePath.replace(/\.mp3$/, '.%(ext)s'),
    '--retries', '3', '--fragment-retries', '3',
    '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
    '--add-header', 'Accept-Language:en-US,en;q=0.5',
    '--', job.url,
  ];

  await runYtDlp(args);

  if (!existsSync(job.filePath)) {
    update(taskId, { status: 'error', message: 'Conversion failed', progress: 0 });
    throw new Error('Output file not found');
  }

  update(taskId, { status: 'completed', message: 'Completed', progress: 100 });
  emit(taskId, 'done', jobs.get(taskId));
}

async function runLoop() {
  if (running) return;
  running = true;
  while (queue.length) {
    const taskId = queue.shift();
    try {
      await processJob(taskId);
    } catch (e) {
      update(taskId, { status: 'error', message: e.message || 'Error' });
    }
  }
  running = false;
}

export function removeEmitter(taskId) {
  const em = emitters.get(taskId);
  if (em) em.removeAllListeners();
  emitters.delete(taskId);
}
