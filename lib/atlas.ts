import prisma from '../lib/prisma'

export async function saveTask(command: string, pipeline: any, result: any) {
  return await prisma.task.create({
    data: {
      title: command,
      status: 'complete',
      assignedGPT: 'Frankie',
      approved: false,
      needsAction: true,
      pipeline: pipeline,
    }
  })
}
