# Serverless and Edge Support

Some runtimes do not allow long-lived TCP connections. For example, on Vercel, Cloudflare Workers, or AWS Lambda, you often cannot use drivers that keep a socket open (e.g. `amqplib` for RabbitMQ or `kafkajs` for Kafka). The **serverless adapter** lets you **publish** messages by sending an HTTP request to a proxy that then talks to your broker. The same `publish()` API is used; only the transport changes.

**Important:** This adapter supports **publish only**. It does not support `subscribe()` (consuming). In serverless/edge environments, consumption is usually done via webhooks, event triggers, or a separate long-running consumer service.

---

## When to use it

- You run **publishers** on Vercel, Cloudflare Workers, AWS Lambda, or similar.
- You cannot or do not want to open a persistent connection to RabbitMQ, Kafka, etc., from those environments.
- You have (or can add) an HTTP endpoint (e.g. a small Node service or worker) that receives the message payload and publishes it to the real broker.

---

## How it works

1. You create a broker with `type: 'serverless'` and `options.restProxyUrl` pointing to your HTTP proxy.
2. When you call `broker.publish(...)`, the kit sends a POST request to that URL with the same payload shape (topic, event, message, headers). No TCP connection to the broker is made from your serverless/edge code.
3. Your proxy receives the request, validates it (e.g. with `apiKey`), and publishes to your actual broker (RabbitMQ, Kafka, etc.). Then it returns a success response.

---

## Configuration

| Option | Required | Description |
|--------|----------|-------------|
| `restProxyUrl` | Yes | Full URL of your HTTP proxy (e.g. `https://my-worker.workers.dev/publish`). |
| `apiKey` | No | If set, sent as `Authorization: Bearer <apiKey>`. Use it to secure the proxy. |
| `timeoutMs` | No | Request timeout in milliseconds (default: 5000). |

---

## Example: publisher in a serverless function

```typescript
import { MessageBrokerFactory } from '@universal-broker/cli';

const broker = await MessageBrokerFactory.create({
  type: 'serverless',
  options: {
    restProxyUrl: 'https://my-cloudflare-worker.workers.dev/publish',
    apiKey: process.env.BROKER_PROXY_API_KEY,
    timeoutMs: 8000,
  },
});

export async function handler(req: Request) {
  const body = await req.json();
  await broker.publish({
    topic: 'BackgroundTasks',
    event: 'ResizeImageJob',
    message: { s3Url: body.s3Url },
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
```

The serverless adapter sends the standard payload (topic, event, message, headers) to `restProxyUrl`. Your proxy must accept that format and publish to your broker; then return a success response (e.g. 2xx). If the proxy returns an error or times out, `publish()` will throw.

---

## Subscribe (consumption) in serverless

`subscribe()` is **not** supported by the serverless adapter. For consumption in a serverless/edge context you typically:

- Use a **webhook**: the broker or a gateway calls your HTTP endpoint when a message is available.
- Run a **separate consumer service** (e.g. a long-running Node process or container) that uses a normal broker adapter (e.g. RabbitMQ or Kafka) and calls your business logic or forwards to your serverless function.

---

**Related:** [Broker Configuration Reference](../configuration/broker-configs.md) · [Troubleshooting](../troubleshooting.md) · [Doc Hub](../INDEX.md)
