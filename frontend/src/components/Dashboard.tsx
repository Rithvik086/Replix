import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import MessagesLog from "./MessagesLog";

type WhatsAppStatus = {
  status: "not_connected" | "qr_generated" | "connected";
};

const Dashboard: React.FC = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] =
    useState<WhatsAppStatus["status"]>("not_connected");
  const statusRef = useRef(status);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [botEnabled, setBotEnabled] = useState<boolean | null>(null);
  const [sleepStart, setSleepStart] = useState<string | null>(null);
  const [sleepEnd, setSleepEnd] = useState<string | null>(null);

  const fetchQrCode = async () => {
    try {
      const response = await axiosInstance.get("/qr");
      setQrCode(response.data.qr);
    } catch (err: any) {
      if (err.response?.status !== 404) setError("Failed to fetch QR code");
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await axiosInstance.get("/status");
      setStatus(response.data.status);
    } catch (err) {
      setError("Failed to fetch status");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axiosInstance.get("/settings");
      const s = res.data?.settings;
      if (s) {
        setBotEnabled(Boolean(s.botEnabled));
        setSleepStart(s.sleepStart ?? null);
        setSleepEnd(s.sleepEnd ?? null);
      }
    } catch (err) {
      // ignore settings errors (e.g., unauthenticated) but keep state null
      console.debug("Could not load settings:", err);
      setBotEnabled(null);
      setSleepStart(null);
      setSleepEnd(null);
    }
  };

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchQrCode(), fetchStatus(), fetchSettings()]);
      setLoading(false);
    };

    fetchData();

    const statusInterval = setInterval(fetchStatus, 3000);
    const qrInterval = setInterval(() => {
      if (statusRef.current !== "connected") fetchQrCode();
    }, 5000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(qrInterval);
    };
  }, []);

  const getStatusColor = (s: WhatsAppStatus["status"]) =>
    s === "connected"
      ? "text-green-600 bg-green-100 border-green-200"
      : s === "qr_generated"
      ? "text-yellow-600 bg-yellow-100 border-yellow-200"
      : "text-red-600 bg-red-100 border-red-200";

  const getStatusText = (s: WhatsAppStatus["status"]) =>
    s === "connected"
      ? "🟢 Connected"
      : s === "qr_generated"
      ? "🟡 QR Ready"
      : "🔴 Not Connected";

  const nowIsSleeping = (start?: string | null, end?: string | null) => {
    try {
      if (!start || !end) return false;
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      if (start < end) return hhmm >= start && hhmm < end;
      return hhmm >= start || hhmm < end;
    } catch (e) {
      return false;
    }
  };

  const getBotBadge = () => {
    if (botEnabled === null)
      return { text: "Unknown", classes: "text-gray-600 bg-gray-100" };
    const sleeping = nowIsSleeping(sleepStart, sleepEnd);
    if (!botEnabled)
      return { text: "Disabled", classes: "text-red-600 bg-red-50" };
    if (sleeping)
      return { text: "Sleeping", classes: "text-yellow-700 bg-yellow-50" };
    return { text: "Active", classes: "text-green-600 bg-green-50" };
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const refreshQR = () => {
    fetchQrCode();
    fetchStatus();
  };

  const resetSession = async () => {
    try {
      setActionMsg("Resetting session...");
      const response = await axiosInstance.post("/reset-session");
      if (response.data?.success) {
        setActionMsg("Session reset! New QR should appear soon.");
        // Fetch new data after reset
        setTimeout(() => {
          fetchQrCode();
          fetchStatus();
          setActionMsg("");
        }, 2000);
      } else {
        setActionMsg("Failed to reset session");
      }
    } catch (err: any) {
      setActionMsg(err?.response?.data?.message || "Failed to reset session");
    }
    setTimeout(() => setActionMsg(""), 5000);
  };

  // retention UI
  const [retentionPreset, setRetentionPreset] = useState<string>("1_day");
  const [actionMsg, setActionMsg] = useState<string>("");
  // persona feature removed

  const humanLabel = (key: string) => {
    const map: Record<string, string> = {
      "1_hour": "1 hour",
      "12_hours": "12 hours",
      "1_day": "1 day",
      "10_days": "10 days",
      "30_days": "30 days",
    };
    return map[key] ?? key;
  };

  const applyRetention = async () => {
    const map: Record<string, number> = {
      "1_hour": 1 / 24,
      "12_hours": 12 / 24,
      "1_day": 1,
      "10_days": 10,
      "30_days": 30,
    };
    const days = map[retentionPreset] ?? 1;
    const label = humanLabel(retentionPreset);

    try {
      setActionMsg("Running cleanup...");
      const res = await axiosInstance.delete(
        `/messages/cleanup?days=${encodeURIComponent(days)}`
      );
      if (res.data?.success) {
        const deleted = res.data.deletedCount ?? 0;
        setActionMsg(
          deleted === 0
            ? `No messages older than ${label} were found`
            : `Deleted ${deleted} messages older than ${label}`
        );
      } else setActionMsg(res.data?.message || "Cleanup completed");
      setTimeout(
        () => window.dispatchEvent(new Event("messages:refresh")),
        500
      );
    } catch (err: any) {
      setActionMsg(err?.response?.data?.message || "Failed to run cleanup");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">
            Loading WhatsApp dashboard...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Replix</h1>
            <p className="text-sm text-gray-500">WhatsApp bot dashboard</p>
            <div className="mt-2">
              Bot status :{"  "}
              <span
                className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium border ${
                  getBotBadge().classes
                }`}
              >
                {getBotBadge().text}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Signed in as</div>
              <div className="text-sm font-medium text-gray-800">Admin</div>
            </div>
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded shadow-sm hover:bg-gray-50 text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 015.29 17.9l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09c.7 0 1.3-.41 1.51-1a1.65 1.65 0 00-.33-1.82L4.31 5.29A2 2 0 017.14 2.46l.06.06A1.65 1.65 0 009 2.79c.7 0 1.3.41 1.51 1H12c.7 0 1.3-.41 1.51-1 .17-.42.57-.73 1.02-.79.44-.06.88.07 1.2.35l.06.06a2 2 0 002.83 0l.06-.06a1.65 1.65 0 001.82-.33l.06-.06A2 2 0 0120.71 6.1l-.06.06a1.65 1.65 0 00-.33 1.82c.2.59.8 1 1.51 1H21a2 2 0 010 4h-.09c-.7 0-1.3.41-1.51 1z"
                />
              </svg>
              <span className="text-sm text-gray-700">Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg max-w-3xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
              <h2 className="text-lg font-semibold mb-2">Connection</h2>
              <div className="flex items-center justify-between">
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-md border ${getStatusColor(
                    status
                  )}`}
                >
                  <span className="mr-2 text-sm">{getStatusText(status)}</span>
                </div>
                <button
                  onClick={refreshQR}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  QR Code
                </h3>
                <div className="flex items-center justify-center">
                  {status === "connected" ? (
                    <div className="text-green-600 text-center">
                      <div className="text-5xl">✅</div>
                      <div className="text-sm mt-1 font-medium">Connected</div>
                    </div>
                  ) : qrCode ? (
                    <img
                      src={qrCode}
                      alt="QR"
                      className="w-44 h-auto rounded-md shadow-sm border"
                    />
                  ) : (
                    <div className="text-gray-400">Waiting for QR...</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
              <h2 className="text-lg font-semibold mb-2">Auto Cleanup</h2>
              <p className="text-sm text-gray-500 mb-3">
                Choose a preset to immediately remove messages older than the
                selected window.
              </p>
              <div className="flex gap-2">
                <select
                  value={retentionPreset}
                  onChange={(e) => setRetentionPreset(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                >
                  <option value="1_hour">1 hour</option>
                  <option value="12_hours">12 hours</option>
                  <option value="1_day">1 day</option>
                  <option value="10_days">10 days</option>
                  <option value="30_days">30 days (automatic)</option>
                </select>
                <button
                  onClick={applyRetention}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-md"
                >
                  Apply
                </button>
              </div>
              {actionMsg && (
                <div className="mt-3 text-sm text-gray-700">{actionMsg}</div>
              )}
            </div>

            {/* Personality UI removed per user request */}

            <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
              <h2 className="text-lg font-semibold mb-2">Quick Help</h2>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>• Scan the QR to link your device</li>
                <li>• Messages auto-save to the DB</li>
                <li>• Use Auto Cleanup to remove old messages</li>
              </ol>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <MessagesLog />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
