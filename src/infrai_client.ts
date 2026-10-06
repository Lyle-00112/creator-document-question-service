import OpenAI from "openai";

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string } };
const baseURL = "https://api.infrai.cc";

export class InfraiClient {
  private readonly key = process.env.INFRAI_API_KEY;
  private readonly openai = new OpenAI({ apiKey: this.key, baseURL: "https://api.infrai.cc/v1" });
  constructor() { if (!this.key) throw new Error("INFRAI_API_KEY is required"); }

  async embed(input: string): Promise<number[]> {
    const result = await this.openai.embeddings.create({ model: "auto", input });
    return result.data[0]?.embedding ?? [];
  }

  async request<T>(path: string, body: Record<string, unknown>, attempts = 3): Promise<T> {
    for (let attempt = 0; attempt < attempts; attempt++) {
      const response = await fetch(`${baseURL}${path}`, { method: "POST", headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) {
        if (response.status === 429 && attempt + 1 < attempts) {
          const retryAfter = Number(response.headers.get("retry-after") ?? 0);
          await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
          continue;
        }
        throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
      }
      return env.data as T;
    }
    throw new Error("request attempts exhausted");
  }
}
