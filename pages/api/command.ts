import type { NextApiRequest, NextApiResponse } from 'next';
import { runPipeline } from '../../lib/router';
import { generatePrompt } from '../../lib/promptFactory';
import { runGptChat } from '../../lib/openai';  // ✅ FIXED

type PipelineStep = {
  gpt: string;
  id: string;
  task: string;
  depends_on?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'Missing command' });

    const frankiePrompt = generatePrompt({
      gpt: 'Frankie',
      task: `Create a JSON pipeline to fulfill this request: "${command}"`,
      context: `
Rules:
- Output a JSON array of steps.
- Each step must include:
  gpt: (name), id: (unique step id), task: (what they should do), depends_on: (if any)
- Do NOT return anything except the JSON.
      `,
    });

    const frankieOutput = await runGptChat(frankiePrompt);  // ✅ FIXED
    const parsedPipeline: PipelineStep[] = JSON.parse(frankieOutput);

    const output = await runPipeline(parsedPipeline);

    return res.status(200).json({ pipeline: parsedPipeline, result: output });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
