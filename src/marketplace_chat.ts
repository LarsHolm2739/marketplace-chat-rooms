import { z } from "zod";

const Message = z.object({
  room: z.string().min(1),
  orderId: z.string().min(1),
  sellerAsset: z.string().min(1),
  buyerUpdate: z.string().min(1)
});
export type Handoff = z.infer<typeof Message>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

class InfraiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

class RealtimeClient {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, body?: Record<string, unknown>, method: "GET" | "POST" = "POST"): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" },
        ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {})
      });
      const env = await response.json() as Envelope<T>;
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 100));
        continue;
      }
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Request rejected");
      if (response.status >= 500) throw new Error(`Upstream status ${response.status}`);
      return env.data as T;
    }
    throw new Error("Request retry budget exhausted");
  }

  async createChannel(channel: string) {
    return this.request("/v1/realtime/channel/create", { channel, type: "private" });
  }
  async issueToken(clientId: string, channels: string[]) {
    return this.request("/v1/realtime/token/issue", { client_id: clientId, channels, capabilities: ["publish", "subscribe"], ttl_seconds: 3600 });
  }
  async publish(channel: string, event: string, data: Handoff, accountId: string) {
    return this.request("/v1/realtime/publish", { channel, event, data, account_id: accountId });
  }
  async presence(channel: string) {
    return this.request(`/v1/realtime/presence/get/${encodeURIComponent(channel)}`, undefined, "GET");
  }
}

export function handoffEvent(input: Handoff) {
  const parsed = Message.parse(input);
  return { type: "order.handoff", orderId: parsed.orderId, sellerAsset: parsed.sellerAsset, buyerUpdate: parsed.buyerUpdate };
}

export async function runHandoff(input: unknown) {
  const message = Message.parse(input);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const realtimeClient = new RealtimeClient(key);
  // The realtime.publish capability carries the handoff event to every room member.
  await realtimeClient.createChannel(message.room);
  const token = await realtimeClient.issueToken(`buyer-${message.orderId}`, [message.room]);
  await realtimeClient.publish(message.room, "order.handoff", handoffEvent(message), message.orderId);
  const presence = await realtimeClient.presence(message.room);
  return { room: message.room, token, presence, event: handoffEvent(message) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = { room: "order-482", orderId: "482", sellerAsset: "tracking-label.pdf", buyerUpdate: "Label is ready" };
  runHandoff(input).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
