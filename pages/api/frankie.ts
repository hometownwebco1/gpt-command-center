// pages/api/frankie.ts
import type { NextApiRequest } from 'next'
import { saveTask } from '../../lib/atlas'
import { OpenAIStream, OpenAIStreamPayload } from '@/utils/OpenAIStream'

export const config = {
  runtime: 'edge',
}

const GPT_HANDLERS: Record<string, string> = {
  sam: "You are Sam, a senior full-stack software engineer. Your job is to write clean, production-ready TypeScript/Node.js code.",
  juno: "You are Juno, a seasoned UX/UI designer. Return fully responsive HTML+TailwindCSS layout only — no JS or backend code.",
  teddy: "You are Teddy, a backend and database expert. Your job is to create Prisma schema, queries, and backend logic.",
  frankie: "You are Frankie, the GPT Quarterback. Your role is to break down the user's command and assign each part to the correct agent. Return a task breakdown with agent names and responsibilities, and clearly state who handles what.",
}

export default async function handler(req: NextApiRequest) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const { command, gpt = 'frankie' } = await req.json()

  const promptHeader = GPT_HANDLERS[gpt.toLowerCase()]
  if (!promptHeader) {
    return new Response(`Unknown GPT: ${gpt}`, { status: 400 })
  }

  const fullPrompt = `${promptHeader}\n\nCOMMAND:\n${command}`

  const payload: OpenAIStreamPayload = {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: promptHeader },
      { role: 'user', content: fullPrompt },
    ],
    temperature: 0.5,
    stream: true,
  }

  const stream = await OpenAIStream(payload)

  // Save to DB
  saveTask(command, gpt, 'sent to OpenAI')

  return new Response(stream)
}
