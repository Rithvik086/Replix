import React, { useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (isLogin) {
        const res = await axiosInstance.post("/auth/login", {
          email: form.email,
          password: form.password,
        });
        setSuccess(res.data.message);
      } else {
        const res = await axiosInstance.post("/auth/register", {
          username: form.username,
          email: form.email,
          password: form.password,
        });
        setSuccess(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 350,
        margin: "60px auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 8,
        background: "#fff",
        boxShadow: "0 2px 8px #eee",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        {isLogin ? "Login" : "Register"}
      </h2>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              marginBottom: 12,
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        )}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            marginBottom: 12,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            marginBottom: 12,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 4,
            background: "#007bff",
            color: "#fff",
            border: "none",
            fontWeight: 600,
          }}
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>
      </form>
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {isLogin
            ? "Need an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>
      {error && (
        <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: "green", marginTop: 12, textAlign: "center" }}>
          {success}
        </div>
      )}
    </div>
  );
};

export default AuthForm;
