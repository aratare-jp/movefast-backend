import express, { Request, RequestHandler, Response } from "express";
import { generateDates, redeem, toStringWithoutMillis } from "./dateService";
import { IDateEntry, RuntimeError } from "./types";

export const app: express.Application = express();

/**
 * Convert the given date entry's properties to date strings acceptable by the response.
 */
const convert = (d: IDateEntry) => ({
  availableAt: toStringWithoutMillis(d.availableAt),
  redeemedAt: d.redeemedAt ? toStringWithoutMillis(d.redeemedAt) : null,
  expiresAt: toStringWithoutMillis(d.expiresAt),
});

/**
 * Simple function to prepare the response's body with the given date entry.
 */
const prepResponse = (data: IDateEntry | IDateEntry[]): { data: object } => {
  if (Array.isArray(data)) {
    return { data: data.map((d) => convert(d)) };
  } else {
    return { data: convert(data) };
  }
};

app.get("/users/:id/rewards", (req, res) => {
  const id = req.params?.id;
  const date = req.query?.at as string;

  if (!date) {
    const err = new Error("Date is required.") as RuntimeError;
    err.errorType = "INVALID_ARGUMENT";
    throw err;
  }

  console.log(`Generating data for user ${id} at ${date}`);

  res.json(prepResponse(generateDates(id, date)));
});

app.patch("/users/:id/rewards/:date/redeem", (req, res) => {
  const id = req.params?.id;
  const date = req.params?.date;

  if (!date) {
    const err = new Error("Date is required.") as RuntimeError;
    err.errorType = "INVALID_ARGUMENT";
    throw err;
  }

  console.log(`Updating data for user ${id} at ${date}`);

  // Move to the next middleware for response formatting.
  res.json(prepResponse(redeem(id, date)));
});

// Global error handler.
app.use((err: Error, req: Request, res: Response, next: RequestHandler) => {
  const error = err as RuntimeError;
  if (!error.errorType || error.errorType === "INTERNAL_ERROR") {
    console.error(error.stack);
    res.status(500);
  } else if (error.errorType === "INVALID_STATE") {
    res.status(409);
  } else {
    res.status(400);
  }
  res.json({ error: { message: error.message } });
});
