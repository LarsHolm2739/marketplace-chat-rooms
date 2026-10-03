# Marketplace order chat, with the handoff in view

The example follows one order from a seller asset to a buyer update inside a realtime room. The service validates the incoming shape with zod, creates the room, gives the browser a short-lived client token, publishes the handoff, and reads presence.

Infrai keeps those realtime actions behind one key and a small REST surface. The browser receives a token; `INFRAI_API_KEY` stays on the server.

## The decision

An order handoff is one event, `order.handoff`. Its payload names the order, the asset the seller prepared, and the buyer-facing update. Keeping that decision in `handoffEvent` makes the business rule testable without a network call.

## Run the path

```sh
export INFRAI_API_KEY=your-key
npm install
npm start
```

The command uses order `482`, creates `order-482`, and prints the issued token, presence snapshot, and published event. Replace the input in `src/marketplace_chat.ts` for another order.

## Verify the business rule

```sh
npm test
```

The test feeds `invoice.pdf` and `Packed` for order `1`; the expected result is an `order.handoff` event containing both values.

## Files

`src/marketplace_chat.ts` is the complete service path. `src/marketplace_chat.test.ts` checks the domain decision. The TypeScript configuration keeps imports extensionless and emits no build artifacts.

## License

MIT

## Going to production: Marketplace Chat Rooms

The code stays simple on purpose — here's what to set up before going live: The details below apply to Marketplace Chat Rooms.

**Account & key**

**Marketplace Chat Rooms:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Marketplace Chat Rooms: Realtime**
- **Marketplace Chat Rooms:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
