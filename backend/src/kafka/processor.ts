import kafka from './client';
import { mockPublish, mockSubscribe } from './mock';
import { isKafkaConnected } from './producer';

const SPAM_KEYWORDS = ['win', 'free', 'click', 'prize', 'offer', 'buy now', 'limited', 'urgent'];

const processEvent = (raw: any) => {
  const text = `${raw.title} ${raw.message}`.toLowerCase();
  const isSpam = SPAM_KEYWORDS.some((kw) => text.includes(kw));

  return {
    ...raw,
    isSpam,
    wordCount: raw.message.split(' ').length,
    charCount: raw.message.length,
    processedAt: new Date().toISOString(),
    spamKeywordsFound: SPAM_KEYWORDS.filter((kw) => text.includes(kw)),
  };
};

const handleRawEvent = async (value: Buffer | null | undefined) => {
  if (!value) return;
  try {
    const raw = JSON.parse(value.toString());
    const processed = processEvent(raw);

    console.log(`[Processor] Event processed. Spam: ${processed.isSpam}`);

    if (isKafkaConnected) {
      const producer = kafka.producer();
      await producer.connect();
      await producer.send({
        topic: 'processed-events',
        messages: [{ value: JSON.stringify(processed) }],
      });
      await producer.disconnect();
    } else {
      mockPublish('processed-events', processed);
    }
  } catch (err) {
    console.error('[Processor] Error processing event:', err);
  }
};

export const startProcessor = async () => {
  if (isKafkaConnected) {
    const consumer = kafka.consumer({ groupId: 'processor-group' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'raw-events', fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ message }) => {
        await handleRawEvent(message.value);
      },
    });
    console.log('✅ Real Kafka Processor started (raw-events → processed-events)');
  } else {
    mockSubscribe('raw-events', async ({ message }) => {
      await handleRawEvent(message.value);
    });
    console.log('✅ Mock Processor started (raw-events → processed-events)');
  }
};
