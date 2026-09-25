import test from "node:test";
import assert from "node:assert/strict";
import { handoffEvent } from "./marketplace_chat.js";

test("handoff event carries the seller asset and buyer update for one order", () => {
  assert.deepEqual(handoffEvent({ room: "order-1", orderId: "1", sellerAsset: "invoice.pdf", buyerUpdate: "Packed" }), {
    type: "order.handoff", orderId: "1", sellerAsset: "invoice.pdf", buyerUpdate: "Packed"
  });
});
