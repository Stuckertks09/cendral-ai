// memory/semantic/embedEvent.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedEvent(event) {
  const text = `
Event Type: ${event.type}
Domain: ${event.domain}
Topic: ${event.topic ?? "none"}
Severity: ${event.severity ?? "n/a"}
Actor: ${event.actor ?? "n/a"}
Target: ${event.target ?? "n/a"}
Theater: ${event.theater ?? "n/a"}
Summary: ${event.parsed?.summary ?? event.rawText}
Keywords: ${(event.parsed?.keywords || []).join(", ")}
  `.trim();

  const res = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text
  });

  return res.data[0].embedding;
}
