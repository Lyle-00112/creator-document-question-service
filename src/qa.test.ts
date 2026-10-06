import assert from "node:assert/strict";
import { questionBody } from "./qa_service.js";

const parsed = questionBody.parse({ question: "When is the next subscriber update?", subscriberId: "sub_42" });
assert.equal(parsed.subscriberId, "sub_42");
assert.throws(() => questionBody.parse({ question: "", subscriberId: "sub_42" }));
console.log("request boundary: valid question accepted, empty question rejected");
