"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Cpu,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Wallet,
  Send,
  Check,
  AlertCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import Timeline, { getCurrencySymbol } from "./Timeline";

export interface LogMessage {
  id: string;
  agent: string;
  status: string;
  timestamp: string;
}

export interface ThinkingAgentUIProps {
  logs: LogMessage[];
  isStreaming: boolean;
  draftReady: boolean;
  draftData: any;
  threadId: string;
  origin?: string;
  destination?: string;
  totalDays?: number;
  currency?: string;
  travelers?: number;
  onApprove: () => Promise<void>;
  onRequestChanges: (feedback: string) => Promise<void>;
  isSubmittingFeedback?: boolean;
  isFinalizing?: boolean;
}

export default function ThinkingAgentUI({
  logs = [],
  isStreaming = false,
  draftReady = false,
  draftData = null,
  threadId = "",
  origin = "",
  destination = "",
  totalDays = 1,
  currency = "$",
  travelers = 1,
  onApprove,
  onRequestChanges,
  isSubmittingFeedback = false,
  isFinalizing = false,
}: ThinkingAgentUIProps) {
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedbackBox, setShowFeedbackBox] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs to bottom on new entries
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const quickFeedbackOptions = [
    "Lower the total estimated budget",
    "Focus more on historical and cultural sites",
    "Include more relaxed downtime between activities",
    "Add vegetarian-friendly culinary spots",
    "Add scenic viewpoints and photography spots",
  ];

  const handleQuickChipClick = (chip: string) => {
    setFeedbackText((prev) => (prev ? `${prev}. ${chip}` : chip));
    setShowFeedbackBox(true);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || isSubmittingFeedback) return;
    await onRequestChanges(feedbackText.trim());
    setFeedbackText("");
  };

  const daysList = draftData?.days || [];
  const estCost = draftData?.totalBudgetUSD ?? draftData?.totalEstimatedCost ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Terminal Agent Execution Card */}
      <div className="terminal-card">
        <div className="terminal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="terminal-dots">
              <span className="terminal-dot red" />
              <span className="terminal-dot yellow" />
              <span className="terminal-dot green" />
            </div>
            <div className="terminal-title">
              <Terminal size={14} style={{ color: "var(--accent-teal)" }} />
              <span>Multi-Agent Swarm Kernel</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {threadId && (
              <span className="badge" style={{ fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace" }}>
                thread: {threadId.slice(0, 8)}...
              </span>
            )}
            {isStreaming ? (
              <span className="badge badge-purple" style={{ animation: "pulse 2s infinite" }}>
                <Cpu size={12} /> Live Researching
              </span>
            ) : draftReady ? (
              <span className="badge badge-success">
                <CheckCircle2 size={12} /> Execution Checkpoint
              </span>
            ) : (
              <span className="badge">
                <Clock size={12} /> Initializing
              </span>
            )}
          </div>
        </div>

        <div className="terminal-body">
          {logs.length === 0 ? (
            <div className="terminal-log-row">
              <span className="terminal-timestamp">[system]</span>
              <span className="terminal-agent-tag">[SUPERVISOR]</span>
              <span className="terminal-log-msg">
                Connecting to worker agents. Preparing parallel search queries for {destination}...
              </span>
              <span className="terminal-cursor" />
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="terminal-log-row">
                <span className="terminal-timestamp">{log.timestamp}</span>
                <span className="terminal-agent-tag">
                  [{log.agent.replace("Agent", "").toUpperCase()}]
                </span>
                <span className="terminal-log-msg">{log.status}</span>
              </div>
            ))
          )}

          {isStreaming && (
            <div className="terminal-log-row" style={{ opacity: 0.8 }}>
              <span className="terminal-timestamp">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className="terminal-agent-tag">[COORDINATOR]</span>
              <span className="terminal-log-msg">
                Aggregating Tavily ground truth and synthesizing {destination} multi-day itinerary...
              </span>
              <span className="terminal-cursor" />
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Draft Ready Review Panel */}
      {draftReady && (
        <div className="card" style={{ border: "1px solid var(--border-hover)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Sparkles size={18} style={{ color: "var(--accent-teal)" }} />
                <span className="badge badge-teal">Human Review Checkpoint</span>
              </div>
              <h2>
                Draft Itinerary for <span className="gradient-text">{draftData?.destination || destination}</span>
              </h2>
              <p style={{ marginTop: "0.25rem" }}>
                Review the multi-day plan drafted by the agent swarm. You can approve and finalize the trip, or request specific modifications.
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Target Destination</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={18} style={{ color: "var(--accent-purple)" }} />
                <span className="metric-value" style={{ fontSize: "1.25rem" }}>
                  {draftData?.destination || destination}
                </span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">Itinerary Duration</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={18} style={{ color: "var(--accent-teal)" }} />
                <span className="metric-value">
                  {draftData?.days?.length || draftData?.totalDays || totalDays} Days
                </span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">Travel Party</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={18} style={{ color: "var(--accent-purple)" }} />
                <span className="metric-value">
                  {travelers} {travelers === 1 ? "Traveler" : "Travelers"}
                </span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">Total Estimated Budget</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Wallet size={18} style={{ color: "#38bdf8" }} />
                <span className="metric-value">
                  {getCurrencySymbol(currency)}{estCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Timeline Accordion Preview */}
          <div style={{ marginBottom: "2rem" }}>
            <Timeline
              days={daysList}
              currency={currency}
              destination={destination}
              trip={{ budget: estCost, totalDays: daysList.length, currency, destination }}
              initiallyExpanded={false}
            />
          </div>

          {/* Action Decision Panel */}
          <div
            style={{
              padding: "1.5rem",
              background: "#181333",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h4 style={{ fontSize: "1.1rem" }}>Ready to lock this in?</h4>
                <p style={{ fontSize: "0.875rem" }}>
                  Approving will persist this finalized itinerary into your database dashboard.
                </p>
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setShowFeedbackBox((prev) => !prev)}
                  className="btn btn-secondary"
                  disabled={isFinalizing || isSubmittingFeedback}
                >
                  <RefreshCw size={16} />
                  {showFeedbackBox ? "Hide Changes Box" : "Request Changes"}
                </button>

                <button
                  type="button"
                  onClick={onApprove}
                  className="btn btn-primary"
                  disabled={isFinalizing || isSubmittingFeedback}
                >
                  {isFinalizing ? (
                    <>
                      <div className="terminal-cursor" style={{ width: 12, height: 12 }} />
                      Finalizing Trip...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Approve & Finalize Trip
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Request Changes Form */}
            {showFeedbackBox && (
              <form onSubmit={handleFeedbackSubmit} style={{ marginTop: "0.5rem" }}>
                <div className="input-group">
                  <label className="label" style={{ color: "var(--text-primary)" }}>
                    Tell the Agent what to adjust in the itinerary:
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="e.g., Focus more on hidden gems and street food on Day 2, and reduce the estimated daily cost..."
                    disabled={isSubmittingFeedback}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                    Quick Suggestions:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {quickFeedbackOptions.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickChipClick(chip)}
                        className="badge badge-purple"
                        style={{ cursor: "pointer", textTransform: "none", fontSize: "0.75rem" }}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!feedbackText.trim() || isSubmittingFeedback}
                  >
                    {isSubmittingFeedback ? (
                      <>Revising Itinerary...</>
                    ) : (
                      <>
                        <Send size={15} /> Submit Changes to Agent
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
