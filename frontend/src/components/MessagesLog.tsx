import React, { useEffect, useState, useMemo, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

type Message = {
  _id: string;
  chatId?: string;
  from?: string;
  to?: string;
  body?: string;
  direction?: "in" | "out" | string;
  timestamp?: string | number;
  reply?: string;
};

const formatTime = (t?: string | number) => {
  if (!t) return "-";
  const d = new Date(typeof t === "number" ? t : new Date(t).getTime());
  return d.toLocaleString();
};

const MessagesLog: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [search, setSearch] = useState("");
  const [paused, setPaused] = useState(false);

  const fetchMessages = useCallback(async () => {
    // Log each client fetch so we can correlate with server [DB] logs
    console.log(`[Client] fetchMessages called at ${new Date().toISOString()}`);
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/messages?limit=100");
      // backend responds with { success: true, messages: [...] }
      const payload = res.data;
      if (payload && Array.isArray(payload.messages)) {
        setMessages(payload.messages);
      } else if (Array.isArray(payload)) {
        // fallback: older endpoint that returned array directly
        setMessages(payload);
      } else {
        // unexpected shape
        setMessages([]);
        setError("Received unexpected messages payload from server");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount (unless paused)
    if (!paused) fetchMessages();

    // Listen for explicit refresh events (dispatched after DB updates)
    const onRefresh = () => {
      if (!paused) fetchMessages();
    };
    window.addEventListener("messages:refresh", onRefresh);

    return () => {
      window.removeEventListener("messages:refresh", onRefresh);
    };
  }, [fetchMessages, paused]);

  const filtered = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
    return list
      .filter((m) => (filter === "all" ? true : m.direction === filter))
      .filter((m) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          (m.body || "").toLowerCase().includes(s) ||
          (m.from || "").toLowerCase().includes(s) ||
          (m.to || "").toLowerCase().includes(s)
        );
      })
      .sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });
  }, [messages, filter, search]);

  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Message Logs</h3>
        <div className="flex items-center space-x-2">
          <input
            placeholder="Search messages, numbers or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-200"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
          >
            <option value="all">All</option>
            <option value="in">Incoming</option>
            <option value="out">Outgoing</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Loading messages...
        </div>
      ) : error ? (
        <div className="text-red-600 p-3 bg-red-50 rounded">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 py-6 text-center">No messages yet</div>
      ) : (
        <div>
          <div className="flex justify-end mb-2 gap-2">
            <button
              onClick={() => setPaused((p) => !p)}
              className="px-3 py-1 bg-gray-100 rounded text-sm"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={fetchMessages}
              className="px-3 py-1 bg-gray-100 rounded text-sm"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
            {filtered.map((m) => (
              <div
                key={m._id}
                className={`p-4 rounded-lg border border-gray-100 bg-white transition-shadow ${
                  m.direction === "in" ? "hover:shadow-lg" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-md font-semibold ${
                        m.direction === "out"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {m.direction === "out" ? "↗" : "↙"}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-gray-400">
                          {m.direction === "in" ? "From" : "To"}
                        </div>
                        <div className="text-sm text-gray-800 font-medium">
                          {m.direction === "in"
                            ? m.from || "Unknown"
                            : m.to || m.from || "Unknown"}
                        </div>
                      </div>

                      <div className="text-xs text-gray-400">
                        <div className="inline-block bg-gray-50 border px-2 py-1 rounded text-gray-500">
                          {formatTime(m.timestamp)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-gray-800">
                      <div className="whitespace-pre-wrap text-sm">
                        {m.body}
                      </div>
                      {m.reply && (
                        <div className="mt-3 text-sm text-indigo-700 bg-indigo-50 inline-block px-3 py-1 rounded">
                          Reply: {m.reply}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesLog;
