import { createEmitter, getEmitter, getJob, removeEmitter } from '../../../_lib/queue';

export async function GET(_req, { params }) {
  const { taskId } = params;
  let em = getEmitter(taskId);
  if (!em) em = createEmitter(taskId);

  const stream = new ReadableStream({
    start(controller) {
      const send = (event, data) => {
        controller.enqueue(new TextEncoder().encode(`event: ${event}\n`));
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // send current state
      const job = getJob(taskId);
      if (job) send('progress', job);

      const onProgress = (data) => send('progress', data);
      const onDone = (data) => { send('done', data); controller.close(); };
      em.on('progress', onProgress);
      em.on('done', onDone);

      const heartbeat = setInterval(() => controller.enqueue(new TextEncoder().encode(': ping\n\n')), 15000);

      const teardown = () => {
        clearInterval(heartbeat);
        em.off('progress', onProgress);
        em.off('done', onDone);
        removeEmitter(taskId);
      };

      controller.error = teardown;
      controller.cancel = teardown;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
