import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { tripPlannerGraph } from "@/lib/agent/tripPlannerGraph";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { threadId, approved, feedback, tripData } = body;

    if (!threadId) {
      return NextResponse.json(
        { error: "threadId is required to resume or finalize itinerary." },
        { status: 400 }
      );
    }

    const threadConfig = {
      configurable: {
        thread_id: threadId,
      },
    };

    // Case 1: Human Approved the Itinerary -> Finalize and Save to Prisma
    if (approved === true) {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json(
          { error: "Unauthorized: You must be logged in to save and finalize your trip." },
          { status: 401 }
        );
      }

      // Find user in Prisma database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User account not found." },
          { status: 404 }
        );
      }

      // Retrieve state from LangGraph checkpointer
      const graphState = await tripPlannerGraph.getState(threadConfig);
      const stateValues = graphState?.values || {};

      // Transition workflow to completion
      await tripPlannerGraph.updateState(threadConfig, { approved: true });
      await tripPlannerGraph.invoke(null, threadConfig);

      const origin = tripData?.origin || stateValues.origin || "Origin City";
      const destination = tripData?.destination || stateValues.destination || "Destination";
      const budget = Number(tripData?.budget ?? stateValues.budget ?? 0);
      const currency = tripData?.currency || "USD";
      const travelers = Math.max(1, Math.min(10, Number(tripData?.travelers ?? stateValues.travelers ?? 1)));
      const startDate = new Date(tripData?.startDate || stateValues.startDate || new Date());
      const endDate = new Date(tripData?.endDate || stateValues.endDate || new Date());
      const totalDays = Number(tripData?.totalDays ?? stateValues.totalDays ?? 1);
      const preferences = tripData?.preferences || stateValues.preferences || "";
      const itineraryObj = tripData?.itinerary || stateValues.draftItinerary || {};
      const itineraryStr = typeof itineraryObj === "string" ? itineraryObj : JSON.stringify(itineraryObj);
      const totalEstimatedCost = Number(
        tripData?.totalEstimatedCost ??
          stateValues.draftItinerary?.totalBudgetUSD ??
          stateValues.draftItinerary?.totalEstimatedCost ??
          budget
      );

      const trip = await prisma.trip.create({
        data: {
          userId: user.id,
          origin,
          destination,
          budget,
          currency,
          travelers,
          startDate,
          endDate,
          totalDays,
          preferences,
          itinerary: itineraryStr,
          status: "FINALIZED",
          totalEstimatedCost,
        } as any,
      });

      return NextResponse.json({
        success: true,
        tripId: trip.id,
        status: "FINALIZED",
      });
    }

    // Case 2: Human requested changes (approved === false) -> Resume with feedback
    const humanFeedbackText = feedback || "Please refine the itinerary with more variety and local experiences.";

    await tripPlannerGraph.updateState(threadConfig, {
      humanFeedback: humanFeedbackText,
      approved: false,
    });

    // Check if client expects Server-Sent Events
    const acceptHeader = req.headers.get("accept") || "";
    const isSSE = acceptHeader.includes("text/event-stream") || req.nextUrl.searchParams.get("stream") === "true";

    if (isSSE) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: Record<string, any>) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          try {
            sendEvent("update", {
              agent: "draftAgent",
              status: "Revising multi-day itinerary incorporating your feedback...",
            });

            const eventStream = await tripPlannerGraph.stream(null, {
              ...threadConfig,
              streamMode: "updates" as const,
            });

            for await (const chunk of eventStream) {
              if ("draftAgent" in chunk) {
                sendEvent("update", {
                  agent: "draftAgent",
                  status: "Drafting revised itinerary incorporating your feedback...",
                });
              }
              if ("validateDraft" in chunk) {
                sendEvent("update", {
                  agent: "draftAgent",
                  status: "Validating diversity of revised itinerary...",
                });
              }
            }

            const updatedState = await tripPlannerGraph.getState(threadConfig);
            const revisedDraft = updatedState.values?.draftItinerary;

            sendEvent("draft_ready", {
              threadId,
              totalDays: updatedState.values?.totalDays,
              destination: updatedState.values?.destination,
              draft: revisedDraft,
            });

            controller.close();
          } catch (streamError: any) {
            console.error("[plan-trip resume SSE error]:", streamError);
            sendEvent("error", {
              error: streamError?.message || "Failed to revise itinerary",
            });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
        },
      });
    }

    // Default JSON response for non-streaming clients
    await tripPlannerGraph.invoke(null, threadConfig);

    const updatedState = await tripPlannerGraph.getState(threadConfig);

    return NextResponse.json({
      success: true,
      threadId,
      totalDays: updatedState.values?.totalDays,
      destination: updatedState.values?.destination,
      draftItinerary: updatedState.values?.draftItinerary,
    });
  } catch (error: any) {
    console.error("[plan-trip resume error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
