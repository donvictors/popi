import express from "express";
import { DEFAULT_RADIUS, MAX_RADIUS } from "../config.js";
import { fetchToilets } from "../services/overpass.js";
import { memoryCache } from "../cache/memoryCache.js";

const router = express.Router();

function validateCoords(lat, lng) {
  return !isNaN(lat) && !isNaN(lng);
}

router.get("/", async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  let radius = parseInt(req.query.radius, 10) || DEFAULT_RADIUS;
  if (radius > MAX_RADIUS) radius = MAX_RADIUS;

  if (!validateCoords(lat, lng)) {
    return res.status(400).json({ error: "lat y lng son obligatorios" });
  }

  const cacheKey = `${lat},${lng},${radius}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return res.json({ source: "cache", items: cached });
  }

  try {
    const items = await fetchToilets(lat, lng, radius);
    memoryCache.set(cacheKey, items);
    res.json({ source: "overpass", items });
  } catch (error) {
    console.error("Error en /toilets", error);
    res.status(500).json({ error: "No se pudo obtener baños", detail: error.message });
  }
});

export default router;
