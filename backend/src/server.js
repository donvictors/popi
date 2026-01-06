import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import toiletsRouter from "./routes/toilets.js";
import reportsRouter from "./routes/reports.js";
import { PORT } from "./config.js";

const app = express();

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 60 });

app.use(cors());
app.use(express.json());
app.use(limiter);

app.get("/health", (_, res) => res.json({ ok: true }));
app.use("/toilets", toiletsRouter);
app.use("/reports", reportsRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Popi backend escuchando en puerto ${PORT}`);
  });
}

export default app;
