import roles from '../roles.json';

type PromptInput = {
  gpt: string;
  task: string;
  context?: string;
};

export function generatePrompt({ gpt, task, context = '' }: PromptInput): string {
  const role = (roles as any)[gpt];
  if (!role) throw new Error(`GPT '${gpt}' not found in roles.json`);

  return `
You are ${gpt}, the ${role.title}.

${role.description}

Your current task:
${task}

${context ? 'Additional context:\n' + context : ''}

Respond in a structured, clean format based on your role’s expected output.
`.trim();
}
