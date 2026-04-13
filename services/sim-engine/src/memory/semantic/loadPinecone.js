import { Pinecone } from "@pinecone-database/pinecone";

let pinecone = null;

export async function initPinecone() {
  if (pinecone) return pinecone;

  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  console.log("✅ Pinecone client initialized");

  return pinecone;
}
