import kafka from './client';
import { Server } from 'socket.io';
import { mockSubscribe } from './mock';
import { isKafkaConnected } from './producer';
import { EventModel } from '../db/eventModel';
import mongoose from 'mongoose';

// In-memory analytics stats
export const stats = {
  total: 0,
  valid: 0,
  spam: 0,
  history: [] as { time: string; total: number; valid: number; spam: number }[],
};

const handleProcessedEvent = async (value: Buffer | null | undefined, io: Server) => {
  if (!value) return;
  try {
    const event = JSON.parse(value.toString());

    // Persist to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await EventModel.findOneAndUpdate(
          { eventId: event.id },
          {
            eventId:           event.id,
            title:             event.title,
            message:           event.message,
            isSpam:            event.isSpam,
            wordCount:         event.wordCount,
            charCount:         event.charCount,
            spamKeywordsFound: event.spamKeywordsFound,
            timestamp:         event.timestamp,
            processedAt:       event.processedAt,
          },
          { upsert: true, new: true }
        );
        console.log('[DB] Event saved to MongoDB');
      } catch (dbErr) {
        console.error('[DB] Failed to save event:', dbErr);
      }
    }

    // Update in-memory stats
    stats.total++;
    if (event.isSpam) {
      stats.spam++;
    } else {
      stats.valid++;
    }

    const snapshot = {
      time: new Date().toLocaleTimeString(),
      total: stats.total,
      valid: stats.valid,
      spam: stats.spam,
    };
    stats.history.push(snapshot);
    if (stats.history.length > 20) stats.history.shift();

    console.log(`[Consumer] Event processed. Total: ${stats.total}, Spam: ${stats.spam}`);

    io.emit('notification', event);
    io.emit('analytics', { ...stats });
  } catch (err) {
    console.error('Error handling processed event:', err);
  }
};

export const startConsumer = async (io: Server) => {
  if (isKafkaConnected) {
    try {
      const consumer = kafka.consumer({ groupId: 'main-consumer-group' });
      await consumer.connect();
      console.log('✅ Kafka Consumer connected');
      await consumer.subscribe({ topic: 'processed-events', fromBeginning: false });
      await consumer.run({
        eachMessage: async ({ message }) => {
          await handleProcessedEvent(message.value, io);
        },
      });
    } catch (error) {
      console.error('Consumer failed:', error);
    }
  } else {
    mockSubscribe('processed-events', async ({ message }) => {
      await handleProcessedEvent(message.value, io);
    });
    console.log('✅ Mock Consumer started (listening to processed-events)');
  }
};

export const disconnectConsumer = async () => {
  console.log('Consumer shut down');
};
