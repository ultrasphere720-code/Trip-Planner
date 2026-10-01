import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import DashboardTripList, { SerializedTrip } from "@/components/DashboardTripList";
import { Sparkles, Shield, Compass, Plus, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  let rawTrips: any[] = [];
  let userEmail = session?.user?.email || null;

  if (userEmail) {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        trips: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (user && user.trips) {
      rawTrips = user.trips;
    }
  }

  // If user has no trips or is exploring demo mode, fetch recent finalized trips
  if (rawTrips.length === 0) {
    rawTrips = await prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  }

  // Serialize trips safely for Client Component
  const trips: SerializedTrip[] = rawTrips.map((trip) => {
    let parsedItinerary = null;
    try {
      parsedItinerary = typeof trip.itinerary === "string" ? JSON.parse(trip.itinerary) : trip.itinerary;
    } catch {
      parsedItinerary = null;
    }

    return {
      id: trip.id,
      userId: trip.userId,
      origin: trip.origin,
      destination: trip.destination,
      budget: trip.budget,
      currency: trip.currency,
      travelers: Number(trip.travelers) || 1,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      totalDays: trip.totalDays,
      preferences: trip.preferences,
      itinerary: parsedItinerary,
      status: trip.status,
      totalEstimatedCost: trip.totalEstimatedCost,
      createdAt: trip.createdAt.toISOString(),
    };
  });

  return (
    <div className="page-container">
      {/* Dashboard Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2.5rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Compass size={18} style={{ color: "var(--accent-teal)" }} />
            <span className="badge badge-teal">Your Saved Journeys</span>
          </div>
          <h1>
            Travel <span className="gradient-text">Command Center</span>
          </h1>
          <p style={{ marginTop: "0.25rem" }}>
            Review, inspect, and manage your agent-finalized travel itineraries and multi-day schedules.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {session?.user ? (
            <div className="badge badge-purple" style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}>
              <User size={14} />
              <span>{session.user.name || session.user.email}</span>
            </div>
          ) : (
            <a href="/login" className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}>
              <Shield size={14} /> Sign In
            </a>
          )}

          <a href="/plan-trip" className="btn btn-primary">
            <Plus size={16} /> Plan New Trip
          </a>
        </div>
      </div>

      {/* Trip List Grid with Interactive Timeline Modal */}
      <DashboardTripList trips={trips} />
    </div>
  );
}
