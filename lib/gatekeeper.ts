import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function isApproved(taskId: number): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  return !!task?.approved;
}
