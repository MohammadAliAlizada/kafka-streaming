"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Stats = {
  total: number;
  valid: number;
  spam: number;
  history: { time: string; total: number; valid: number; spam: number }[];
};

const COLORS = ["#6366f1", "#10b981", "#ef4444"];

const defaultStats: Stats = { total: 0, valid: 0, spam: 0, history: [] };

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Load current stats from REST on mount
    fetch("http://localhost:4000/api/analytics")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});

    const socket = io("http://localhost:4000");
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("analytics", (data: Stats) => setStats(data));
    return () => {
      socket.disconnect();
    };
  }, []);

  const spamRate =
    stats.total > 0 ? ((stats.spam / stats.total) * 100).toFixed(1) : "0.0";

  const pieData = [
    { name: "Valid", value: stats.valid },
    { name: "Spam", value: stats.spam },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            📊 Live Analytics Dashboard
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.875rem",
              marginTop: "0.25rem",
            }}
          >
            Real-time event stream processing metrics
          </p>
        </div>
        <div
          className="status-dot"
          style={{
            color: isConnected ? "var(--success)" : "var(--danger)",
            marginTop: 0,
          }}
        >
          {isConnected ? "● Live" : "● Disconnected"}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="analytics-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--primary)" }}>
            {stats.total}
          </div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {stats.valid}
          </div>
          <div className="stat-label">✅ Valid Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {stats.spam}
          </div>
          <div className="stat-label">🚫 Spam Events</div>
        </div>
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Donut / Pie Chart */}
        <div className="panel" style={{ minHeight: 280 }}>
          <div className="panel-title">Event Distribution</div>
          {stats.total === 0 ? (
            <div className="empty-state">
              Send some events to see distribution
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={index === 0 ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1f2937",
                    border: "1px solid #2d3748",
                    borderRadius: "0.5rem",
                    color: "#f1f5f9",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div
            style={{
              textAlign: "center",
              color: "var(--muted)",
              fontSize: "0.85rem",
              marginTop: "0.5rem",
            }}
          >
            Spam Rate:{" "}
            <strong
              style={{
                color:
                  Number(spamRate) > 30 ? "var(--danger)" : "var(--success)",
              }}
            >
              {spamRate}%
            </strong>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="panel" style={{ minHeight: 280 }}>
          <div className="panel-title">Event Breakdown</div>
          {stats.total === 0 ? (
            <div className="empty-state">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[
                  { name: "Events", Valid: stats.valid, Spam: stats.spam },
                ]}
                barCategoryGap="40%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1f2937",
                    border: "1px solid #2d3748",
                    borderRadius: "0.5rem",
                    color: "#f1f5f9",
                  }}
                />
                <Legend
                  wrapperStyle={{ color: "#94a3b8", fontSize: "0.8rem" }}
                />
                <Bar dataKey="Valid" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spam" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Line Chart — history */}
      <div className="panel" style={{ minHeight: 260 }}>
        <div className="panel-title">📈 Cumulative Event History</div>
        {stats.history.length < 2 ? (
          <div className="empty-state" style={{ paddingTop: "2rem" }}>
            Send at least 2 events to see the trend line
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid #2d3748",
                  borderRadius: "0.5rem",
                  color: "#f1f5f9",
                }}
              />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "0.8rem" }} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Total"
              />
              <Line
                type="monotone"
                dataKey="valid"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Valid"
              />
              <Line
                type="monotone"
                dataKey="spam"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Spam"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
