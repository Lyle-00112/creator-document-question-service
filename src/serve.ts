import { createServer } from "node:http";
import { answerQuestion } from "./qa_service.js";

createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/question") { res.writeHead(404); res.end(); return; }
  try {
    const body = await new Promise<string>((resolve) => { let data = ""; req.on("data", (chunk) => { data += chunk; }); req.on("end", () => resolve(data)); });
    const result = await answerQuestion(JSON.parse(body));
    res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(result));
  } catch (error) { res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ error: error instanceof Error ? error.message : "invalid request" })); }
}).listen(Number(process.env.PORT ?? 8787));
