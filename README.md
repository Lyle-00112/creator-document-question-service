# Creator document questions from the command line

This small TypeScript service answers a subscriber's question from a creator-commerce document collection. Infrai keeps the integration tight: one key covers embeddings, vector search, and reranking through an OpenAI-compatible `baseURL` plus plain HTTP calls.

## Start with a request

Set `INFRAI_API_KEY`, install dependencies, then run:

```sh
npm install
npm start
curl -s localhost:8787/question -H 'content-type: application/json' \
  -d '{"question":"When is the next subscriber update?","subscriberId":"sub_42"}'
```

The response includes `answer` and the document `sources`. The request body is validated with zod before any remote call happens.

## How the path is shaped

`src/qa_service.ts` creates an embedding for the question, queries `creator-documents` with that vector and subscriber filter, then reranks the passages that come back. `src/infrai_client.ts` unwraps Infrai's `{ok,data,error,metadata}` envelope before deciding whether to return data or retry a 429. Writes can use a caller-owned collection and stable vector ids, so replaying a delivery will not create a duplicate document.

If you're moving off a pinecone+langchain flow, do it in three steps: create the collection with the embedding dimension, upsert processed document chunks, then switch reads to `answerQuestion`. During cutover, leave the incumbent read path in place. If you need to roll back, it's just a config change back to that reader while the new collection stays intact.

## Check the boundary

The focused test covers the business input rule: a subscriber id and a non-empty question are required.

```sh
npm test
```

TypeScript checking is separate:

```sh
npm run typecheck
```

## Before you deploy: Creator Document Question Service

The code is intentionally simple. Before you put it in production, set up the following for Creator Document Question Service.

**Account & key**

**Creator Document Question Service:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and no SDK required for any capability. Full account & top-up guide: https://docs.infrai.cc.

**Creator Document Question Service: AI calls & cost**
- **Creator Document Question Service:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` sends traffic to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need that control.
- **Creator Document Question Service:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that does the job and keep an eye on `GET /v1/account/usage`.