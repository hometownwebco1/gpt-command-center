import { runPipeline } from './router';
import { PrismaClient } from '@prisma/client';
import { saveTask } from './atlas';

const prisma = new PrismaClient();

export async function retryFailedTask(taskId: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  const pipeline = task.pipeline as any;
  const result = await runPipeline(pipeline, taskId);
  await saveTask(task.command, pipeline, result);

  return result;
}

export async function retryAllPending() {
  const tasks = await prisma.task.findMany({
    where: { status: 'failed' },
    take: 10,
  });

  for (const task of tasks) {
    await retryFailedTask(task.id);
  }
}
