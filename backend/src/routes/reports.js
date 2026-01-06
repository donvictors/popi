import express from "express";
import { saveReport, fetchLatestReport, fetchReports } from "../db/index.js";

const router = express.Router();
const VALID_STATUSES = ["LIMPIO", "SUCIO", "CERRADO"];

router.post("/", (req, res) => {
  const { toilet_id, lat, lng, status, comment } = req.body;
  if (!toilet_id || isNaN(lat) || isNaN(lng) || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: "Payload inválido",
      expected: { toilet_id: "string", lat: "number", lng: "number", status: VALID_STATUSES },
    });
  }

  const result = saveReport({ toilet_id, lat, lng, status, comment });
  res.status(201).json({ id: result.id });
});

router.get("/", (req, res) => {
  const { toilet_id, limit } = req.query;
  if (!toilet_id) {
    return res.status(400).json({ error: "toilet_id requerido" });
  }
  const parsedLimit = parseInt(limit, 10) || 1;
  const reports = parsedLimit === 1
    ? fetchLatestReport(toilet_id)
    : fetchReports(toilet_id, parsedLimit);
  res.json(reports || null);
});

export default router;
