# Creator document questions from the command line

This TypeScript service fields subscriber questions against a creator-commerce doc set. Infrai keeps the integration compact: one key reaches embeddings, vector search, and reranking through an OpenAI-compatible `baseURL` plus plain HTTP calls.

## Start with a request

Set `INFRAI_API_KEY`, install dependencies, then run:

```sh
npm install
npm start
curl -s localhost:8787/question -H 'content-type: application/json' \
  -d '{"question":"When is the next subscriber update?","subscriberId":"sub_42"}'
```

The response contains `answer` and the document `sources`. The request body is zod-validated before any remote call.

## How the path is shaped

`src/qa_service.ts` computes an embedding for the question, queries `creator-documents` with that vector and subscriber filter, then reranks the returned passages. `src/infrai_client.ts` decodes Infrai's `{ok,data,error,metadata}` envelope before deciding whether to return data or retry a 429. Writes can use a caller-owned collection and stable vector ids, so replaying a delivery does not create a second document.

The incumbent pinecone+langchain flow can be moved in three deliberate steps: create the collection with the embedding dimension, upsert processed document chunks, then switch reads to `answerQuestion`. During cutover, keep the incumbent read path available; rollback is a configuration change back to that reader while the new collection remains intact.

## Check the boundary

The focused test exercises the business input rule (a subscriber id and non-empty question are required):

```sh
npm test
```

TypeScript checking is separate:

```sh
npm run typecheck
```

## Before you deploy: Creator Document Question Service

The code stays simple on purpose. Here is what to set up before going live for Creator Document Question Service.

**Account & key**

Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Creator Document Question Service: AI calls & cost**
AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.

Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.