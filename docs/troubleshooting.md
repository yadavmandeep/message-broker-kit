# Troubleshooting

> Common errors, fixes, and debugging tips for Message Broker Kit.

---

## Connection & Startup

### "Connection refused" / "ECONNREFUSED"

**Cause:** Broker not running or wrong host/port.

| Broker | Default | Check |
|--------|---------|------|
| RabbitMQ | `amqp://localhost:5672` | `docker run -d -p 5672:5672 rabbitmq` |
| Kafka | `localhost:9092` | `docker run -d -p 9092:9092 apache/kafka` |
| Redis | `redis://localhost:6379` | `redis-cli ping` |
| NATS | `nats://localhost:4222` | `nats-server` |
| MQTT | `mqtt://localhost:1883` | Mosquitto / Eclipse Mosquitto |

**Fix:** Start the broker, or correct `url` / `brokers` in your config. See [Broker Configuration Reference](./configuration/broker-configs.md).

---

### "Queue URL is required" (AWS SQS)

**Cause:** `queueUrl` is missing in SQS options.

**Fix:**
```typescript
options: {
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/queue-name',
  region: 'us-east-1'
}
```

---

### "restProxyUrl is required" (Serverless)

**Cause:** Serverless adapter needs an HTTP proxy URL.

**Fix:** Provide a proxy that accepts POST with `{ payload: PublishData }` and forwards to your broker.

---

## Publishing

### Messages not reaching consumers

1. **Topic/queue name mismatch** — Publisher and subscriber must use the same `topic` string.
2. **Broker-specific routing** — RabbitMQ uses exchanges; Kafka uses topics. Ensure names exist.
3. **Consumer not started** — Call `subscribe()` before or shortly after `publish()`.

---

### "Failed to push message via REST proxy" (Serverless)

**Cause:** Proxy unreachable, timeout, or auth failure.

**Fix:** Check `restProxyUrl`, `apiKey`, and `timeoutMs`. Ensure proxy returns 2xx on success.

---

## Subscribing & Consumption

### Messages processed multiple times (duplicates)

**Cause:** At-least-once delivery; consumer crashes before ack.

**Fix:** Enable idempotency or use idempotent handlers:
```typescript
enterprise: { idempotency: { enabled: true, ttlMs: 60000 } }
```

---

### Consumer stops processing / no new messages

1. **Circuit breaker open** — Too many failures; circuit is open for `resetTimeoutMs`. Wait or fix downstream.
2. **Rate limit hit** — `maxMessagesPerSecond` throttling. Increase or tune.
3. **Connection dropped** — Check broker logs; reconnect/restart consumer.

---

## Encryption

### "Invalid key length" / AES errors

**Cause:** `secretKey` must be exactly 32 characters for AES-256.

**Fix:**
```typescript
secretKey: 'exactly-32-characters-long-key!!'
```

---

### Decryption fails on consumer

**Cause:** Publisher and consumer use different `secretKey` or `fieldsToEncrypt`.

**Fix:** Use identical `encryption` config on both sides. See [Payload Encryption](./advanced-features/1-payload-encryption.md).

---

## Dead Letter Queue (DLQ)

### Messages not appearing in DLQ

1. **DLQ not enabled** — `dlq: { enabled: true, topicName: 'YourDLQ' }`
2. **Retries not exhausted** — Message must fail `maxRetries` times first.
3. **Topic/queue name** — Ensure DLQ topic exists on your broker.

---

### How to re-process DLQ messages

Use the [Smart DLQ Dashboard](./tools/1-smart-dlq-dashboard.md) to inspect, edit, and re-enqueue. Or consume from the DLQ topic and re-publish to the main topic manually.

---

## Saga & Outbox

### Saga compensation not firing

**Cause:** Compensation events must be consumed by services that perform the original action.

**Fix:** Ensure each saga step has a corresponding consumer for its `compensationEvent`. See [Saga Pattern](./architecture/2-saga-pattern.md).

---

### Outbox events stuck in PENDING

**Cause:** `OutboxProcessor` not running, or broker unreachable.

**Fix:** Call `outboxProcessor.start()` and ensure broker is connected. Check `pollIntervalMs` and `batchSize`. See [Transactional Outbox](./architecture/1-transactional-outbox.md).

---

## Environment-Specific

### Vercel / Cloudflare Workers / Lambda — "Cannot connect" / TCP errors

**Cause:** Edge runtimes block persistent TCP (amqplib, kafkajs).

**Fix:** Use `type: 'serverless'` with an HTTP proxy. See [Serverless / Edge](./architecture/3-serverless-edge.md).

---

### Docker — "Connection refused" to localhost

**Cause:** From inside a container, `localhost` refers to the container itself, not the host.

**Fix:** Use host networking, or `host.docker.internal` (Docker Desktop), or the service name in Docker Compose.

---

## Getting More Help

- [Documentation Hub](./INDEX.md) — full doc map  
- [Quick Reference](./quick-reference.md) — API cheat sheet
