import { getJob } from '../../_lib/queue';

export async function GET(_req, { params }) {
  const job = getJob(params.taskId);
  if (!job) return Response.json({ error: 'Task not found' }, { status: 404 });
  return Response.json(job, { status: 200 });
}
