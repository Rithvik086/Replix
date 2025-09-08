import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [botEnabled, setBotEnabled] = useState(true);
  const [sleepStart, setSleepStart] = useState("23:00");
  const [sleepEnd, setSleepEnd] = useState("07:00");
  const [replyToPersonalChats, setReplyToPersonalChats] = useState(true);
  const [replyToGroupChats, setReplyToGroupChats] = useState(false);

  const [message, setMessage] = useState("");
  const [original, setOriginal] = useState<any>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/settings");
      const s = res.data?.settings;
      if (s) {
        setBotEnabled(Boolean(s.botEnabled));
        setSleepStart(s.sleepStart ?? "23:00");
        setSleepEnd(s.sleepEnd ?? "07:00");
        setReplyToPersonalChats(Boolean(s.replyToPersonalChats ?? true));
        setReplyToGroupChats(Boolean(s.replyToGroupChats ?? false));

        setOriginal({
          botEnabled: Boolean(s.botEnabled),
          sleepStart: s.sleepStart ?? "23:00",
          sleepEnd: s.sleepEnd ?? "07:00",
          replyToPersonalChats: Boolean(s.replyToPersonalChats ?? true),
          replyToGroupChats: Boolean(s.replyToGroupChats ?? false),
        });
      }
    } catch (err: any) {
      setMessage("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const save = async () => {
    setMessage("Saving...");
    try {
      const res = await axiosInstance.post("/settings", {
        botEnabled,
        sleepStart,
        sleepEnd,
        replyToPersonalChats,
        replyToGroupChats,
      });
      if (res.data?.success) {
        setMessage("Saved");
        setOriginal({
          botEnabled,
          sleepStart,
          sleepEnd,
          replyToPersonalChats,
          replyToGroupChats,
        });
      } else setMessage("Failed to save");
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Failed to save");
    }
    setTimeout(() => setMessage(""), 2000);
  };

  const reset = () => {
    if (original) {
      setBotEnabled(original.botEnabled);
      setSleepStart(original.sleepStart);
      setSleepEnd(original.sleepEnd);
      setReplyToPersonalChats(original.replyToPersonalChats);
      setReplyToGroupChats(original.replyToGroupChats);
      setMessage("Reverted");
      setTimeout(() => setMessage(""), 1500);
    }
  };

  const nowIsSleeping = () => {
    try {
      if (!sleepStart || !sleepEnd) return false;
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const start = sleepStart;
      const end = sleepEnd;
      if (start < end) return hhmm >= start && hhmm < end;
      return hhmm >= start || hhmm < end; // wrap midnight
    } catch (e) {
      return false;
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  const sleeping = nowIsSleeping();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <div />
            <div>
              <a
                href="/dashboard"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-sm text-gray-700">Back to Dashboard</span>
              </a>
            </div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bot Settings</h2>
              <p className="text-sm text-gray-500 mt-1">
                Control the auto-reply behavior and schedule when the bot should
                stay quiet.
              </p>
            </div>

            <div className="text-right">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                  botEnabled && !sleeping
                    ? "text-green-700 bg-green-50"
                    : "text-yellow-700 bg-yellow-50"
                } border`}
              >
                {botEnabled && !sleeping
                  ? "Active"
                  : sleeping
                  ? "Sleeping"
                  : "Disabled"}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bot Enabled
                </label>
                <div className="mt-3">
                  <button
                    onClick={() => setBotEnabled(true)}
                    className={`px-4 py-2 rounded-l-md border ${
                      botEnabled
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-200"
                    }`}
                  >
                    On
                  </button>
                  <button
                    onClick={() => setBotEnabled(false)}
                    className={`px-4 py-2 rounded-r-md border ${
                      !botEnabled
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-gray-700 border-gray-200"
                    }`}
                  >
                    Off
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Reply To Chat Types
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Personal Chats
                    </span>
                    <button
                      onClick={() =>
                        setReplyToPersonalChats(!replyToPersonalChats)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        replyToPersonalChats ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          replyToPersonalChats
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Group Chats</span>
                    <button
                      onClick={() => setReplyToGroupChats(!replyToGroupChats)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        replyToGroupChats ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          replyToGroupChats ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Control which types of chats the bot will respond to.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sleep Window (server local time)
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="time"
                    value={sleepStart}
                    onChange={(e) => setSleepStart(e.target.value)}
                    className="px-3 py-2 border rounded-md w-32"
                  />
                  <div className="text-sm text-gray-500">to</div>
                  <input
                    type="time"
                    value={sleepEnd}
                    onChange={(e) => setSleepEnd(e.target.value)}
                    className="px-3 py-2 border rounded-md w-32"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  If the start time is later than the end time the window wraps
                  midnight.
                </p>
              </div>
            </div>

            <div className="col-span-1">
              <div className="bg-slate-50 p-4 rounded-md border border-dashed">
                <h3 className="text-sm font-semibold text-gray-800">
                  Current status
                </h3>
                <div className="mt-3 flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      botEnabled && !sleeping
                        ? "bg-green-500"
                        : sleeping
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {botEnabled
                        ? sleeping
                          ? "Sleeping"
                          : "Active"
                        : "Disabled"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Server time: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs text-gray-500 uppercase mb-2">
                    Chat Types
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Personal Chats</span>
                      <span
                        className={`px-2 py-1 rounded ${
                          replyToPersonalChats
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {replyToPersonalChats ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Group Chats</span>
                      <span
                        className={`px-2 py-1 rounded ${
                          replyToGroupChats
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {replyToGroupChats ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs text-gray-500 uppercase">
                    Quick actions
                  </h4>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setBotEnabled(false);
                        setMessage("Bot disabled temporarily");
                      }}
                      className="px-3 py-1 bg-red-50 text-red-700 rounded text-sm"
                    >
                      Disable
                    </button>
                    <button
                      onClick={() => {
                        setBotEnabled(true);
                        setMessage("Bot enabled");
                      }}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded text-sm"
                    >
                      Enable
                    </button>
                    <button
                      onClick={() => {
                        setReplyToPersonalChats(true);
                        setReplyToGroupChats(false);
                        setMessage("Personal chats only");
                      }}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm"
                    >
                      Personal only
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={save}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            >
              Save changes
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-white text-gray-700 border rounded-md"
            >
              Cancel
            </button>
            {message && <div className="text-sm text-gray-600">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
