import OpenAI from "openai";

/**
 * Returns:
 * {
 *   relevant,
 *   relevance_score,
 *   domains,
 *   topics,
 *   actors,
 *   location,
 *   event_type,
 *   one_sentence_brief
 * }
 *
 * NO severity.
 */
export async function computeRelevance({ headline, description }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  // ✅ Initialize client INSIDE the function
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
You classify news signals for defense/geopolitical event modeling relevance.

DO NOT assess severity, impact, threat level, or consequences.

Given:
Headline: "${headline}"
Description: "${description}"

Return strict JSON ONLY with keys:
{
  "relevant": boolean,
  "relevance_score": number,
  "domains": string[],
  "topics": string[],
  "actors": string[],
  "location": string | null,
  "event_type": string | null,
  "one_sentence_brief": string
}
`.trim();

  const model = process.env.OSINT_LLM_MODEL || "gpt-4.1-mini";

  const resp = await client.chat.completions.create({
    model,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: "Return only valid JSON. No markdown. No extra text.",
      },
      { role: "user", content: prompt },
    ],
  });

  const text = resp.choices?.[0]?.message?.content?.trim() || "{}";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    // Fail safe: treat as irrelevant
    return {
      relevant: false,
      relevance_score: 0,
      domains: [],
      topics: [],
      actors: [],
      location: null,
      event_type: null,
      one_sentence_brief: headline || "",
      _raw: text,
    };
  }

  // Clamp relevance score
  const score = Number(parsed.relevance_score);
  parsed.relevance_score =
    Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0;

  return parsed;
}
