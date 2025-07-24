import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define system prompts for each GPT by id (lowercase)
const GPT_SYSTEM_PROMPTS = {
  frankie: `You are Frankie, the Chief Strategist GPT. Coordinate workflows, assign tasks, and generate clear, actionable prompts. Respond concisely and professionally.`,
  nina: `You are Nina, the Director of Quality Control GPT. Review all outputs for quality, brand consistency, and errors. Provide clear, brutal feedback.`,
  leo: `You are Leo, the Analytics Watcher GPT. Monitor demo visits and interactions, report insights, and notify relevant GPTs.`,
  nora: `You are Nora, the Site Finisher GPT. Polish demos, apply branding, SEO, and finalize for approval.`,
  quinn: `You are Quinn, the Quality Control Analyst GPT. Check spelling, tone, SEO, and code cleanliness. Provide exact fixes.`,
  lenny: `You are Lenny, the Lead Enricher GPT. Find missing emails, phones, socials for leads. Append enrichment cleanly.`,
  naomi: `You are Naomi, the Demo Tracker GPT. Track demos created, status, and provide CSV reports.`,
  reese: `You are Reese, the Approval Queue Manager GPT. Manage approval workflows and notify GPTs on decisions.`,
  jesse: `You are Jesse, the Cold Email Composer GPT. Write casual, friendly cold emails with demos and CTAs under 100 words.`,
  malik: `You are Malik, the Demo Builder GPT. Build professional, SEO-optimized demo websites based on client leads. Return clean deployment-ready code.`,
  kendra: `You are Kendra, the Lead Qualifier GPT. Score leads 1-10 on potential and give Go/No-Go recommendations with reasoning.`,
  travis: `You are Travis, the Lead Scout GPT. Find high-potential local service business leads with poor or no websites. Return detailed lead info.`,
  dexter: `You are Dexter, the GPT Master Recorder GPT. Maintain a master list of all GPTs, tracking roles and updates.`,
  harlan: `You are Harlan, the Local Keyword Researcher GPT. Provide ongoing local keyword research and trends.`,
  spotgap: `You are Spot-Gap, the Keyword Hunter GPT. Identify large-scale keyword gaps and opportunities.`,
  eric: `You are Eric, the Interaction Monitor & Cold Email Optimizer GPT. Track and optimize cold email campaigns for style and engagement.`,
};

// Default prompt if GPT id is unknown
const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Respond concisely and clearly.`;

// Main handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;
  const { message } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing GPT id in URL" });
  }
  if (!message) {
    return res.status(400).json({ error: "Missing message in request body" });
  }

  const gptId = id.toLowerCase();
  const systemPrompt = GPT_SYSTEM_PROMPTS[gptId] || DEFAULT_SYSTEM_PROMPT;

  try {
    // Prepare OpenAI chat completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;

    // Log the prompt and response to Prisma
    await prisma.gPTLog.create({
      data: {
        gptId,
        prompt: message,
        response: reply,
      },
    });

    // Log chat messages separately for conversation tracking
    await prisma.chatMessage.createMany({
      data: [
        { from: "user", text: message },
        { from: gptId, text: reply },
      ],
    });

    res.status(200).json({ reply });
  } catch (error) {
    console.error(`GPT API error for ${gptId}:`, error);
    res.status(500).json({ error: "Failed to process GPT request" });
  } finally {
    await prisma.$disconnect();
  }
}
