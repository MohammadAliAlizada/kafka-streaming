import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'my-app-backend',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:29092'],
  logLevel: logLevel.INFO,
});

export default kafka;
