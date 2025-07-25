type LogEntry = {
  gpt: string;
  stepId: string;
  durationMs: number;
  status: 'done' | 'failed' | 'waiting_approval';
  error?: string;
};

const logs: LogEntry[] = [];

export function logStepPerformance(entry: LogEntry) {
  logs.push(entry);

  if (entry.status === 'failed') {
    console.warn(`⚠️ Step ${entry.stepId} (${entry.gpt}) failed: ${entry.error}`);
  } else if (entry.durationMs > 10000) {
    console.warn(`⏱️ Step ${entry.stepId} (${entry.gpt}) took ${entry.durationMs}ms`);
  }
}

export function getRecentLogs(limit = 20): LogEntry[] {
  return logs.slice(-limit).reverse();
}
