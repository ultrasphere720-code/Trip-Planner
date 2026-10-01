"use client";

import React, { useState } from "react";
import {
  MapPin,
  Calendar,
  DollarSign,
  ChevronRight,
  Clock,
  Sparkles,
  Plane,
  X,
  Users,
  Trash2,
  Loader2,
} from "lucide-react";
import Timeline, { getCurrencySymbol } from "./Timeline";

export interface SerializedTrip {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  budget: number;
  currency: string;
  travelers?: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  preferences: string;
  itinerary: any;
  status: string;
  totalEstimatedCost: number;
  createdAt: string;
}

interface DashboardTripListProps {
  trips: SerializedTrip[];
}

export default function DashboardTripList({ trips }: DashboardTripListProps) {
  const [tripList, setTripList] = useState<SerializedTrip[]>(trips);
  const [selectedTrip, setSelectedTrip] = useState<SerializedTrip | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  React.useEffect(() => {
    setTripList(trips);
  }, [trips]);

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this trip itinerary? This action cannot be undone.")) {
      return;
    }

    setDeletingId(tripId);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete trip");
      }

      setTripList((prev) => prev.filter((t) => t.id !== tripId));
      if (selectedTrip?.id === tripId) {
        setSelectedTrip(null);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete trip");
    } finally {
      setDeletingId(null);
    }
  };

  if (!tripList || tripList.length === 0) {
    return (
      <div
        className="card"
        style={{
          textAlign: "center",
          padding: "4rem 2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <Plane size={48} style={{ color: "var(--accent-purple)", opacity: 0.6 }} />
        <h3>No Finalized Trips Yet</h3>
        <p style={{ maxWidth: "450px", color: "var(--text-secondary)" }}>
          You haven't locked in any travel itineraries yet. Use the multi-agent planner to research and generate your first trip.
        </p>
        <a href="/plan-trip" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
          <Sparkles size={16} /> Plan a New Trip
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Trip Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {tripList.map((trip) => {
          const formattedStart = new Date(trip.startDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const formattedEnd = new Date(trip.endDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <div
              key={trip.id}
              className="card"
              onClick={() => setSelectedTrip(trip)}
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "1.5rem",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span className="badge badge-teal">
                    {trip.status}
                  </span>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <Users size={12} />
                      {trip.travelers || 1} {(trip.travelers || 1) === 1 ? "Traveler" : "Travelers"}
                    </span>
                    <span className="badge badge-teal">
                      {trip.totalDays} Days
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: "1.35rem", marginBottom: "0.35rem" }}>
                  <span className="gradient-text">{trip.destination}</span>
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                  <Plane size={13} style={{ color: "var(--text-muted)" }} />
                  <span>From: {trip.origin}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  <Calendar size={14} style={{ color: "var(--accent-teal)" }} />
                  <span>{formattedStart} — {formattedEnd}</span>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                    Total Estimated Cost
                  </span>
                  <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {getCurrencySymbol(trip.currency)}{trip.totalEstimatedCost.toLocaleString()}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "0.5rem 0.875rem", fontSize: "0.8125rem" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrip(trip);
                    }}
                  >
                    View Itinerary <ChevronRight size={14} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    title="Delete Trip"
                    aria-label="Delete Trip"
                    disabled={deletingId === trip.id}
                    onClick={(e) => handleDeleteTrip(e, trip.id)}
                    style={{
                      padding: "0.5rem 0.65rem",
                      color: "#f87171",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(239, 68, 68, 0.08)",
                      cursor: deletingId === trip.id ? "not-allowed" : "pointer",
                      opacity: deletingId === trip.id ? 0.6 : 1,
                    }}
                  >
                    {deletingId === trip.id ? (
                      <Loader2 size={15} className="spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Trip Timeline Modal */}
      {selectedTrip && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 7, 20, 0.85)",
            backdropFilter: "blur(12px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setSelectedTrip(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: "850px",
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
              position: "relative",
              padding: "2rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  <span className="badge badge-teal">Finalized Itinerary</span>
                  <span className="badge badge-purple">{selectedTrip.totalDays} Days</span>
                  <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <Users size={12} />
                    {selectedTrip.travelers || 1} {(selectedTrip.travelers || 1) === 1 ? "Traveler" : "Travelers"}
                  </span>
                </div>
                <h2>
                  Full Itinerary: <span className="gradient-text">{selectedTrip.destination}</span>
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.35rem", fontSize: "0.875rem", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                  <span>Origin: {selectedTrip.origin}</span>
                  <span>•</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <Users size={14} style={{ color: "var(--accent-purple)" }} />
                    Party: {selectedTrip.travelers || 1} {(selectedTrip.travelers || 1) === 1 ? "Traveler" : "Travelers"}
                  </span>
                  <span>•</span>
                  <span>Budget: {getCurrencySymbol(selectedTrip.currency)}{selectedTrip.totalEstimatedCost.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="btn btn-ghost"
                style={{ padding: "0.5rem", borderRadius: "50%" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Embedded Timeline View */}
            <Timeline
              days={selectedTrip.itinerary?.days || []}
              currency={selectedTrip.currency}
              destination={selectedTrip.destination}
              trip={selectedTrip}
              initiallyExpanded={true}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem" }}>
              <button
                type="button"
                disabled={deletingId === selectedTrip.id}
                onClick={(e) => handleDeleteTrip(e, selectedTrip.id)}
                className="btn btn-ghost"
                style={{
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  background: "rgba(239, 68, 68, 0.08)",
                  padding: "0.6rem 1rem",
                  fontSize: "0.875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  cursor: deletingId === selectedTrip.id ? "not-allowed" : "pointer",
                }}
              >
                {deletingId === selectedTrip.id ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Delete Trip
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="btn btn-secondary"
              >
                Close Itinerary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
