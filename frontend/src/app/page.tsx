"use client";

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

type EventItem = {
  id?: string;
  eventId?: string;
  title: string;
  message: string;
  timestamp: string;
  isSpam: boolean;
  wordCount: number;
  charCount: number;
  spamKeywordsFound: string[];
  processedAt: string;
};

const normalizeId = (e: EventItem) =>
  e.id || e.eventId || Math.random().toString();

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const seenIds = useRef<Set<string>>(new Set());

  // Load history from MongoDB on mount
  useEffect(() => {
    fetch("http://localhost:4000/api/events")
      .then((r) => r.json())
      .then((data: EventItem[]) => {
        const normalized = data.map((e) => ({
          ...e,
          id: e.eventId || e.id,
        }));
        normalized.forEach((e) => seenIds.current.add(normalizeId(e)));
        setEvents(normalized.reverse()); // oldest first
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false));
  }, []);

  // Live events via Socket.io
  useEffect(() => {
    const socket = io("http://localhost:4000");
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("notification", (data: EventItem) => {
      const id = normalizeId(data);
      if (seenIds.current.has(id)) return; // deduplicate
      seenIds.current.add(id);
      setEvents((prev) => [...prev, data].slice(-50));
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setIsSubmitting(true);
    try {
      await fetch("http://localhost:4000/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });
      setTitle("");
      setMessage("");
    } catch (err) {
      console.error("Error sending event", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    await fetch("http://localhost:4000/api/events", { method: "DELETE" });
    setEvents([]);
    seenIds.current.clear();
  };

  // Scroll to bottom on new event
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="page-container">
      {/* Producer Panel */}
      <div className="panel">
        <div className="panel-title">📤 Produce Event</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Event Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. User Registration"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">Event Payload</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Try "free" or "win" to trigger spam detection!'
              required
            />
          </div>
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "⚡ Produce Message"}
          </button>
        </form>

        <div style={{ marginTop: "1rem" }}>
          <button
            className="btn"
            type="button"
            onClick={handleClear}
            style={{
              background: "var(--danger)",
              marginTop: "0.5rem",
              fontSize: "0.85rem",
            }}
          >
            🗑 Clear History
          </button>
        </div>

        <div
          className="status-dot"
          style={{ color: isConnected ? "var(--success)" : "var(--danger)" }}
        >
          {isConnected ? "● Live — Connected to Server" : "● Disconnected"}
        </div>
      </div>

      {/* Event Stream Panel */}
      <div className="panel">
        <div className="panel-title">
          📥 Processed Event Stream
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.75rem",
              color: "var(--muted)",
              fontWeight: 400,
            }}
          >
            {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="messages">
          {isLoadingHistory ? (
            <div className="empty-state">Loading history from MongoDB...</div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              No events yet. Send your first message!
            </div>
          ) : (
            events.map((n, i) => (
              <div
                key={normalizeId(n) || i}
                className={`message-card ${n.isSpam ? "spam" : ""}`}
              >
                <div className="message-header">
                  <span className="message-title">{n.title}</span>
                  <span
                    className={`badge ${n.isSpam ? "badge-spam" : "badge-valid"}`}
                  >
                    {n.isSpam ? "🚫 Spam" : "✅ Valid"}
                  </span>
                </div>
                <div className="message-body">{n.message}</div>
                <div className="message-meta">
                  <span>
                    {n.wordCount} words · {n.charCount} chars
                  </span>
                  <span>
                    {new Date(
                      n.processedAt || n.timestamp,
                    ).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
