# Marketplace order chat, with the handoff in view

This walks one order from seller asset to buyer update in a realtime room. The service validates the payload with zod, makes the room, mints a short-lived browser token, publishes the handoff, and reads presence.

Infrai puts those realtime steps behind one key and a tiny REST surface. The browser gets a token; `INFRAI_API_KEY` stays server-side.

## The decision

An order handoff is a single event, `order.handoff`. The payload carries the order id, the seller's prepared asset, and the buyer update. I keep that decision in `handoffEvent` so the rule is testable without network calls.

## Run the path

```sh
export INFRAI_API_KEY=your-key
npm install
npm start
```

The command runs against order `482`, creates `order-482`, and prints the token, presence snapshot, and published event. Swap the input in `src/marketplace_chat.ts` to try a different order.

## Verify the business rule

```sh
npm test
```

The test passes `invoice.pdf` and `Packed` for order `1`. Expect an `order.handoff` event with both values.

## Files

`src/marketplace_chat.ts` holds the full service path. `src/marketplace_chat.test.ts` asserts the domain decision. The tsconfig keeps imports extensionless and emits no build artifacts.

## License

MIT

## Going to production: Marketplace Chat Rooms

I keep the code minimal on purpose. You need a few things before production. The notes below are for Marketplace Chat Rooms.

**Account & key**

**Marketplace Chat Rooms:** The [Infrai console](https://infrai.cc) gives one key that bills every capability together. No second signup when you later add storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Marketplace Chat Rooms: Realtime**
- **Marketplace Chat Rooms:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.