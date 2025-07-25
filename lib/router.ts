import { generatePrompt } from './promptFactory';
import { runGptChat } from './openai';
import { isApproved } from './gatekeeper';
import { logStepPerformance } from './overwatch';

type PipelineStep = {
  gpt: string;
  id: string;
  task: string;
  context?: string;
  depends_on?: string;
};

type Pipeline = PipelineStep[];

type PipelineResult = {
  [stepId: string]: {
    output: string;
    status: 'done' | 'failed' | 'waiting_approval';
  };
};

export async function runPipeline(pipeline: Pipeline, taskId?: number): Promise<PipelineResult> {
  const results: PipelineResult = {};

  for (const step of pipeline) {
    const start = Date.now();

    if (step.depends_on && results[step.depends_on]?.status !== 'done') break;

    if (taskId) {
      const approved = await isApproved(taskId);
      if (!approved) {
        results[step.id] = {
          output: `⏸ Paused. Waiting for Captain to approve task ${taskId}.`,
          status: 'waiting_approval',
        };
        logStepPerformance({
          gpt: step.gpt,
          stepId: step.id,
          durationMs: Date.now() - start,
          status: 'waiting_approval',
        });
        break;
      }
    }

    try {
      const context = step.depends_on ? results[step.depends_on]?.output || '' : step.context || '';
      const prompt = generatePrompt({ gpt: step.gpt, task: step.task, context });
      const output = await runGptChat(prompt);

      results[step.id] = { output, status: 'done' };
      logStepPerformance({ gpt: step.gpt, stepId: step.id, durationMs: Date.now() - start, status: 'done' });
    } catch (err) {
      results[step.id] = { output: String(err), status: 'failed' };
      logStepPerformance({ gpt: step.gpt, stepId: step.id, durationMs: Date.now() - start, status: 'failed', error: String(err) });
    }
  }

  return results;
}
