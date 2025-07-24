import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message in request body" });
  }

  try {
    const prompt = `You are GPT named ${id}. Respond concisely to: ${message}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = completion.choices[0].message.content;

    await prisma.gPTLog.create({
      data: {
        gptId: id,
        prompt,
        response: reply,
      },
    });

    await prisma.chatMessage.createMany({
      data: [
        { from: "user", text: message },
        { from: id, text: reply },
      ],
    });

    res.status(200).json({ reply });
  } catch (error) {
    console.error("GPT API error:", error);
    res.status(500).json({ error: "Failed to process GPT request" });
  } finally {
    await prisma.$disconnect();
  }
}
