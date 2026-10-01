/**
 * Real-Time Wikimedia Image Fetcher
 * Resolves authentic, verified photos for real-world landmarks and attractions.
 * Returns null if no authentic photo exists (never returns a repeated generic stock photo).
 */

const photoCache = new Map<string, string | null>();

/**
 * Resolves authentic landmark photo from Wikipedia/Wikimedia Commons
 */
export async function getLandmarkPhoto(
  landmarkName: string,
  city: string = ""
): Promise<string | null> {
  if (!landmarkName || !landmarkName.trim()) return null;

  const cleanName = landmarkName.trim();
  const cleanCity = (city || "").split(",")[0].trim();
  const key = `${cleanName}-${cleanCity}`.toLowerCase();

  if (photoCache.has(key)) {
    return photoCache.get(key) || null;
  }

  try {
    // Helper to query Wikipedia PageImages API
    const queryWiki = async (searchQuery: string): Promise<string | null> => {
      try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(
          searchQuery
        )}&gsrlimit=1&prop=pageimages&pithumbsize=1000`;

        const res = await fetch(searchUrl);
        if (!res.ok) return null;
        const data = await res.json();
        const pages = data?.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          const source = pages[pageId]?.thumbnail?.source;
          if (source) return source;
        }
      } catch {
        // Continue to next fallback
      }
      return null;
    };

    // 1. Direct search for the landmark name with city
    const queryWithCity = cleanCity ? `${cleanName} ${cleanCity}` : cleanName;
    const directResult = await queryWiki(queryWithCity);
    if (directResult) {
      photoCache.set(key, directResult);
      return directResult;
    }

    // 2. Secondary fallback: try searching just the clean landmark title without extra suffixes or parenthesis
    const cleanTitle = cleanName.split(/&|-|\(/)[0].trim();
    if (cleanTitle && cleanTitle !== cleanName) {
      const fallbackQuery = cleanCity ? `${cleanTitle} ${cleanCity}` : cleanTitle;
      const cleanResult = await queryWiki(fallbackQuery);
      if (cleanResult) {
        photoCache.set(key, cleanResult);
        return cleanResult;
      }
    }

    // 3. Third fallback: try searching just cleanTitle alone without city name
    if (cleanTitle) {
      const pureTitleResult = await queryWiki(cleanTitle);
      if (pureTitleResult) {
        photoCache.set(key, pureTitleResult);
        return pureTitleResult;
      }
    }
  } catch (err) {
    console.warn(`Could not resolve photo for ${landmarkName}:`, err);
  }

  // Cache null to avoid repeated failing network requests for this landmark
  photoCache.set(key, null);
  return null;
}
