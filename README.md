# ⚡ KafkaStream — Real-Time Event Processing System

A full-stack, production-inspired event streaming application built with **Node.js**, **Express**, **Next.js**, and **Apache Kafka**. It demonstrates a real-world event-driven architecture with stream processing, spam detection, real-time WebSocket broadcasting, MongoDB persistence, and a live analytics dashboard.

---

## 📸 Screenshots

### Event Stream — Producer & Consumer
> Send events on the left. They flow through Kafka, get processed for spam, then appear instantly on the right.

![Event Stream](./screenshots/event-stream.png)

### Live Analytics Dashboard
> Real-time charts showing total, valid, and spam event counts — updated live via WebSockets.

![Analytics Dashboard](./screenshots/analytics.png)

### Event Trend Analysis
> Cumulative history showing the progression of processed events over time.

![History Chart](./screenshots/history-chart.png)

---

## 🏗️ Architecture

```
┌──────────────┐     POST /api/notifications     ┌─────────────────────────────────────┐
│  Next.js UI  │ ──────────────────────────────► │         Express Backend              │
│  (Frontend)  │                                  │                                     │
│              │ ◄──────────────────────────────  │  Kafka Producer ──► raw-events      │
│  WebSocket   │       Socket.io (real-time)      │       │                             │
│  (Socket.io) │                                  │  Stream Processor (spam detection)  │
└──────────────┘                                  │       │                             │
                                                  │  Kafka Consumer ◄── processed-events│
                                                  │       │                             │
                                                  │  MongoDB (persistence)              │
                                                  └─────────────────────────────────────┘
```

**Flow:**
1. User submits an event from the frontend form
2. Express publishes it to the **`raw-events`** Kafka topic
3. The **Stream Processor** reads from `raw-events`, analyzes the message for spam keywords, adds metadata (word count, char count), and publishes to **`processed-events`**
4. The **Kafka Consumer** reads from `processed-events`, saves it to **MongoDB**, updates analytics counters, and broadcasts via **Socket.io**
5. The Next.js frontend receives the event in real-time and displays it — no page refresh needed

---

## 🛠️ Tech Stack

### Backend (`/backend`)
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server, HTTP endpoints |
| **KafkaJS** | Kafka producer & consumer client |
| **Apache Kafka** (via Docker or Mock) | Message broker — `raw-events` and `processed-events` topics |
| **Socket.io** | Real-time WebSocket server to push events to the frontend |
| **Mongoose + MongoDB** | Data persistence — stores all processed events |
| **TypeScript** | Strongly typed backend code |
| **dotenv** | Environment variable management |
| **ts-node-dev** | Dev server with hot reload |

### Frontend (`/frontend`)
| Technology | Purpose |
|---|---|
| **Next.js 15 (App Router)** | React framework with file-based routing |
| **TypeScript** | Type-safe React components |
| **Socket.io Client** | Real-time WebSocket connection to backend |
| **Recharts** | Animated charts (Donut, Bar, Line) for analytics |
| **Vanilla CSS** | Custom dark-mode design system, no CSS framework |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker + docker-compose** | Runs Kafka + Zookeeper locally |
| **MongoDB Atlas** | Cloud database for event persistence |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop (for local Kafka) — OR a free [Confluent Cloud](https://confluent.io/get-started) cluster
- MongoDB — local install OR a free [MongoDB Atlas](https://mongodb.com/atlas) cluster

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/kafkastream.git
cd kafkastream
```

### 2. Set Up the Backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
# Kafka (leave empty to use in-memory mock)
KAFKA_BROKERS=localhost:29092
KAFKA_USERNAME=
KAFKA_PASSWORD=

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kafkastream

# Server
PORT=4000
```

### 3. Set Up the Frontend
```bash
cd frontend
npm install
```

### 4. Start Kafka (Optional — skip to use Mock)
```bash
# From the root directory
docker-compose up -d
```

### 5. Run the App
**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/notifications` | Publish a new event to Kafka |
| `GET` | `/api/events` | Fetch all stored events from MongoDB |
| `DELETE` | `/api/events` | Clear all stored events |
| `GET` | `/api/analytics` | Get current analytics snapshot |

---

## 🔍 Features

### ✅ Real-Time Event Streaming
- Submit events from the left panel
- Events appear instantly in the right panel via WebSockets (no page refresh)
- Connection status indicator shows live/disconnected state

### 🚫 Spam Detection (Stream Processing)
- Events are processed through a pipeline before reaching the consumer
- Detects spam keywords: `win`, `free`, `click`, `prize`, `offer`, `buy now`, `limited`, `urgent`
- Each event is tagged with: `isSpam`, `wordCount`, `charCount`, `spamKeywordsFound`

### 📊 Live Analytics Dashboard
- **Stat Cards**: Total, Valid, and Spam event counts
- **Donut Chart**: Real-time valid vs spam distribution
- **Bar Chart**: Side-by-side breakdown
- **Line Chart**: Cumulative trend over time

### 💾 MongoDB Persistence
- All processed events are saved to MongoDB
- Page history loads from the database on startup
- "Clear History" button wipes the database

### 🔄 Smart Kafka Fallback
- If no Kafka broker is available, the app automatically uses an **in-memory Mock Kafka** (Node.js `EventEmitter`)
- The app is fully functional without Docker or a cloud Kafka cluster

---

## 📁 Project Structure

```
kafka/
├── docker-compose.yml          # Kafka + Zookeeper setup
├── .gitignore
├── README.md
│
├── backend/
│   ├── src/
│   │   ├── server.ts           # Express server + Socket.io
│   │   ├── db/
│   │   │   ├── mongo.ts        # MongoDB connection
│   │   │   └── eventModel.ts   # Mongoose event schema
│   │   └── kafka/
│   │       ├── client.ts       # KafkaJS configuration
│   │       ├── producer.ts     # Kafka producer (with mock fallback)
│   │       ├── consumer.ts     # Kafka consumer + analytics
│   │       ├── processor.ts    # Stream processor (spam detection)
│   │       └── mock.ts         # In-memory mock Kafka
│   ├── tsconfig.json
│   └── package.json
│
└── frontend/
    ├── src/app/
    │   ├── layout.tsx           # Root layout with NavBar
    │   ├── page.tsx             # Event Stream page
    │   ├── globals.css          # Dark-mode design system
    │   ├── components/
    │   │   └── NavBar.tsx       # Client-side navigation (Next.js Link)
    │   └── analytics/
    │       └── page.tsx         # Live Analytics Dashboard
    └── package.json
```

---

## 🌐 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `KAFKA_BROKERS` | Comma-separated Kafka broker URLs | `localhost:29092` |
| `KAFKA_USERNAME` | SASL username (for cloud Kafka) | — |
| `KAFKA_PASSWORD` | SASL password (for cloud Kafka) | — |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/kafkastream` |
| `PORT` | Backend server port | `4000` |

---

## 📝 License
MIT
