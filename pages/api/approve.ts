import { NextApiRequest, NextApiResponse } from 'next';
import { approveTask } from '@/lib/atlas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: 'Missing taskId' });

  try {
    const result = await approveTask(Number(taskId));
    return res.status(200).json({ status: 'approved', result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
