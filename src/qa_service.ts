import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";

export const questionBody = z.object({ question: z.string().min(1), subscriberId: z.string().min(1) });
type Chunk = { id: string; text: string; metadata: { title: string; page: number } };
type Reranked = { candidate: Chunk; score: number };

export async function answerQuestion(raw: unknown, client = new InfraiClient()) {
  const input = questionBody.parse(raw);
  const embedding = await client.embed(input.question);
  const found = await client.request<{ vectors: Chunk[] }>("/v1/vector/query", { collection: "creator-documents", embedding, top_k: 8, filter: { subscriberId: input.subscriberId }, include_metadata: true });
  const candidates = (found.vectors ?? []).map((chunk) => ({ id: chunk.id, text: chunk.text }));
  const ranked = await client.request<Reranked[]>("/v1/ai/rerank", { query: input.question, candidates, top_k: 3, model: "auto", vendor: "auto" });
  return { answer: (ranked[0]?.candidate.text ?? "No matching document passage found."), sources: ranked.map((item) => item.candidate.metadata) };
}
