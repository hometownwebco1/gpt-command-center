import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

export async function runGptChat(prompt: string, model = 'gpt-4o'): Promise<string> {
  const res = await openai.createChatCompletion({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return res.data.choices[0].message?.content?.trim() || '';
}

