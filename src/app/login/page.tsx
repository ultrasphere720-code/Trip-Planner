"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("explorer@orbit.travel");
  const [password, setPassword] = useState("travelpass123");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isRegister) {
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          throw new Error(regData.error || "Failed to create account");
        }
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg("Invalid credentials. Please verify your email and password.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg("");
    setLoading(true);

    try {
      // Auto-register demo user if it doesn't exist
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Global Explorer",
          email: "explorer@orbit.travel",
          password: "travelpass123",
        }),
      });

      const res = await signIn("credentials", {
        email: "explorer@orbit.travel",
        password: "travelpass123",
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg("Failed to sign in with demo account.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Demo sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ maxWidth: "440px", width: "100%", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Sparkles size={18} style={{ color: "var(--accent-teal)" }} />
            <span className="badge badge-teal">Authentication</span>
          </div>
          <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>
          <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {isRegister
              ? "Register to save agent-planned trips and itineraries."
              : "Sign in to access your personalized travel dashboard."}
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "var(--radius-md)",
              color: "#fca5a5",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <label className="label">Full Name</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Hunter"
                  style={{ paddingLeft: "2.5rem" }}
                  required
                />
                <User size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="label">Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="explorer@orbit.travel"
                style={{ paddingLeft: "2.5rem" }}
                required
              />
              <Mail size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>

          <div className="input-group">
            <label className="label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: "2.5rem" }}
                required
              />
              <Lock size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem", marginBottom: "1rem" }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}
            <ArrowRight size={16} />
          </button>
        </form>

        <button
          type="button"
          onClick={handleDemoLogin}
          className="btn btn-secondary"
          style={{ width: "100%", marginBottom: "1.5rem", fontSize: "0.875rem" }}
          disabled={loading}
        >
          <Sparkles size={15} style={{ color: "var(--accent-teal)" }} />
          One-Click Demo Explorer Sign In
        </button>

        <div style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          {isRegister ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-purple)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
