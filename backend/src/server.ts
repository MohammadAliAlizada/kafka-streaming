import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectProducer, disconnectProducer, sendMessage } from './kafka/producer';
import { startConsumer, disconnectConsumer, stats } from './kafka/consumer';
import { startProcessor } from './kafka/processor';
import { connectMongo, disconnectMongo } from './db/mongo';
import { EventModel } from './db/eventModel';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// POST: Publish new event to raw-events topic
app.post('/api/notifications', async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }
  const event = {
    id: Date.now().toString(),
    title,
    message,
    timestamp: new Date().toISOString(),
  };
  await sendMessage('raw-events', event);
  res.status(200).json({ success: true, data: event });
});

// GET: Fetch all stored events from MongoDB (history)
app.get('/api/events', async (_req, res) => {
  try {
    const events = await EventModel.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json(events);
  } catch {
    res.json([]); // Return empty if DB not available
  }
});

// DELETE: Clear all stored events
app.delete('/api/events', async (_req, res) => {
  try {
    await EventModel.deleteMany({});
    res.json({ success: true, message: 'All events cleared' });
  } catch {
    res.status(500).json({ error: 'Failed to clear events' });
  }
});

// GET: Current analytics snapshot
app.get('/api/analytics', (_req, res) => {
  res.json(stats);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('analytics', { ...stats });
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectMongo();           // Connect to MongoDB (graceful if unavailable)
    await connectProducer();        // Connect Kafka producer (falls back to mock)
    await startProcessor();         // Start stream processor
    await startConsumer(io);        // Start consumer + Socket.io bridge

    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Critical server error:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  await disconnectProducer();
  await disconnectConsumer();
  await disconnectMongo();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await disconnectProducer();
  await disconnectConsumer();
  await disconnectMongo();
  process.exit(0);
});
