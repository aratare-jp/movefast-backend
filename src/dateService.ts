import { IDateEntry, RuntimeError } from "./types.d";

// Here we cache by the beginning date of the week. So that if multiple requests are within a week
// we don't have to generate the entire week all over again. Note that typically persistent states
// should be put into a class with appropriate methods to interact with the internal storage to
// avoid naughty modifications. Here I'm just using a simple object to cache things.
let cache: { [id: string]: { [weekStart: string]: IDateEntry[] } } = {};

// This is mainly used for testing to make sure there is no state contamination.
export const clearCache = () => {
  cache = {};
};

/**
 * Given a date, calculate and return the date of the beginning of the week that the date belongs
 * in. For example, let's say we have we the following week (from Sunday): [ 1 2 3 4 5 6 7], then
 * calling this function with any date within such week will return [ 1 ] since that's the beginning
 * of the week.
 *
 * Note that this function does not modify the date.
 */
export const getWeekStart = (d: Date): Date => {
  if (d.toString().includes("Invalid")) {
    const err = new Error("Given date must have valid format.") as RuntimeError;
    err.errorType = "INVALID_ARGUMENT";
    throw err;
  }

  const weekStart = new Date(d);
  // date.getUTCDate() returns the date of current month
  // date.getUTCDay() returns the day of current week
  // date.getUTCDate() - date.getUTCDay() returns the date of the beginning of the current week
  // (which can be negative)
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

  return new Date(
    Date.UTC(
      weekStart.getUTCFullYear(),
      weekStart.getUTCMonth(),
      weekStart.getUTCDate()
    )
  );
};

/**
 * Function used to trim out the millis part to comform with the problem statement. This function is mostly used for
 * date formating before returning the response.
 */
export const toStringWithoutMillis = (d: Date): string => {
  if (d.toString().includes("Invalid")) {
    const err = new Error("Given date must have valid format.") as RuntimeError;
    err.errorType = "INVALID_ARGUMENT";
    throw err;
  }

  return d.toISOString().replace(/.\d+Z$/g, "Z");
};

/**
 * Given an ID and date, generate and cache the weekly rewards against the ID. Multiple calls with
 * the same ID and a given date within an already generated week will return the same week.
 *
 * This function will throw if:
 * - wrong date format
 */
export const generateDates = (id: string, dateStr: string): IDateEntry[] => {
  const date = new Date(dateStr);

  if (date.toString().includes("Invalid")) {
    console.error(
      `User ${id} is trying to generate weekly rewards with the wrong date format ${dateStr}`
    );
    const err = new Error("Given date must have valid format.") as RuntimeError;
    err.errorType = "INVALID_ARGUMENT";
    throw err;
  }

  // First calculate the week start since that's our key in the cache.
  const weekStart = getWeekStart(date);
  const weekStartStr = toStringWithoutMillis(weekStart);

  // If we've already generated such week, return the cached results.
  if (cache[id] && cache[id][weekStartStr]) {
    console.log("Cache found. Returning cached results.");
    return cache[id][weekStartStr];
  }

  console.log(
    `Cache not found for ${weekStart.toISOString()}. Generating new dates...`
  );

  // Calculate all the dates within the week.
  const dates: Date[] = [weekStart];
  for (let i = 1; i < 7; ++i) {
    const weekDay = new Date(weekStart);
    weekDay.setUTCDate(weekDay.getUTCDate() + i);
    dates.push(weekDay);
  }

  // Now that we have an array of dates ranging from the week start to week end, we can now morph
  // it into the desired form...
  const dateEntries = dates.reduce<IDateEntry[]>((acc, d) => {
    const expirationDate = new Date(d);
    expirationDate.setUTCDate(expirationDate.getUTCDate() + 1);
    acc.push({
      availableAt: d,
      redeemedAt: null,
      expiresAt: expirationDate,
    });
    return acc;
  }, []);

  // ... and put it into the cache
  cache[id] = {};
  cache[id][weekStartStr] = dateEntries;

  return dateEntries;
};

/**
 * Handle reward redeeming. This function will throw error if:
 * - wrong date format
 * - the target date has not been generated for the user with ID, or
 * - the reward at target date has expired, or
 * - the target date is in the future, or
 * - the target date has been redeemed previously.
 */
export const redeem = (id: string, dateStr: string): IDateEntry => {
  const targetDate = new Date(dateStr);

  if (targetDate.toString().includes("Invalid")) {
    console.error(
      `User ${id} is trying to generate weekly rewards with the wrong date format ${dateStr}`
    );
    const err = new Error("Given date must have valid format.") as RuntimeError;
    err.errorType = "INVALID_ARGUMENT";
    throw err;
  }

  // First calculate the week start since that's our key in the cache.
  const weekStart = getWeekStart(targetDate);
  const weekStartStr = toStringWithoutMillis(weekStart);

  // If there is no such reward at target date to redeem, throw error.
  if (!cache[id] || !cache[id][weekStartStr]) {
    console.error(
      `Reward for user ${id} at target date ${targetDate.toISOString()} cannot be found.`
    );
    const err = new Error("This reward is not available.") as RuntimeError;
    err.errorType = "INVALID_ARGUMENT";
    throw err;
  }

  const dateEntries = cache[id][weekStartStr];
  const dateEntry = dateEntries.find(
    (e) => e.availableAt.getUTCDate() === targetDate.getUTCDate()
  );

  if (!dateEntry) {
    console.error(
      `Unable to retrieve the date entry from target date ${targetDate.toISOString()}. Something is very wrong here...`
    );
    const err = new Error("Unable to retrieve date entry.") as RuntimeError;
    err.errorType = "INTERNAL_ERROR";
    throw err;
  }

  // If reward has already been redeemed, throw error.
  if (dateEntry.redeemedAt) {
    console.error(
      `User ${id} is trying to redeem an already redeemed reward at ${targetDate.toISOString()}.`
    );
    const err = new Error(
      "This reward has already been redeemed."
    ) as RuntimeError;
    err.errorType = "INVALID_STATE";
    throw err;
  }

  const now = new Date(Date.now());

  // If reward is in the future, throw error.
  if (targetDate > now) {
    console.error(
      `User ${id} is trying to redeem a reward at future date ${targetDate.toISOString()}.`
    );
    const err = new Error("This reward is not yet available.") as RuntimeError;
    err.errorType = "INVALID_ARGUMENT";
    throw err;
  }

  // If reward has already expired, throw error.
  if (dateEntry.expiresAt < now) {
    console.error(
      `User ${id} is trying to redeem an expired reward at ${targetDate.toISOString()}.`
    );
    const err = new Error("This reward is already expired") as RuntimeError;
    err.errorType = "INVALID_ARGUMENT";
    throw err;
  }

  // Mark the entry as redeemed.
  dateEntry.redeemedAt = now;

  return dateEntry;
};
