import { OVERPASS_URL, OVERPASS_TIMEOUT_MS, MAX_RESULTS } from "../config.js";
import { classifyToilet } from "./classification.js";
import { haversineDistance } from "../utils/distance.js";

function buildQuery(lat, lng, radius) {
  return `
  [out:json][timeout:${Math.round(OVERPASS_TIMEOUT_MS / 1000)}];
  (
    nwr["amenity"="toilets"](around:${radius},${lat},${lng});
    nwr["toilets"](around:${radius},${lat},${lng});
  );
  out center tags ${MAX_RESULTS};
  `;
}

function parseElement(element, origin) {
  const { tags = {}, id, type } = element;
  const coords = element.lat && element.lon
    ? { lat: element.lat, lng: element.lon }
    : element.center
    ? { lat: element.center.lat, lng: element.center.lon }
    : null;

  if (!coords) return null;

  const { category, secondaryBadges, reasons } = classifyToilet(tags);

  return {
    id: `${type}/${id}`,
    name: tags.name || "Baño sin nombre",
    lat: coords.lat,
    lng: coords.lng,
    address: tags["addr:full"] || tags["addr:street"] || tags["addr:place"] || null,
    tags_raw: tags,
    category,
    secondaryBadges,
    reasons,
    distance_m: haversineDistance(origin, coords),
    fee: tags.fee || tags["toilets:fee"] || null,
    wheelchair: tags.wheelchair || tags["toilets:wheelchair"] || null,
    opening_hours: tags.opening_hours || null,
  };
}

export async function fetchToilets(lat, lng, radius) {
  const query = buildQuery(lat, lng, radius);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      body: query,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!response.ok) {
      throw new Error(`Overpass respondió ${response.status}`);
    }

    const data = await response.json();
    const origin = { lat, lng };
    const normalized = (data.elements || [])
      .map((el) => parseElement(el, origin))
      .filter(Boolean)
      .sort((a, b) => a.distance_m - b.distance_m)
      .slice(0, MAX_RESULTS);

    return normalized;
  } finally {
    clearTimeout(timeout);
  }
}
