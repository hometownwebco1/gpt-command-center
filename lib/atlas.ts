import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function saveTask(command: string, pipeline: any, result: any) {
  return await prisma.task.create({
    data: {
      title: command,
      status: 'complete',
      assignedGPT: 'Frankie',
      approved: false,
      needsAction: true,
    },
  });
}

export async function getAllTasks() {
  return await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}

export async function approveTask(id: number) {
  return await prisma.task.update({
    where: { id },
    data: { approved: true, needsAction: false, status: 'approved' },
  });
}
