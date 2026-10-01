"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Sparkles, LayoutDashboard, MapPin } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px var(--accent-purple-glow)",
            }}
          >
            <Compass size={20} color="#ffffff" />
          </div>
          <div>
            <span className="gradient-text" style={{ fontSize: "1.25rem", fontWeight: 800 }}>
              OrbitTravel
            </span>
            <span
              className="badge badge-purple"
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.65rem",
                padding: "0.15rem 0.45rem",
                verticalAlign: "middle",
              }}
            >
              Multi-Agent AI
            </span>
          </div>
        </Link>

        <div className="nav-links">
          <Link
            href="/plan-trip"
            className={`nav-link ${pathname === "/plan-trip" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Sparkles size={16} />
            <span>Plan Trip</span>
          </Link>

          <Link
            href="/dashboard"
            className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/plan-trip"
            className="btn btn-primary"
            style={{ padding: "0.5rem 1.1rem", fontSize: "0.875rem" }}
          >
            Launch Swarm
          </Link>
        </div>
      </div>
    </nav>
  );
}
