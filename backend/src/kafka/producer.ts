import kafka from './client';
import { mockPublish } from './mock';

const producer = kafka.producer();
export let isKafkaConnected = false;

export const connectProducer = async () => {
  try {
    await producer.connect();
    isKafkaConnected = true;
    console.log('✅ Kafka Producer connected (Real Kafka)');
  } catch (error) {
    console.warn('⚠️  Could not connect to real Kafka. Using in-memory Mock fallback.');
    isKafkaConnected = false;
  }
};

export const disconnectProducer = async () => {
  if (isKafkaConnected) {
    await producer.disconnect();
    console.log('Kafka Producer disconnected');
  }
};

export const sendMessage = async (topic: string, message: any) => {
  try {
    if (isKafkaConnected) {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      console.log(`[Real Kafka] Message sent to topic: ${topic}`);
    } else {
      console.log(`[Mock Kafka] Message published to topic: ${topic}`);
      mockPublish(topic, message);
    }
  } catch (error) {
    console.error('Error sending message, falling back to mock:', error);
    mockPublish(topic, message);
  }
};
