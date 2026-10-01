import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Plane,
  Hotel,
  Utensils,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
} from "lucide-react";

export default function HomePage() {
  const agents = [
    {
      name: "Flight Agent",
      icon: <Plane size={20} style={{ color: "#38bdf8" }} />,
      desc: "Scours flight routes and optimal transport connections from your home city.",
      badge: "Logistics",
    },
    {
      name: "Hotel Agent",
      icon: <Hotel size={20} style={{ color: "#a855f7" }} />,
      desc: "Searches verified accommodations and boutique stays tailored to your budget.",
      badge: "Hospitality",
    },
    {
      name: "Culinary Agent",
      icon: <Utensils size={20} style={{ color: "#14b8a6" }} />,
      desc: "Unearths local dining treasures, regional street food, and authentic gastronomy.",
      badge: "Dining",
    },
    {
      name: "Attraction Agent",
      icon: <MapPin size={20} style={{ color: "#f59e0b" }} />,
      desc: "Curates iconic landmarks, cultural treasures, and hidden neighborhood gems.",
      badge: "Experiences",
    },
  ];

  return (
    <>
      <main className="hero-container" style={{ position: "relative", width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
        {/* Background Image Layer */}
        <div className="hero-bg-wrapper" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
          <Image
            alt="Scenic coastal highway backdrop"
            className="hero-bg-image"
            fill
            priority
            sizes="100vw"
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=85"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
          {/* Dark Cinematic Gradient Overlay */}
          <div className="hero-overlay" />
        </div>

        {/* Navigation Bar */}
        <header className="hero-nav" style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "1.75rem 3.5rem", boxSizing: "border-box" }}>
          <div className="brand-logo" style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em" }}>
            ObritTravel
          </div>
          <nav className="nav-links" style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <Link href="#how-it-works">How It Works</Link>
            <Link href="#destinations">Destinations</Link>
            <Link className="login-link" href="/login">Login</Link>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="hero-content" style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem 1.5rem 5rem 1.5rem", maxWidth: "920px", margin: "0 auto", width: "100%" }}>
          <h1 className="hero-title">Your Perfect<br />Journey Starts Here</h1>
          <p className="hero-subtitle">
            Tell us your dates, budget and pace. You get a day-by-day itinerary you can actually follow.
          </p>
          <div className="hero-cta-group">
            <Link className="btn-primary" href="/plan-trip">
              Plan a trip free &rarr;
            </Link>
          </div>
          <p className="hero-microcopy">
            No account, no card. See a real multi-day plan first, keep it if you like it.
          </p>
        </div>
      </main>

      {/* Additional landing page sections */}
      <div className="page-container" id="how-it-works">
        {/* Parallel Agents Architecture Showcase */}
        <div style={{ marginTop: "3rem", marginBottom: "5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="badge badge-purple" style={{ marginBottom: "0.5rem" }}>
              Parallel Multi-Agent Swarm
            </span>
            <h2>4 Specialized Research Workers</h2>
            <p style={{ maxWidth: "540px", margin: "0.5rem auto 0 auto" }}>
              The supervisor agent executes 4 concurrent research tasks, grounding each query strictly in your target destination.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {agents.map((ag, i) => (
              <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {ag.icon}
                  </div>
                  <span className="badge badge-teal" style={{ fontSize: "0.7rem" }}>
                    {ag.badge}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>{ag.name}</h4>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{ag.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div
          id="pricing"
          className="card"
          style={{
            border: "1px solid var(--border-hover)",
            background: "linear-gradient(180deg, #130f26 0%, #0c0818 100%)",
            padding: "3rem 2.5rem",
            marginBottom: "4rem",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="badge badge-teal" style={{ marginBottom: "0.5rem" }}>
              Engineering Highlights
            </span>
            <h2>Designed for Precision & Speed</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "2rem",
            }}
          >
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ color: "var(--accent-teal)", flexShrink: 0 }}>
                <Clock size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: "1.05rem", marginBottom: "0.35rem" }}>Strict Multi-Day Calculation</h4>
                <p style={{ fontSize: "0.875rem" }}>
                  Mathematical calendar validation guarantees that every single day from departure to return receives morning, afternoon, and evening recommendations.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ color: "var(--accent-purple)", flexShrink: 0 }}>
                <Cpu size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: "1.05rem", marginBottom: "0.35rem" }}>Real-Time SSE Streaming</h4>
                <p style={{ fontSize: "0.875rem" }}>
                  Watch parallel agents execute live through a terminal-style interface as Tavily search results are gathered and synthesized.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ color: "var(--status-success)", flexShrink: 0 }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: "1.05rem", marginBottom: "0.35rem" }}>Human-In-The-Loop Revision</h4>
                <p style={{ fontSize: "0.875rem" }}>
                  State checkpoints allow you to inspect the draft, request targeted refinements, and finalize your trip directly to your SQLite database.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          id="destinations"
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            borderRadius: "var(--radius-lg)",
            background: "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, rgba(19, 15, 38, 0.5) 70%)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "4rem",
          }}
        >
          <h2 style={{ marginBottom: "0.75rem" }}>Ready to Experience Next-Gen Travel Planning?</h2>
          <p style={{ maxWidth: "500px", margin: "0 auto 1.75rem auto", color: "var(--text-secondary)" }}>
            Pick a destination, set your budget, and watch the agents build your complete schedule in seconds.
          </p>
          <Link href="/plan-trip" className="btn btn-primary" style={{ padding: "0.875rem 2.25rem" }}>
            Launch Trip Wizard &rarr;
          </Link>
        </div>
      </div>
    </>
  );
}
