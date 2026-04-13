import OpenAI from "openai";

let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export default async function embedText(text) {
  const c = getClient();
  
  const res = await c.embeddings.create({
    input: text,
    model: "text-embedding-3-large",
  });

  return res.data[0].embedding;
}
