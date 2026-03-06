# Serverless / Edge Optimized ☁️

For environments that don't allow persistent TCP sockets (`amqplib` or `kafkajs` fail on functions executing across Vercel, Cloudflare Workers, AWS Lambda endpoints due to time/socket constraints). Use an HTTP proxy to publish — same API, no TCP.

## The Setup 
Use `type: 'serverless'` in the initialization block to fall back to a "Connection-less stateless processing mode" (via HTTP REST proxies).

```typescript
import { MessageBrokerFactory } from 'message-broker-kit';

const broker = MessageBrokerFactory.create({
  type: 'serverless', // Uses ServerlessRESTAdapter
  options: {
     restProxyUrl: 'https://my-cloudflare-worker.workers.dev/publish',
     apiKey: 'eyJhbGciOiJIUz...',
     timeoutMs: 8000
  }
});

async function triggerBackgroundJob() {
  await broker.publish({
    topic: 'BackgroundTasks',
    event: 'ResizeImageJob',
    message: { s3Url: 's3://bucket/image.jpg' }
  });
  console.log("Job sent connectionless!");
}
```

The serverless adapter will package the standard payload wrapper and forward it synchronously via `axios.post()` to your proxy endpoint, returning a unified response mimicking standard stream publishing success.

**Related:** [Broker Configs](../configuration/broker-configs.md) | [Troubleshooting](../troubleshooting.md) | [Doc Hub](../INDEX.md)
