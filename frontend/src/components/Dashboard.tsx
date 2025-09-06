import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

interface WhatsAppStatus {
  status: "not_connected" | "qr_generated" | "connected";
}

const Dashboard: React.FC = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] =
    useState<WhatsAppStatus["status"]>("not_connected");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQrCode = async () => {
    try {
      const response = await axiosInstance.get("/qr");
      setQrCode(response.data.qr);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError("Failed to fetch QR code");
      }
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchQrCode(), fetchStatus()]);
      setLoading(false);
    };

    fetchData();

    // Poll status every 3 seconds
    const statusInterval = setInterval(fetchStatus, 3000);

    // Poll QR code every 5 seconds if not connected
    const qrInterval = setInterval(() => {
      if (status !== "connected") {
        fetchQrCode();
      }
    }, 5000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(qrInterval);
    };
  }, [status]);

  const getStatusColor = (status: WhatsAppStatus["status"]) => {
    switch (status) {
      case "connected":
        return "text-green-600 bg-green-100 border-green-200";
      case "qr_generated":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "not_connected":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusText = (status: WhatsAppStatus["status"]) => {
    switch (status) {
      case "connected":
        return "🟢 WhatsApp Connected";
      case "qr_generated":
        return "🟡 QR Generated - Please Scan";
      case "not_connected":
        return "🔴 Not Connected";
      default:
        return "⚪ Unknown Status";
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WhatsApp status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                WhatsApp Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your WhatsApp bot connection
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Connection Status
            </h2>
            <div
              className={`inline-flex items-center px-4 py-2 rounded-lg border font-medium ${getStatusColor(
                status
              )}`}
            >
              {getStatusText(status)}
            </div>

            <div className="mt-4">
              <button
                onClick={refreshQR}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Refresh Status
              </button>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              QR Code Scanner
            </h2>

            {status === "connected" ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-green-600 font-medium">
                  WhatsApp is connected successfully!
                </p>
              </div>
            ) : qrCode ? (
              <div className="text-center">
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className="mx-auto mb-4 border border-gray-200 rounded-lg"
                  style={{ maxWidth: "250px", height: "auto" }}
                />
                <p className="text-gray-600 text-sm">
                  Scan this QR code with your WhatsApp app
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-gray-600">Generating QR code...</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How to Connect
          </h2>
          <div className="space-y-3 text-gray-600">
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3 mt-0.5">
                1
              </span>
              <p>Open WhatsApp on your phone</p>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3 mt-0.5">
                2
              </span>
              <p>Tap on the three dots menu (Android) or Settings (iOS)</p>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3 mt-0.5">
                3
              </span>
              <p>Select "Linked Devices" or "WhatsApp Web"</p>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3 mt-0.5">
                4
              </span>
              <p>Tap "Link a Device" and scan the QR code above</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
