// memory/semantic/embedPersona.js
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedPersona(persona) {
  const text = `
Persona: ${persona.identity?.name}
Values: ${JSON.stringify(persona.values)}
Beliefs: ${JSON.stringify(persona.beliefs)}
Traits: ${JSON.stringify(persona.traits)}
Domain Extensions: ${Object.keys(persona.extensions || {}).join(", ")}
  `.trim();

  const res = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
  });

  return res.data[0].embedding;
}
