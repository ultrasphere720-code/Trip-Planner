/**
 * Tavily Search Tools & Travel Research Interfaces
 * Provides destination-grounded search helpers and verified itinerary types.
 */

export interface ItineraryActivity {
  id: string;
  time: string; // e.g. "09:30 AM", "01:30 PM", "07:00 PM"
  category: "SIGHT & CULTURE" | "DINING & CUISINE" | "LOCAL TRANSIT" | "ACCOMMODATION" | "ENTERTAINMENT";
  title: string; // Real venue/place, e.g. "teamLab Planets Immersive Digital Art Museum"
  location: string; // Neighborhood, e.g. "Toyosu District", "Gion Quarter"
  description: string; // 1-2 sentence real-world description of what to do
  estimatedCost?: number; // Realistic price in target currency
  estimatedCostUSD: number; // Realistic price (e.g. $15, $38, $65)
  imageUrl?: string; // Curated or resolved photo URL
}

export interface ItineraryDay {
  dayNumber: number;
  title: string; // e.g. "Arrival in Tokyo & Historic Asakusa", "Digital Art & Waterfront Odaiba"
  date: string; // Formatted date e.g. "Oct 10, 2026"
  estimatedTotal?: number; // Total sum of activity costs for this day
  estimatedTotalUSD: number;
  activities: ItineraryActivity[];
}

export interface TripPlanResponse {
  destination: string;
  dateRangeText: string;
  preferencesSummary: string;
  totalBudgetUSD: number;
  status: "FINALIZED" | "DRAFT";
  days: ItineraryDay[];
}

interface TavilySearchResultItem {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilySearchResponse {
  answer?: string;
  query: string;
  results: TavilySearchResultItem[];
}

/**
 * Low-level Tavily search caller
 */
export async function executeTavilySearch(query: string, maxResults: number = 5): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn("[Tavily] TAVILY_API_KEY is not set in environment.");
    return "";
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        include_answer: true,
        max_results: maxResults,
      }),
    });

    if (!response.ok) {
      console.warn(`[Tavily] Search API returned status ${response.status}: ${response.statusText}`);
      return "";
    }

    const data: TavilySearchResponse = await response.json();

    let output = "";
    if (data.answer) {
      output += `Summary: ${data.answer}\n\n`;
    }

    if (data.results && data.results.length > 0) {
      output += "Search Results:\n";
      for (const item of data.results) {
        output += `- ${item.title}: ${item.content} (Source: ${item.url})\n`;
      }
    }

    return output.trim();
  } catch (error) {
    console.error("[Tavily] Search error:", error);
    return "";
  }
}

/**
 * Search hotels strictly interpolated with target destination and budget
 */
export async function searchHotels(destination: string, budget: number): Promise<string> {
  const query = `${destination} top rated boutique hotels accommodations specific neighborhood district price per night budget ${budget}`;
  return executeTavilySearch(query, 5);
}

/**
 * Search flights strictly interpolated with origin and destination
 */
export async function searchFlights(origin: string, destination: string): Promise<string> {
  const query = `flights routes transportation from ${origin} to ${destination} airlines airport transfer options prices`;
  return executeTavilySearch(query, 5);
}

/**
 * Search restaurants strictly interpolated with target destination and preferences
 */
export async function searchRestaurants(destination: string, preferences: string): Promise<string> {
  const query = `${destination} authentic restaurants authentic local regional cuisine signature traditional dishes food spots exact venue names neighborhoods ${preferences}`;
  return executeTavilySearch(query, 6);
}

/**
 * Search attractions strictly interpolated with target destination and totalDays
 */
export async function searchAttractions(destination: string, totalDays: number): Promise<string> {
  const query = `${destination} top verified historical sights attractions landmarks monuments exact venue names district neighborhood admission ticket price opening hours ${totalDays} day`;
  return executeTavilySearch(query, 6);
}
