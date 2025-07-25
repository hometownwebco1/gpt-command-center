// lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure this is set in .env and Vercel
});

export async function runGptChat(prompt: string, model = 'gpt-4o'): Promise<string> {
  const chat = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return chat.choices[0]?.message?.content?.trim() || '';
}
