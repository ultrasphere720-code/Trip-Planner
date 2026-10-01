import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { tripPlannerGraph } from "@/lib/agent/tripPlannerGraph";
import { BASE_DAILY_PER_PERSON, MIN_DAILY_BUDGET, CURRENCY_SYMBOLS, getCurrencyCode } from "@/lib/currency";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, startDate, endDate, budget, currency, preferences, travelers } = body;

    // Validate destination
    if (!destination || typeof destination !== "string" || destination.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid destination is required." },
        { status: 400 }
      );
    }

    // Validate dates
    if (
      !startDate ||
      !endDate ||
      isNaN(new Date(startDate).getTime()) ||
      isNaN(new Date(endDate).getTime())
    ) {
      return NextResponse.json(
        { error: "Valid startDate and endDate are required." },
        { status: 400 }
      );
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (end < start) {
      return NextResponse.json(
        { error: "endDate must be equal to or after startDate." },
        { status: 400 }
      );
    }

    // Explicit totalDays calculation
    const totalDays = Math.max(
      1,
      Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
    );

    // Validate travelers count (1 - 10)
    const numTravelers = Math.max(1, Math.min(10, Number(travelers) || 1));

    // Validate realistic minimum budget dynamically scaled by travelers and duration
    const currencyCode = getCurrencyCode(currency || "$");
    const baseDaily = BASE_DAILY_PER_PERSON[currencyCode] || MIN_DAILY_BUDGET[currencyCode] || 75;
    const minTotalBudget = baseDaily * totalDays * numTravelers;
    const numericBudget = Number(budget) || 0;

    if (numericBudget < minTotalBudget) {
      const symbol = CURRENCY_SYMBOLS[currencyCode] || "$";
      return NextResponse.json(
        {
          error: `Budget of ${symbol}${numericBudget.toLocaleString()} is unrealistically low for ${numTravelers} ${numTravelers === 1 ? "traveler" : "travelers"} on a ${totalDays}-day trip. The minimum realistic threshold is ${symbol}${minTotalBudget.toLocaleString()} (${symbol}${baseDaily.toLocaleString()}/day/person).`,
        },
        { status: 400 }
      );
    }

    const threadId = uuidv4();
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
            agent: "supervisorAgent",
            status: `Planning ${totalDays}-day travel itinerary for ${numTravelers} ${numTravelers === 1 ? "traveler" : "travelers"} in ${destination.trim()}...`,
          });

          const threadConfig = {
            configurable: {
              thread_id: threadId,
            },
            streamMode: "updates" as const,
          };

          const inputState = {
            origin: origin || "Origin City",
            destination: destination.trim(),
            startDate,
            endDate,
            totalDays,
            travelers: numTravelers,
            budget: Number(budget) || 2500,
            currency: currency || "$",
            preferences: preferences || "Cultural experiences, sightseeing, local culinary specialties",
          };

          const eventStream = await tripPlannerGraph.stream(inputState, threadConfig);

          for await (const chunk of eventStream) {
            if ("hotelAgent" in chunk) {
              sendEvent("update", {
                agent: "hotelAgent",
                status: `Searching verified hotels and accommodations in ${destination.trim()}...`,
              });
            }
            if ("flightAgent" in chunk) {
              sendEvent("update", {
                agent: "flightAgent",
                status: `Finding transportation and flight options for ${destination.trim()}...`,
              });
            }
            if ("restaurantAgent" in chunk) {
              sendEvent("update", {
                agent: "restaurantAgent",
                status: `Curating local restaurants and culinary highlights in ${destination.trim()}...`,
              });
            }
            if ("attractionAgent" in chunk) {
              sendEvent("update", {
                agent: "attractionAgent",
                status: `Gathering top sights, attractions, and cultural experiences in ${destination.trim()}...`,
              });
            }
            if ("draftAgent" in chunk) {
              sendEvent("update", {
                agent: "draftAgent",
                status: `Generating structured ${totalDays}-day itinerary for ${destination.trim()}...`,
              });
            }
            if ("validateDraft" in chunk) {
              sendEvent("update", {
                agent: "draftAgent",
                status: `Validating multi-day diversity & landmark coverage for ${destination.trim()}...`,
              });
            }
          }

          // Fetch state at interrupt point (humanReview)
          const finalState = await tripPlannerGraph.getState({
            configurable: { thread_id: threadId },
          });

          const draft = finalState.values?.draftItinerary;

          sendEvent("draft_ready", {
            threadId,
            totalDays,
            destination: destination.trim(),
            draft,
          });

          controller.close();
        } catch (streamError: any) {
          console.error("[plan-trip API stream error]:", streamError);
          sendEvent("error", {
            error: streamError?.message || "Failed to generate travel itinerary",
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
  } catch (error: any) {
    console.error("[plan-trip API error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
