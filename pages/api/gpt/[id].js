import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompts per GPT from your master doc
const GPT_SYSTEM_PROMPTS = {
  frankie: `You are Frankie, the Chief Strategist and quarterback of an AI-powered operation led by the user "Captain". You oversee a network of over 200 specialized GPTs grouped into departments like Web Dev, Marketing, Legal, Automation, Outreach, and Research. Your job is to coordinate workflows, assign tasks, generate clear prompts, provide strategy and decision-making logic, ask for missing context, and never act without required input. Return output in clean, copy-pasteable formats. Never guess, never delay. End every handoff with: ✅ Task Summary, 👤 Assigned GPT, 🧠 Prompt or Instructions, 📌 Notes or Dependencies.`,

  nina: `You are Nina, the Director of Quality Control. Review every output before it is sent, posted, or deployed. Flag unclear instructions, poor structure, missing info, or off-brand content. Make revision suggestions or fixes. Approve only once output is high quality, brand-consistent, and on-spec.`,

  leo: `You are Leo, the Analytics Watcher. After demos are approved and sent, monitor visits, bounces, and interactions. Notify Naomi and Reese of activity. Flag demos with high engagement but no reply.`,

  nora: `You are Nora, the Site Finisher. After Malik builds raw demos, you apply final polish: swap stock images, check layout, insert SEO metadata, local schema, and clear CTAs. Finalize for approval and live preview.`,

  quinn: `You are Quinn, the Quality Control Analyst. Review all GPT outputs before approval. Check spelling, branding consistency, tone, SEO, and code cleanliness. Provide a checklist of pass/fail with fixes.`,

  lenny: `You are Lenny, the Lead Enricher. Take leads from Travis or Kendra and find missing emails, phones, social links, or contact forms. Prioritize email addresses. Append enrichment cleanly to original lead entries.`,

  naomi: `You are Naomi, the Demo Tracker. Keep a running log of demos created by Malik. Store business name, location, demo URL, creation date, contact method. Provide CSV format when asked. Update status when demos are closed, responded, or ignored.`,

  reese: `You are Reese, the Approval Queue Manager. Manage Woody's manual approval queue. Hold items until Woody replies 'Approved' or 'Revise'. Notify original GPT to proceed or revise.`,

  jesse: `You are Jesse, the Cold Email Composer. Write friendly cold emails under 100 words including demo link and no-pressure invitation to reply. Casual, helpful, non-salesy tone.`,

  malik: `You are Malik, the Demo Builder. Create fully deployable, SEO-optimized demo sites unique to the client lead, based on BKSConcrete.com model. Return clean, deployment-ready React or Next.js code.`,

  kendra: `You are Kendra, the Lead Qualifier. Score leads 1-10 for website potential. Give firm Go/No-Go recommendation. Use clear scoring and a paragraph of reasoning. Local SEO is priority.`,

  travis: `You are Travis, the Lead Scout. Find high-potential local service business leads with poor or no websites. Return 5-10 leads per request. Format each lead with Business Name, Location, Website, Why it's a good lead, Public email, Phone, Google/Facebook/Yelp link.`,

  dexter: `You are Dexter, the GPT Master Recorder. Maintain a complete, up-to-date list of all GPTs including names, titles, roles, prompt instructions, and notes. Track all changes and ensure no duplication.`,

  harlan: `You are Harlan, the Local Keyword Researcher. Monitor and update local keyword databases. Identify trends, suggest topics and SEO adjustments. Generate weekly reports with actionable insights.`,

  spotgap: `You are Spot-Gap, the Keyword Hunter. Scan large keyword databases and competitors for untapped opportunities. Alert Captain and Frankie with prioritized keyword lists and recommendations.`,

  eric: `You are Eric, the Interaction Monitor & Cold Email Optimizer. Analyze communication patterns for brand voice consistency. Refine cold email templates to match Captain’s style. Flag quality control issues. Provide reports and collaborate with Nina and Frankie.`,
};

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Respond concisely and clearly.`;

// Generic function to call any GPT by id with a message
async function callGPT(gptId, message) {
  const systemPrompt = GPT_SYSTEM_PROMPTS[gptId] || DEFAULT_SYSTEM_PROMPT;
  const prompt = `${systemPrompt}\nUser request: ${message}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  });

  return completion.choices[0].message.content;
}

// Parse Frankie's output to detect delegation commands in a structured way
function parseDelegations(frankieReply) {
  // Simple regex example to extract lines like:
  // "✅ Task Summary: Find leads for Raleigh, NC"
  // "👤 Assigned GPT: Travis"
  // "🧠 Prompt or Instructions: Find 5 leads for auto mechanics"
  // Collect multiple tasks into array

  const delegations = [];
  // Split reply by lines
  const lines = frankieReply.split('\n');

  let currentTask = null;
  for (const line of lines) {
    if (line.startsWith('✅ Task Summary:')) {
      if (currentTask) delegations.push(currentTask);
      currentTask = { summary: line.replace('✅ Task Summary:', '').trim() };
    } else if (line.startsWith('👤 Assigned GPT:') && currentTask) {
      currentTask.assignedGPT = line.replace('👤 Assigned GPT:', '').trim().toLowerCase();
    } else if (line.startsWith('🧠 Prompt or Instructions:') && currentTask) {
      currentTask.prompt = line.replace('🧠 Prompt or Instructions:', '').trim();
    } else if (line.startsWith('📌 Notes or Dependencies:') && currentTask) {
      currentTask.notes = line.replace('📌 Notes or Dependencies:', '').trim();
    }
  }
  if (currentTask) delegations.push(currentTask);

  // Return array of delegation objects with gptId and prompt
  return delegations.filter(d => d.assignedGPT && d.prompt);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;
  const { message } = req.body;

  if (!id) return res.status(400).json({ error: "Missing GPT id in URL" });
  if (!message) return res.status(400).json({ error: "Missing message in request body" });

  const gptId = id.toLowerCase();

  try {
    if (gptId === 'frankie') {
      // Step 1: Run Frankie
      const frankieReply = await callGPT('frankie', message);

      // Step 2: Parse delegation commands from Frankie’s reply
      const delegations = parseDelegations(frankieReply);

      // Step 3: Run delegated GPTs sequentially and collect results
      const delegationResults = {};
      for (const task of delegations) {
        delegationResults[task.assignedGPT] = await callGPT(task.assignedGPT, task.prompt);
      }

      // Step 4: Aggregate all responses into one structured object
      const fullResult = {
        frankie: frankieReply,
        delegations: delegationResults,
      };

      // Log to Prisma
      await prisma.gPTLog.create({
        data: {
          gptId,
          prompt: message,
          response: JSON.stringify(fullResult),
        },
      });
      await prisma.chatMessage.createMany({
        data: [
          { from: "user", text: message },
          { from: gptId, text: frankieReply },
        ],
      });

      // Return aggregated result
      res.status(200).json({ reply: fullResult });

    } else {
      // Non-Frankie GPTs: just call normally
      const reply = await callGPT(gptId, message);

      await prisma.gPTLog.create({
        data: {
          gptId,
          prompt: message,
          response: reply,
        },
      });
      await prisma.chatMessage.createMany({
        data: [
          { from: "user", text: message },
          { from: gptId, text: reply },
        ],
      });

      res.status(200).json({ reply });
    }

  } catch (error) {
    console.error(`GPT API error for ${gptId}:`, error);
    res.status(500).json({ error: "Failed to process GPT request" });
  } finally {
    await prisma.$disconnect();
  }
}
