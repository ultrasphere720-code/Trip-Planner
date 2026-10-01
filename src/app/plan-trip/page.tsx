"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  DollarSign,
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Users,
  Minus,
  Plus,
} from "lucide-react";
import ThinkingAgentUI, { LogMessage } from "@/components/ThinkingAgentUI";
import DestinationSearch from "@/components/DestinationSearch";
import {
  BASE_DAILY_PER_PERSON,
  MIN_DAILY_BUDGET,
  CURRENCY_SYMBOLS,
  DEFAULT_DAILY_BUDGET,
  CURRENCIES,
  getCurrencyCode,
} from "@/lib/currency";

export {
  BASE_DAILY_PER_PERSON,
  MIN_DAILY_BUDGET,
  CURRENCY_SYMBOLS,
  DEFAULT_DAILY_BUDGET,
  CURRENCIES,
  getCurrencyCode,
};

export default function PlanTripPage() {
  const router = useRouter();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form inputs
  const [formData, setFormData] = useState({
    origin: "New York, USA",
    destination: "Kyoto, Japan",
  });
  const origin = formData.origin;
  const destination = formData.destination;
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 19);
    return d.toISOString().split("T")[0];
  });
  const [budget, setBudget] = useState(3000);
  const [currency, setCurrency] = useState("$");
  const [travelers, setTravelers] = useState<number>(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Culture & History",
    "Gastronomy & Foodie",
    "Photography & Sights",
  ]);
  const [customPreferences, setCustomPreferences] = useState("");

  // Agent execution state
  const [isPlanning, setIsPlanning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [threadId, setThreadId] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [finalSuccess, setFinalSuccess] = useState<{ tripId: string } | null>(null);

  // Check for destination query param (e.g. from "Surprise Me!" button on landing page)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const destParam = params.get("destination");
      if (destParam && destParam.trim().length > 0) {
        setFormData((prev) => ({ ...prev, destination: destParam.trim() }));
      }
    }
  }, []);

  // Popular destinations for quick select
  const popularDestinations = [
    "Palermo, Italy",
    "Kyoto, Japan",
    "Rome, Italy",
    "Paris, France",
    "Barcelona, Spain",
    "Jaipur, India",
    "Reykjavik, Iceland",
    "Cape Town, South Africa",
  ];

  // Travel style tags
  const styleTags = [
    "Culture & History",
    "Gastronomy & Foodie",
    "Outdoor & Adventure",
    "Relaxation & Wellness",
    "Photography & Sights",
    "Nightlife & Social",
    "Hidden Gems",
    "Architecture",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Duration calculation
  const totalDays = React.useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 1;
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);

  const currencyCode = getCurrencyCode(currency);
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";
  const baseDailyPerPerson = BASE_DAILY_PER_PERSON[currencyCode] || 75;
  const minTotalBudget = baseDailyPerPerson * totalDays * travelers;
  const isBudgetBelowMin = budget < minTotalBudget;

  const handleTravelersChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(10, newCount));
    const oldCount = travelers;
    setTravelers(clamped);

    const oldMin = baseDailyPerPerson * totalDays * oldCount;
    const newMin = baseDailyPerPerson * totalDays * clamped;

    if (budget <= oldMin || budget < newMin) {
      setBudget(newMin);
    } else {
      const scaled = Math.round((budget / oldCount) * clamped);
      setBudget(Math.max(newMin, scaled));
    }
  };

  const handleCurrencyChange = (newSymbol: string) => {
    const oldCode = getCurrencyCode(currency);
    const newCode = getCurrencyCode(newSymbol);
    setCurrency(newSymbol);

    const newMin = (BASE_DAILY_PER_PERSON[newCode] || 75) * totalDays * travelers;
    const defDaily = (BASE_DAILY_PER_PERSON[newCode] || 75) * 1.3;
    setBudget(Math.max(newMin, Math.round(defDaily * totalDays * travelers)));
  };

  // Submit and start SSE stream
  const handleStartPlanning = async () => {
    if (!destination.trim()) {
      setErrorMsg("Please provide a target destination.");
      return;
    }

    if (isBudgetBelowMin) {
      setErrorMsg(
        `Budget of ${currencySymbol}${budget.toLocaleString()} is unrealistically low for ${travelers} traveler(s) over ${totalDays} days. The minimum threshold for ${currencyCode} is ${currencySymbol}${minTotalBudget.toLocaleString()} (${currencySymbol}${baseDailyPerPerson.toLocaleString()}/person/day).`
      );
      return;
    }

    setErrorMsg("");
    setIsPlanning(true);
    setIsStreaming(true);
    setDraftReady(false);
    setLogs([]);

    const combinedPreferences = [
      ...selectedTags,
      customPreferences.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    try {
      const response = await fetch("/api/plan-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          origin: formData.origin.trim(),
          destination: formData.destination.trim(),
          startDate,
          endDate,
          totalDays,
          travelers,
          budget: Number(budget),
          currency,
          preferences: combinedPreferences,
        }),
      });

      if (!response.ok || !response.body) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;

          let eventType = "message";
          let dataStr = "";

          const lines = rawEvent.split("\n");
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.replace("event:", "").trim();
            } else if (line.startsWith("data:")) {
              dataStr = line.replace("data:", "").trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (eventType === "update") {
              const newLog: LogMessage = {
                id: Math.random().toString(36).substring(7),
                agent: data.agent || "Coordinator",
                status: data.status || "Processing...",
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
              };
              setLogs((prev) => [...prev, newLog]);
            } else if (eventType === "draft_ready") {
              setThreadId(data.threadId);
              setDraftData(data.draft);
              setDraftReady(true);
              setIsStreaming(false);

              const readyLog: LogMessage = {
                id: Math.random().toString(36).substring(7),
                agent: "SupervisorAgent",
                status: `Multi-day itinerary for ${destination} compiled (${data.totalDays} days). Ready for human review.`,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
              };
              setLogs((prev) => [...prev, readyLog]);
            } else if (eventType === "error") {
              setErrorMsg(data.error || "An error occurred during agent execution");
              setIsStreaming(false);
            }
          } catch (parseErr) {
            console.warn("Failed to parse SSE payload:", dataStr, parseErr);
          }
        }
      }
    } catch (err: any) {
      console.error("Plan Trip Error:", err);
      setErrorMsg(err.message || "Failed to communicate with travel planner agent");
      setIsStreaming(false);
    }
  };

  // Finalize trip
  const handleApprove = async () => {
    if (!threadId) return;
    setIsFinalizing(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/plan-trip/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          approved: true,
          tripData: {
            origin,
            destination,
            startDate,
            endDate,
            totalDays,
            travelers,
            budget,
            currency,
            preferences: selectedTags.join(", "),
            itinerary: draftData,
            totalEstimatedCost: draftData?.totalBudgetUSD || draftData?.totalEstimatedCost || budget,
          },
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMsg("Please sign in to save this trip to your dashboard account.");
          return;
        }
        throw new Error(resData.error || "Failed to finalize trip");
      }

      setFinalSuccess({ tripId: resData.tripId });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to finalize trip");
    } finally {
      setIsFinalizing(false);
    }
  };

  // Request changes with feedback
  const handleRequestChanges = async (feedback: string) => {
    if (!threadId) return;
    setIsSubmittingFeedback(true);
    setErrorMsg("");

    const reqLog: LogMessage = {
      id: Math.random().toString(36).substring(7),
      agent: "HumanReview",
      status: `Revision requested: "${feedback}"`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
    setLogs((prev) => [...prev, reqLog]);

    try {
      const response = await fetch("/api/plan-trip/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          approved: false,
          feedback,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to revise itinerary");
      }

      if (resData.draftItinerary) {
        setDraftData(resData.draftItinerary);
        const updateLog: LogMessage = {
          id: Math.random().toString(36).substring(7),
          agent: "DraftAgent",
          status: "Itinerary updated successfully with user feedback.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        };
        setLogs((prev) => [...prev, updateLog]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to revise trip");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <Sparkles size={18} style={{ color: "var(--accent-teal)" }} />
          <span className="badge badge-teal">Autonomous Multi-Agent Planner</span>
        </div>
        <h1 style={{ marginBottom: "0.75rem" }}>
          Design Your <span className="gradient-text">Dream Itinerary</span>
        </h1>
        <p style={{ maxWidth: "600px", margin: "0 auto" }}>
          Deploy parallel worker agents to research flights, accommodations, dining, and curated sights, grounded in live travel intelligence.
        </p>
      </div>

      {errorMsg && (
        <div
          className="card"
          style={{
            borderColor: "rgba(239, 68, 68, 0.4)",
            background: "rgba(239, 68, 68, 0.1)",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <AlertCircle size={20} style={{ color: "var(--status-error)", flexShrink: 0 }} />
          <div style={{ color: "#fca5a5", fontSize: "0.9375rem" }}>{errorMsg}</div>
        </div>
      )}

      {/* Success Modal */}
      {finalSuccess && (
        <div
          className="card"
          style={{
            borderColor: "var(--accent-teal)",
            background: "rgba(20, 184, 166, 0.12)",
            marginBottom: "2rem",
            textAlign: "center",
            padding: "2.5rem",
          }}
        >
          <CheckCircle size={48} style={{ color: "var(--accent-teal)", margin: "0 auto 1rem auto" }} />
          <h2>Trip Finalized & Saved!</h2>
          <p style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            Your custom multi-day itinerary for {destination} is locked into your dashboard.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                setFinalSuccess(null);
                setIsPlanning(false);
                setCurrentStep(1);
              }}
              className="btn btn-secondary"
            >
              Plan Another Trip
            </button>
          </div>
        </div>
      )}

      {/* Execution View (Mounted on submit) */}
      {isPlanning ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <button
              onClick={() => setIsPlanning(false)}
              className="btn btn-ghost"
              disabled={isStreaming}
              style={{ fontSize: "0.875rem" }}
            >
              <ArrowLeft size={16} /> Back to Parameters
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className="badge badge-purple">{destination}</span>
              <span className="badge badge-teal">{totalDays} Days</span>
            </div>
          </div>

          <ThinkingAgentUI
            logs={logs}
            isStreaming={isStreaming}
            draftReady={draftReady}
            draftData={draftData}
            threadId={threadId}
            origin={origin}
            destination={destination}
            totalDays={totalDays}
            travelers={travelers}
            currency={currency}
            onApprove={handleApprove}
            onRequestChanges={handleRequestChanges}
            isSubmittingFeedback={isSubmittingFeedback}
            isFinalizing={isFinalizing}
          />
        </div>
      ) : (
        /* 3-Step Wizard View */
        <div className="card" style={{ maxWidth: "720px", margin: "0 auto" }}>
          {/* Stepper Header */}
          <div className="stepper">
            <div className="step-line" />

            <div
              className={`step-item ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}
              onClick={() => setCurrentStep(1)}
              style={{ cursor: "pointer" }}
            >
              <div className="step-circle">1</div>
              <span className="step-label">Destination</span>
            </div>

            <div
              className={`step-item ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}
              onClick={() => setCurrentStep(2)}
              style={{ cursor: "pointer" }}
            >
              <div className="step-circle">2</div>
              <span className="step-label">Dates & Budget</span>
            </div>

            <div
              className={`step-item ${currentStep === 3 ? "active" : ""}`}
              onClick={() => setCurrentStep(3)}
              style={{ cursor: "pointer" }}
            >
              <div className="step-circle">3</div>
              <span className="step-label">Preferences</span>
            </div>
          </div>

          {/* Step 1: Origin & Destination */}
          {currentStep === 1 && (
            <div>
              <div className="input-group">
                <DestinationSearch
                  label="Origin City / Departure Point"
                  placeholder="e.g. New York, JFK or New Delhi, India"
                  type="origin"
                  value={formData.origin}
                  onChange={(val) => setFormData((prev) => ({ ...prev, origin: val }))}
                />
              </div>

              <div className="input-group">
                <DestinationSearch
                  label="Target Destination"
                  placeholder="Search any destination worldwide (e.g. Kyoto, Reykjavik, Amalfi...)"
                  type="destination"
                  value={formData.destination}
                  onChange={(val) => setFormData((prev) => ({ ...prev, destination: val }))}
                />
              </div>

              <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  Popular Destinations:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {popularDestinations.map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, destination: dest }))}
                      className={`badge ${formData.destination === dest ? "badge-purple" : ""}`}
                      style={{ cursor: "pointer", textTransform: "none", fontSize: "0.8125rem" }}
                    >
                      {dest}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-primary"
                  disabled={!formData.destination.trim()}
                >
                  Continue to Dates <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Dates & Budget */}
          {currentStep === 2 && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="input-group">
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Duration Banner */}
              <div
                style={{
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.875rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-teal)" }}>
                  <Calendar size={18} />
                  <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Trip Duration:</span>
                </div>
                <span className="badge badge-teal" style={{ fontSize: "0.875rem", padding: "0.35rem 0.85rem" }}>
                  {totalDays} {totalDays === 1 ? "Day" : "Days"}
                </span>
              </div>

              {/* Interactive Number of Travelers Selector */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.875rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent-purple)",
                    }}
                  >
                    <Users size={18} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#ffffff", display: "block" }}>
                      Number of Travelers:
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {travelers === 1 ? "Solo traveler" : travelers === 2 ? "Duo / Couple trip" : `Group of ${travelers} travelers`}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => handleTravelersChange(travelers - 1)}
                    disabled={travelers <= 1}
                    className="btn btn-secondary"
                    style={{
                      width: "32px",
                      height: "32px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "var(--radius-sm)",
                      opacity: travelers <= 1 ? 0.35 : 1,
                      cursor: travelers <= 1 ? "not-allowed" : "pointer",
                    }}
                    aria-label="Decrease traveler count"
                  >
                    <Minus size={14} />
                  </button>

                  <div
                    style={{
                      minWidth: "44px",
                      textAlign: "center",
                      fontSize: "1.0625rem",
                      fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "var(--accent-teal)",
                      background: "rgba(20, 184, 166, 0.1)",
                      border: "1px solid rgba(20, 184, 166, 0.25)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.25rem 0.5rem",
                    }}
                  >
                    {travelers}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTravelersChange(travelers + 1)}
                    disabled={travelers >= 10}
                    className="btn btn-secondary"
                    style={{
                      width: "32px",
                      height: "32px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "var(--radius-sm)",
                      opacity: travelers >= 10 ? 0.35 : 1,
                      cursor: travelers >= 10 ? "not-allowed" : "pointer",
                    }}
                    aria-label="Increase traveler count"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="label">Estimated Budget ({currency})</label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <select
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    style={{ width: "115px" }}
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.symbol}>
                        {curr.label}
                      </option>
                    ))}
                  </select>

                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      min={minTotalBudget}
                      step={currencyCode === "INR" || currencyCode === "JPY" ? 500 : 50}
                      style={{
                        borderColor: isBudgetBelowMin ? "var(--status-error)" : undefined,
                      }}
                    />
                  </div>
                </div>

                {/* Insufficient Budget Warning Banner */}
                {isBudgetBelowMin && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.875rem 1rem",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                    }}
                  >
                    <AlertCircle size={18} style={{ color: "var(--status-error)", flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ flex: 1, fontSize: "0.8125rem", color: "#fca5a5", lineHeight: 1.5 }}>
                      <strong style={{ color: "#ffffff" }}>
                        Budget Below Realistic Minimum for {travelers} {travelers === 1 ? "Traveler" : "Travelers"}:
                      </strong>
                      <div style={{ marginTop: "0.25rem" }}>
                        A {totalDays}-day trip for {travelers} {travelers === 1 ? "person" : "people"} requires at least{" "}
                        <strong style={{ color: "#ffffff" }}>
                          {currencySymbol}{minTotalBudget.toLocaleString()}
                        </strong>{" "}
                        ({currencySymbol}{baseDailyPerPerson.toLocaleString()}/person/day in {currencyCode}) to realistically cover accommodation, meals, transit, and admissions.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBudget(minTotalBudget);
                          setErrorMsg("");
                        }}
                        className="btn btn-secondary"
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "0.75rem",
                          padding: "0.3rem 0.65rem",
                          borderColor: "rgba(239, 68, 68, 0.5)",
                          color: "#ffffff",
                        }}
                      >
                        Set to Minimum ({currencySymbol}{minTotalBudget.toLocaleString()})
                      </button>
                    </div>
                  </div>
                )}

                {!isBudgetBelowMin && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <span>Baseline: {currencySymbol}{baseDailyPerPerson.toLocaleString()} / person / day</span>
                    <span>Allocation: {currencySymbol}{Math.round(budget / (totalDays * travelers)).toLocaleString()} / person / day</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn btn-secondary"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isBudgetBelowMin) {
                      setErrorMsg(
                        `Please specify at least ${currencySymbol}${minTotalBudget.toLocaleString()} for a ${totalDays}-day trip with ${travelers} traveler(s).`
                      );
                      return;
                    }
                    setErrorMsg("");
                    setCurrentStep(3);
                  }}
                  className="btn btn-primary"
                  disabled={isBudgetBelowMin}
                  style={{
                    opacity: isBudgetBelowMin ? 0.5 : 1,
                    cursor: isBudgetBelowMin ? "not-allowed" : "pointer",
                  }}
                >
                  Continue to Preferences <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Travel Styles & Preferences */}
          {currentStep === 3 && (
            <div>
              <div className="input-group">
                <label className="label">Travel Style & Focus Tags</label>
                <div className="tags-grid">
                  {styleTags.map((tag) => {
                    const isActive = selectedTags.includes(tag);
                    return (
                      <div
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`tag-chip ${isActive ? "active" : ""}`}
                      >
                        <Compass size={14} />
                        {tag}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="input-group" style={{ marginTop: "1.5rem" }}>
                <label className="label">Specific Requests or Dietary Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={customPreferences}
                  onChange={(e) => setCustomPreferences(e.target.value)}
                  placeholder="e.g. Vegetarian dining recommendations, prefer public transport and walkable neighborhoods, avoid overcrowded tourist traps..."
                />
              </div>

              <div
                style={{
                  background: "var(--bg-surface-elevated)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  padding: "1rem 1.25rem",
                  marginTop: "1.5rem",
                  marginBottom: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Ready to deploy agent swarm?</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    4 parallel research workers will run destination-targeted Tavily queries.
                  </div>
                </div>
                <span className="badge badge-purple">4 Agents Ready</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-secondary"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleStartPlanning}
                  className="btn btn-primary"
                >
                  <Sparkles size={16} /> Launch Agent Planner
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
