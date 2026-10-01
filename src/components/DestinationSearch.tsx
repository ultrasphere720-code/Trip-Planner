"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Plane, X, Loader2, PlusCircle, Globe } from "lucide-react";

export interface PlaceSuggestion {
  title: string;
  subtitle: string;
  value: string;
}

// Backwards compatibility export
export interface DestinationItem {
  city: string;
  country: string;
  region?: string;
  popular?: boolean;
}

export const DEFAULT_GLOBAL_HUBS: PlaceSuggestion[] = [
  { title: "Tokyo", subtitle: "Kanto, Japan", value: "Tokyo, Japan" },
  { title: "Paris", subtitle: "Île-de-France, France", value: "Paris, France" },
  { title: "Rome", subtitle: "Lazio, Italy", value: "Rome, Italy" },
  { title: "New York", subtitle: "New York, USA", value: "New York, USA" },
  { title: "London", subtitle: "England, United Kingdom", value: "London, UK" },
  { title: "Dubai", subtitle: "Emirate of Dubai, UAE", value: "Dubai, UAE" },
  { title: "Barcelona", subtitle: "Catalonia, Spain", value: "Barcelona, Spain" },
  { title: "New Delhi", subtitle: "Delhi, India", value: "New Delhi, India" },
  { title: "Jaipur", subtitle: "Rajasthan, India", value: "Jaipur, India" },
  { title: "Singapore", subtitle: "Singapore", value: "Singapore" },
  { title: "Sydney", subtitle: "New South Wales, Australia", value: "Sydney, Australia" },
  { title: "Bangkok", subtitle: "Central Thailand, Thailand", value: "Bangkok, Thailand" },
];

export const POPULAR_DESTINATIONS: DestinationItem[] = DEFAULT_GLOBAL_HUBS.map((h) => {
  const parts = h.subtitle.split(", ");
  return {
    city: h.title,
    country: parts[parts.length - 1] || "",
    region: parts[0] || "",
    popular: true,
  };
});

/**
 * Photon geocoding API fetcher (OpenStreetMap-backed, global coverage, zero API keys required)
 */
export const fetchGlobalPlaces = async (
  query: string,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> => {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10`,
      { signal }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const rawList = (data.features || [])
      .map((item: any) => {
        const p = item.properties || {};
        const name = p.name;
        if (!name) return null;
        const state = p.state || p.county || "";
        const country = p.country || "";
        const subtitle = [state, country].filter(Boolean).join(", ");
        return {
          title: name,
          subtitle: subtitle || country,
          value: country ? `${name}, ${country}` : name,
        };
      })
      .filter(Boolean) as PlaceSuggestion[];

    // Deduplicate by value
    const seen = new Set<string>();
    const results: PlaceSuggestion[] = [];
    for (const item of rawList) {
      const key = item.value.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push(item);
      }
    }
    return results;
  } catch (error: any) {
    if (error?.name !== "AbortError") {
      console.error("Failed to query global cities:", error);
    }
    return [];
  }
};

export interface DestinationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  label?: string;
  type?: "origin" | "destination";
  className?: string;
}

export default function DestinationSearch({
  value,
  onChange,
  placeholder = "Search destination (e.g. Palermo, Paris, Tokyo...)",
  id,
  label,
  type = "destination",
  className = "",
}: DestinationSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>(DEFAULT_GLOBAL_HUBS);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputId = id || (type === "origin" ? "origin-search-input" : "destination-search-input");
  const isOrigin = type === "origin";

  // Check if query is 0 or 1 character
  const trimmed = value.trim();
  const isShortQuery = trimmed.length < 2;

  // Filter curated hubs for 0 or 1 char
  const defaultHubs = useMemo(() => {
    if (!trimmed) return DEFAULT_GLOBAL_HUBS;
    const q = trimmed.toLowerCase();
    const filtered = DEFAULT_GLOBAL_HUBS.filter(
      (h) => h.title.toLowerCase().includes(q) || h.subtitle.toLowerCase().includes(q)
    );
    return filtered.length > 0 ? filtered : DEFAULT_GLOBAL_HUBS;
  }, [trimmed]);

  // Dynamic worldwide Photon search with 250ms debounce
  useEffect(() => {
    if (!isOpen) return;

    if (isShortQuery) {
      setIsLoading(false);
      setSuggestions(defaultHubs);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const results = await fetchGlobalPlaces(trimmed, controller.signal);
      if (!controller.signal.aborted) {
        setSuggestions(results);
        setIsLoading(false);
        setHighlightedIndex(-1);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, isShortQuery, defaultHubs, isOpen]);

  // Check if current typed input matches an exact item already
  const exactMatch = useMemo(() => {
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    return suggestions.some(
      (s) => s.value.toLowerCase() === lower || s.title.toLowerCase() === lower
    );
  }, [trimmed, suggestions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: PlaceSuggestion) => {
    onChange(item.value);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSuggestions(DEFAULT_GLOBAL_HUBS);
    setIsOpen(true);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const showCustomOption = !exactMatch && trimmed.length > 0;
  const totalNavigable = suggestions.length + (showCustomOption ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalNavigable === 0) return;
      setHighlightedIndex((prev) => (prev + 1 >= totalNavigable ? 0 : prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalNavigable === 0) return;
      setHighlightedIndex((prev) => (prev - 1 < 0 ? totalNavigable - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      } else {
        // Freeform typing confirmed - close dropdown keeping current typed text
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
  };

  // Determine right padding for input to accommodate icons
  const rightPadding = isLoading && value ? "4.5rem" : value || isLoading ? "2.75rem" : "1rem";

  return (
    <div
      ref={containerRef}
      className={`destination-search-container ${isOrigin ? "origin" : "destination"} ${className}`}
    >
      {label && (
        <label htmlFor={inputId} className="label" style={{ display: "block", marginBottom: "0.5rem" }}>
          {label}
        </label>
      )}

      <div className="destination-input-wrapper">
        {isOrigin ? (
          <Plane size={18} className="destination-search-icon" />
        ) : (
          <MapPin size={18} className="destination-search-icon" />
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            paddingLeft: "2.75rem",
            paddingRight: rightPadding,
            width: "100%",
          }}
          autoComplete="off"
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div
            className="destination-loader"
            title="Searching global locations..."
            style={{
              position: "absolute",
              right: value ? "2.6rem" : "0.9rem",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            <Loader2 size={16} className="destination-spinner" />
          </div>
        )}

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="destination-clear-btn"
            title="Clear input"
            aria-label="Clear input"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="destination-dropdown" role="listbox">
          {/* Header indicator when loading or top hubs */}
          {isLoading ? (
            <div className="destination-loading-indicator">
              <Loader2 size={13} className="destination-spinner" />
              <span>Searching worldwide locations...</span>
            </div>
          ) : isShortQuery ? (
            <div className="destination-hub-header">
              <span>Top Global Hubs</span>
              <Globe size={13} />
            </div>
          ) : null}

          {/* Suggestions List */}
          {suggestions.length > 0 ? (
            suggestions.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <button
                  key={`${item.title}-${item.subtitle}-${idx}`}
                  type="button"
                  className={`destination-item ${isHighlighted ? "highlighted" : ""}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  role="option"
                  aria-selected={isHighlighted}
                >
                  <div className="destination-item-icon">
                    {isOrigin ? <Plane size={16} /> : <MapPin size={16} />}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span className="destination-item-city">{item.title}</span>
                    <span className="destination-item-country">{item.subtitle}</span>
                  </div>
                </button>
              );
            })
          ) : (
            /* No results message */
            !isLoading && (
              <div className="destination-no-matches">
                No preset matches — press Enter or keep typing your custom location
              </div>
            )
          )}

          {/* Option to accept typed custom location */}
          {showCustomOption && (
            <button
              type="button"
              className={`destination-custom-item ${
                highlightedIndex === suggestions.length ? "highlighted" : ""
              }`}
              onClick={() => {
                setIsOpen(false);
                setHighlightedIndex(-1);
              }}
              onMouseEnter={() => setHighlightedIndex(suggestions.length)}
            >
              <PlusCircle size={16} style={{ flexShrink: 0 }} />
              <span>
                Use &quot;{trimmed}&quot; as custom {isOrigin ? "departure" : "destination"}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
