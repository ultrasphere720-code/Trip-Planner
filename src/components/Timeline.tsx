"use client";

import React, { useState } from "react";
import {
  MapPin,
  Utensils,
  ChevronDown,
  Calendar,
  Clock,
  Landmark,
  Compass,
  Hotel,
  Sparkles,
} from "lucide-react";
import type { ItineraryActivity, ItineraryDay } from "@/lib/agent/tools";
import { getCurrencySymbol } from "@/lib/currency";
import { getDestinationImageUrl } from "@/lib/destinationImages";
import { getLandmarkPhoto } from "@/lib/landmarkImage";

export type { ItineraryActivity, ItineraryDay };
export { getCurrencySymbol };

export interface TimelineProps {
  days: any[];
  currency?: string;
  trip?: any;
  initiallyExpanded?: boolean;
  destination?: string;
}

/**
 * Returns icon, badge class, and accent styling based on exact category enum:
 * "SIGHT & CULTURE" | "DINING & CUISINE" | "LOCAL TRANSIT" | "ACCOMMODATION" | "ENTERTAINMENT"
 */
function getCategoryMeta(category: string) {
  switch (category) {
    case "SIGHT & CULTURE":
      return {
        label: "SIGHT & CULTURE",
        icon: <Landmark size={12} />,
        badgeClass: "badge-cat-culture",
      };
    case "DINING & CUISINE":
      return {
        label: "DINING & CUISINE",
        icon: <Utensils size={12} />,
        badgeClass: "badge-cat-dining",
      };
    case "LOCAL TRANSIT":
      return {
        label: "LOCAL TRANSIT",
        icon: <Compass size={12} />,
        badgeClass: "badge-cat-transit",
      };
    case "ACCOMMODATION":
      return {
        label: "ACCOMMODATION",
        icon: <Hotel size={12} />,
        badgeClass: "badge-cat-hotel",
      };
    case "ENTERTAINMENT":
      return {
        label: "ENTERTAINMENT",
        icon: <Sparkles size={12} />,
        badgeClass: "badge-cat-entertainment",
      };
    default:
      return {
        label: category || "EXPERIENCE",
        icon: <Compass size={12} />,
        badgeClass: "badge-cat-culture",
      };
  }
}

/**
 * Normalizes both new ItineraryDay schema and legacy `{ morning, afternoon, evening, meals }` format
 * so previous database records continue to render smoothly.
 */
function normalizeDay(rawDay: any, dayIdx: number): ItineraryDay {
  if (Array.isArray(rawDay.activities) && rawDay.activities.length > 0) {
    const actSum = rawDay.activities.reduce((sum: number, a: any) => {
      const c = a?.estimatedCost ?? a?.estimatedCostUSD ?? a?.cost ?? 0;
      const num = typeof c === "number" ? c : parseFloat(String(c).replace(/[^0-9.]/g, "")) || 0;
      return sum + num;
    }, 0);
    const rawTotal = rawDay?.estimatedTotal ?? rawDay?.estimatedTotalUSD ?? (actSum > 0 ? actSum : 0);
    const total = Number(rawTotal) > 0 ? Number(rawTotal) : actSum;

    return {
      dayNumber: rawDay.dayNumber || dayIdx + 1,
      title: rawDay.title || rawDay.theme || `Day ${rawDay.dayNumber || dayIdx + 1}`,
      date: rawDay.date || "",
      estimatedTotal: total,
      estimatedTotalUSD: total,
      activities: rawDay.activities.map((a: any, aIdx: number) => {
        const c = a?.estimatedCost ?? a?.estimatedCostUSD ?? a?.cost ?? 0;
        const num = typeof c === "number" ? c : parseFloat(String(c).replace(/[^0-9.]/g, "")) || 0;
        return {
          ...a,
          id: a?.id || `act-${rawDay.dayNumber || dayIdx + 1}-${aIdx + 1}`,
          estimatedCost: num,
          estimatedCostUSD: num,
          imageUrl: a?.imageUrl,
        };
      }),
    };
  }

  // Seamless legacy adapter
  const activities: ItineraryActivity[] = [];
  if (rawDay.morning) {
    activities.push({
      id: `act-${dayIdx}-1`,
      time: "09:30 AM",
      category: "SIGHT & CULTURE",
      title: rawDay.morning.activity || "Morning Exploration",
      location: rawDay.morning.location || "Historic Center",
      description: rawDay.morning.activity || "Explore historical sights and cultural landmarks.",
      estimatedCost: rawDay.morning.estimatedCost || 20,
      estimatedCostUSD: rawDay.morning.estimatedCost || 20,
    });
  }
  if (rawDay.meals?.lunch) {
    activities.push({
      id: `act-${dayIdx}-2`,
      time: "12:30 PM",
      category: "DINING & CUISINE",
      title: rawDay.meals.lunch,
      location: rawDay.morning?.location || "Local District",
      description: "Authentic lunch savoring regional culinary specialties.",
      estimatedCost: 24,
      estimatedCostUSD: 24,
    });
  }
  if (rawDay.afternoon) {
    activities.push({
      id: `act-${dayIdx}-3`,
      time: "03:00 PM",
      category: "ENTERTAINMENT",
      title: rawDay.afternoon.activity || "Afternoon Experience",
      location: rawDay.afternoon.location || "Arts District",
      description: rawDay.afternoon.activity || "Experience celebrated local venues and attractions.",
      estimatedCost: rawDay.afternoon.estimatedCost || 30,
      estimatedCostUSD: rawDay.afternoon.estimatedCost || 30,
    });
  }
  if (rawDay.evening) {
    activities.push({
      id: `act-${dayIdx}-4`,
      time: "07:00 PM",
      category: "SIGHT & CULTURE",
      title: rawDay.evening.activity || "Evening Atmosphere",
      location: rawDay.evening.location || "City Center",
      description: rawDay.evening.activity || "Evening highlights and night views across the city.",
      estimatedCost: rawDay.evening.estimatedCost || 25,
      estimatedCostUSD: rawDay.evening.estimatedCost || 25,
    });
  }
  if (rawDay.meals?.dinner) {
    activities.push({
      id: `act-${dayIdx}-5`,
      time: "08:30 PM",
      category: "DINING & CUISINE",
      title: rawDay.meals.dinner,
      location: rawDay.evening?.location || "Dining Promenade",
      description: "Traditional evening dining showcasing authentic recipes and hospitality.",
      estimatedCost: 45,
      estimatedCostUSD: 45,
    });
  }

  const computedTotal = activities.reduce((sum, a) => sum + a.estimatedCostUSD, 0);

  return {
    dayNumber: rawDay.dayNumber || dayIdx + 1,
    title: rawDay.title || rawDay.theme || `Day ${rawDay.dayNumber || dayIdx + 1}`,
    date: rawDay.date || "",
    estimatedTotal: rawDay.estimatedTotal ?? rawDay.estimatedTotalUSD ?? computedTotal,
    estimatedTotalUSD: rawDay.estimatedTotal ?? rawDay.estimatedTotalUSD ?? computedTotal,
    activities,
  };
}

/**
 * Strips repetitive prefixes from day.title and ensures a meaningful theme displays
 */
const getCleanDayTitle = (day: any, index: number) => {
  if (!day?.title) return `Highlights & Exploration`;
  const cleaned = day.title.replace(/^Day\s*\d+\s*[:\-–]?\s*/i, "").trim();
  if (!cleaned || /^Day\s*\d+$/i.test(cleaned)) {
    const firstAct = day.activities?.[0]?.title;
    return firstAct ? `${firstAct} & Local Highlights` : `Day ${day.dayNumber || index + 1} Itinerary`;
  }
  return cleaned;
};

/**
 * Defensive day total calculation
 */
const calculateDayTotal = (day: any, trip?: any, fallbackDaysLength: number = 1): number => {
  const explicitTotal = Number(day?.estimatedTotal ?? day?.estimatedTotalUSD ?? day?.totalCost ?? 0);
  if (explicitTotal > 0) return explicitTotal;

  if (Array.isArray(day?.activities) && day.activities.length > 0) {
    const sum = day.activities.reduce((acc: number, act: any) => {
      const rawCost = act?.estimatedCost ?? act?.estimatedCostUSD ?? act?.cost ?? 0;
      const num = typeof rawCost === "number" ? rawCost : parseFloat(String(rawCost).replace(/[^0-9.]/g, "")) || 0;
      return acc + num;
    }, 0);
    if (sum > 0) return sum;
  }

  const tripBudget = Number(trip?.budget ?? 0);
  const totalDays = Number(trip?.totalDays ?? fallbackDaysLength ?? 1);
  if (tripBudget > 0 && totalDays > 0) {
    return Math.round(tripBudget / totalDays);
  }
  return 0;
};

/**
 * Dedicated Activity Card with dynamic landmark photo resolution
 */
function ActivityTimelineItem({
  activity,
  meta,
  numCost,
  symbol,
  isLast,
  city = "",
}: {
  activity: ItineraryActivity;
  meta: ReturnType<typeof getCategoryMeta>;
  numCost: number;
  symbol: string;
  isLast: boolean;
  city?: string;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    activity.imageUrl && !activity.imageUrl.includes("1469854523086") ? activity.imageUrl : null
  );
  const [photoFailed, setPhotoFailed] = useState(false);

  React.useEffect(() => {
    // If activity already has a genuine imageUrl (not the old generic fallback photo)
    if (activity.imageUrl && !activity.imageUrl.includes("1469854523086")) {
      setPhotoUrl(activity.imageUrl);
      return;
    }

    // Dynamic Wikimedia landmark photo lookup for sights, culture, and entertainment
    if (activity.category === "SIGHT & CULTURE" || activity.category === "ENTERTAINMENT") {
      let isMounted = true;
      getLandmarkPhoto(activity.title, city || activity.location || "")
        .then((url) => {
          if (isMounted) {
            setPhotoUrl(url); // Genuine photo or null (never a fake stock fallback)
          }
        })
        .catch(() => {
          if (isMounted) setPhotoUrl(null);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setPhotoUrl(null);
    }
  }, [activity.title, activity.imageUrl, activity.category, activity.location, city]);

  const showPhoto = photoUrl && !photoFailed;

  return (
    <div className="activity-timeline-node">
      {/* Vertical Rail with Glowing Indicator */}
      <div className="activity-rail">
        <div className="activity-rail-dot" />
        {!isLast && <div className="activity-rail-line" />}
      </div>

      {/* Card Body */}
      <div className="activity-card-container">
        {/* Top Bar: Time, Category Badge, Price */}
        <div className="activity-card-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <div className="activity-time-chip">
              <Clock size={12} />
              <span>{activity.time}</span>
            </div>
            <div className={`activity-category-pill ${meta.badgeClass}`}>
              {meta.icon}
              <span>{meta.label}</span>
            </div>
          </div>

          <div className="activity-price-pill">
            {numCost > 0 ? (
              <span>
                {symbol}
                {numCost.toLocaleString()}
              </span>
            ) : (
              <span style={{ color: "var(--status-success)" }}>Free Entry</span>
            )}
          </div>
        </div>

        {/* Title (Real Landmark / Venue Name) */}
        <h4 className="activity-card-title">{activity.title}</h4>

        {/* Location (Neighborhood / District) */}
        <div className="activity-location-tag">
          <MapPin size={13} style={{ color: "var(--accent-teal)" }} />
          <span>{activity.location}</span>
        </div>

        {/* Dynamic Landmark Photo */}
        {showPhoto && (
          <div className="activity-photo-container">
            <img
              src={photoUrl}
              alt={activity.title}
              className="activity-photo-img"
              loading="lazy"
              onError={() => setPhotoFailed(true)}
            />
            <div className="activity-photo-overlay">
              <span className="activity-photo-tag">
                <Landmark size={11} /> Landmark Photo
              </span>
            </div>
          </div>
        )}

        {/* Description (1-2 sentences) */}
        <p className="activity-card-description">{activity.description}</p>
      </div>
    </div>
  );
}

export default function Timeline({
  days = [],
  currency = "$",
  trip,
  initiallyExpanded = true,
  destination,
}: TimelineProps) {
  const symbol = getCurrencySymbol(currency);
  const normalizedDays = React.useMemo(() => {
    return (days || []).map((d, i) => normalizeDay(d, i));
  }, [days]);

  const targetDestination = destination || trip?.destination || trip?.targetDestination || "";
  const totalActivitiesCount = normalizedDays.reduce((acc, d) => acc + (d.activities?.length || 0), 0);

  const formatPrice = (amount: number, curr?: string) => {
    const sym = getCurrencySymbol(curr || currency);
    return `${sym}${Number(amount || 0).toLocaleString()}`;
  };

  // Open states keyed by dayNumber
  const [openDays, setOpenDays] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    normalizedDays.forEach((day, index) => {
      initial[day.dayNumber] = initiallyExpanded || index === 0;
    });
    return initial;
  });

  const toggleDay = (dayNumber: number) => {
    setOpenDays((prev) => ({
      ...prev,
      [dayNumber]: !prev[dayNumber],
    }));
  };

  const expandAll = () => {
    const allOpen: Record<number, boolean> = {};
    normalizedDays.forEach((day) => {
      allOpen[day.dayNumber] = true;
    });
    setOpenDays(allOpen);
  };

  const collapseAll = () => {
    setOpenDays({});
  };

  if (!normalizedDays || normalizedDays.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
        <p style={{ color: "var(--text-muted)" }}>No itinerary days available to display.</p>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {/* Destination Hero Banner */}
      {targetDestination && (
        <div className="timeline-destination-hero">
          <img
            src={getDestinationImageUrl(targetDestination, 1200, 450)}
            alt={targetDestination}
            className="timeline-hero-img"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";
            }}
          />
          <div className="timeline-hero-gradient" />
          <div className="timeline-hero-content">
            <div className="timeline-hero-badge">
              <Sparkles size={13} style={{ color: "var(--accent-teal)" }} />
              <span>Curated Visual Travel Guide</span>
            </div>
            <h2 className="timeline-hero-title">{targetDestination}</h2>
            <p className="timeline-hero-subtitle">
              {normalizedDays.length} Days &bull; {totalActivitiesCount} Experiences Grounded with Verified Landmark Photos
            </p>
          </div>
        </div>
      )}

      {/* Top Controls Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            {normalizedDays.length} Verified Daily Itinerary Tracks
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={expandAll}
            className="btn btn-ghost"
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="btn btn-ghost"
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Day Cards Stack */}
      {normalizedDays.map((day, index) => {
        const isOpen = !!openDays[day.dayNumber];

        return (
          <div key={day.dayNumber} className={`timeline-card ${isOpen ? "open" : ""}`}>
            {/* Day Header Trigger */}
            <div
              className="timeline-header"
              onClick={() => toggleDay(day.dayNumber)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleDay(day.dayNumber);
                }
              }}
            >
              <div className="timeline-day-pill">
                <span className="day-badge">Day {day.dayNumber || index + 1}</span>
                <div>
                  <h3 className="timeline-day-title day-title">
                    {getCleanDayTitle(day, index)}
                  </h3>
                  {day.date && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: "0.2rem",
                      }}
                    >
                      <Calendar size={12} />
                      <span>{day.date}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span className="badge badge-purple day-budget-pill" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                  EST. {formatPrice(calculateDayTotal(day, trip, normalizedDays.length), trip?.currency || currency)}
                </span>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <ChevronDown size={18} style={{ color: "var(--text-secondary)" }} />
                </div>
              </div>
            </div>

            {/* Collapsible Timeline Content */}
            {isOpen && (
              <div
                className="timeline-body"
                style={{
                  animation: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div className="activity-timeline-track">
                  {day.activities.map((activity, idx) => {
                    const meta = getCategoryMeta(activity.category);
                    const isLast = idx === day.activities.length - 1;

                    const rawCost = activity?.estimatedCost ?? activity?.estimatedCostUSD ?? (activity as any)?.cost ?? 0;
                    const numCost = typeof rawCost === "number" ? rawCost : parseFloat(String(rawCost).replace(/[^0-9.]/g, "")) || 0;

                    return (
                      <ActivityTimelineItem
                        key={activity.id || idx}
                        activity={activity}
                        meta={meta}
                        numCost={numCost}
                        symbol={symbol}
                        isLast={isLast}
                        city={targetDestination}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
