// memory/semantic/queryMemory.js
export async function queryMemory(pineconeIndex, embedding, {
  topK = 8,
  namespace,
  filter = {}
} = {}) {

  const queryRes = await pineconeIndex.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    namespace,
    filter,
  });

  return queryRes.matches || [];
}
