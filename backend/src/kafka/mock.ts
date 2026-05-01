import { EventEmitter } from 'events';

// In-memory event bus to simulate Kafka topics
export const mockKafka = new EventEmitter();
mockKafka.setMaxListeners(20);

// Simulate a topic-based message structure
export const mockPublish = (topic: string, message: any) => {
  mockKafka.emit(topic, {
    topic,
    message: { value: Buffer.from(JSON.stringify(message)) },
  });
};

export const mockSubscribe = (topic: string, callback: (data: { topic: string; message: { value: Buffer } }) => void) => {
  mockKafka.on(topic, callback);
};
