import {
  clearCache,
  toStringWithoutMillis,
  generateDates,
  getWeekStart,
  redeem,
} from "../src/dateService";
import { RuntimeError } from "../src/types.d";

describe("getWeekStart function", () => {
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(jest.fn());
    jest.spyOn(console, "debug").mockImplementation(jest.fn());
    jest.spyOn(console, "error").mockImplementation(jest.fn());
  });

  it("should work with normal date", () => {
    expect(getWeekStart(new Date("2021-11-30T10:10:10Z")).toISOString()).toBe(
      "2021-11-28T00:00:00.000Z"
    );
  });

  it("should work with precise midnight of week start", () => {
    expect(getWeekStart(new Date("2021-11-28T00:00:00Z")).toISOString()).toBe(
      "2021-11-28T00:00:00.000Z"
    );
  });

  it("should work with precise moment right before midnight of weekend", () => {
    expect(getWeekStart(new Date("2021-12-04T23:59:59Z")).toISOString()).toBe(
      "2021-11-28T00:00:00.000Z"
    );
  });

  it("should fail when given invalid date", (done) => {
    try {
      getWeekStart(new Date("foobar"));
      done.fail();
    } catch (e) {
      const err = e as RuntimeError;
      expect(err.message).toBe("Given date must have valid format.");
      expect(err.errorType).toBe("INVALID_ARGUMENT");
      done();
    }
  });
});

describe("toStringWithoutMillis function", () => {
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(jest.fn());
    jest.spyOn(console, "debug").mockImplementation(jest.fn());
    jest.spyOn(console, "error").mockImplementation(jest.fn());
  });

  it("should remove the millisecond portion correctly", () => {
    expect(toStringWithoutMillis(new Date("2020-02-02T10:10:10.123Z"))).toBe(
      "2020-02-02T10:10:10Z"
    );
  });

  it("should succeed even when there is no millisecond portion", () => {
    expect(toStringWithoutMillis(new Date("2020-02-02T10:10:10Z"))).toBe(
      "2020-02-02T10:10:10Z"
    );
  });

  it("should fail when given invalid date", (done) => {
    try {
      toStringWithoutMillis(new Date("foobar"));
      done.fail();
    } catch (e) {
      const err = e as RuntimeError;
      expect(err.message).toBe("Given date must have valid format.");
      expect(err.errorType).toBe("INVALID_ARGUMENT");
      done();
    }
  });
});

describe("generateDates function", () => {
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(jest.fn());
    jest.spyOn(console, "debug").mockImplementation(jest.fn());
    jest.spyOn(console, "error").mockImplementation(jest.fn());
  });

  afterEach(() => clearCache());

  const expectedWeek = [
    {
      availableAt: "2021-11-28T00:00:00Z",
      redeemedAt: null,
      expiresAt: "2021-11-29T00:00:00Z",
    },
    {
      availableAt: "2021-11-29T00:00:00Z",
      redeemedAt: null,
      expiresAt: "2021-11-30T00:00:00Z",
    },
    {
      availableAt: "2021-11-30T00:00:00Z",
      redeemedAt: null,
      expiresAt: "2021-12-01T00:00:00Z",
    },
    {
      availableAt: "2021-12-01T00:00:00Z",
      redeemedAt: null,
      expiresAt: "2021-12-02T00:00:00Z",
    },
    {
      availableAt: "2021-12-02T00:00:00Z",
      redeemedAt: null,
      expiresAt: "2021-12-03T00:00:00Z",
    },
    {
      availableAt: "2021-12-03T00:00:00Z",
      redeemedAt: null,
      expiresAt: "2021-12-04T00:00:00Z",
    },
    {
      availableAt: "2021-12-04T00:00:00Z",
      redeemedAt: null,
      expiresAt: "2021-12-05T00:00:00Z",
    },
  ].map((e) => ({
    availableAt: new Date(e.availableAt),
    redeemedAt: null,
    expiresAt: new Date(e.expiresAt),
  }));

  it("should return a normal week", () => {
    expect(generateDates("1", "2021-11-30T10:10:10Z")).toStrictEqual(
      expectedWeek
    );
  });

  it("should return a normal week when given the precise midnight of week start", () => {
    expect(generateDates("1", "2021-11-28T00:00:00Z")).toStrictEqual(
      expectedWeek
    );
  });

  it("should return a normal week when given the precise moment before midnight of week end", () => {
    expect(generateDates("1", "2021-12-04T23:59:59Z")).toStrictEqual(
      expectedWeek
    );
  });

  it("should fail when given invalid date", (done) => {
    try {
      generateDates("1", "foobar");
      done.fail();
    } catch (e) {
      const err = e as RuntimeError;
      expect(err.message).toBe("Given date must have valid format.");
      expect(err.errorType).toBe("INVALID_ARGUMENT");
      done();
    }
  });

  it("should return the same weekly rewards when called multiple times with the same date", () => {
    const firstTime = generateDates("1", "2021-11-30T10:10:10Z");
    const secondTime = generateDates("1", "2021-11-30T10:10:10Z");
    for (let i = 0; i < firstTime.length; ++i) {
      expect(firstTime[i] === secondTime[i]).toBeTruthy();
    }
  });

  it("should return the same weekly rewards when called multiple times with the different date in the same week", () => {
    const firstTime = generateDates("1", "2021-11-30T10:10:10Z");
    const secondTime = generateDates("1", "2021-12-01T10:10:10Z");
    for (let i = 0; i < firstTime.length; ++i) {
      expect(firstTime[i] === secondTime[i]).toBeTruthy();
    }
  });

  it("should return different weekly rewards when called with different dates from different weeks", () => {
    const firstTime = generateDates("1", "2021-11-30T10:10:10Z");
    const secondTime = generateDates("1", "2021-12-30T10:10:10Z");
    for (let i = 0; i < firstTime.length; ++i) {
      expect(firstTime[i] === secondTime[i]).toBeFalsy();
    }
  });

  it("should return different weekly rewards when called with the same dates and different IDs", () => {
    const firstTime = generateDates("1", "2021-11-30T10:10:10Z");
    const secondTime = generateDates("2", "2021-11-30T10:10:10Z");
    for (let i = 0; i < firstTime.length; ++i) {
      expect(firstTime[i] === secondTime[i]).toBeFalsy();
    }
  });
});

describe("redeem function", () => {
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(jest.fn());
    jest.spyOn(console, "debug").mockImplementation(jest.fn());
    jest.spyOn(console, "error").mockImplementation(jest.fn());
  });

  afterEach(() => clearCache());

  it("should work when redeeming a reward that has been generated", () => {
    // Here I use current date because using past dates will trigger an expiration error whereas
    // using future dates will also trigger error because we can't redeem a future reward.
    const today = new Date(Date.now());
    const tmr = new Date(today);
    tmr.setUTCDate(tmr.getUTCDate() + 1);

    // Need to generate rewards so we can redeem them.
    generateDates("1", today.toISOString());

    const result = redeem("1", today.toISOString());
    expect(result).toBeTruthy();
    expect(result.availableAt).toStrictEqual(
      new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate()
        )
      )
    );
    expect(result.expiresAt).toStrictEqual(
      new Date(
        Date.UTC(tmr.getUTCFullYear(), tmr.getUTCMonth(), tmr.getUTCDate())
      )
    );
    expect(result.redeemedAt).toBeTruthy();
    const redeemedAt = result.redeemedAt!;
    expect(redeemedAt.getUTCDate()).toBe(today.getUTCDate());
    expect(redeemedAt.getUTCMonth()).toBe(today.getUTCMonth());
    expect(redeemedAt.getUTCFullYear()).toBe(today.getUTCFullYear());
    expect(redeemedAt.getUTCHours()).toBe(today.getUTCHours());
    expect(redeemedAt.getUTCMinutes()).toBe(today.getUTCMinutes());
  });

  it("should fail when given an invalid date", (done) => {
    try {
      redeem("1", "foobar");
      done.fail();
    } catch (e) {
      const err = e as RuntimeError;
      expect(err.message).toBe("Given date must have valid format.");
      expect(err.errorType).toBe("INVALID_ARGUMENT");
      done();
    }
  });

  it("should fail when redeeming a reward that has not been generated", (done) => {
    try {
      redeem("1", "2021-11-30T10:10:10Z");
      done.fail();
    } catch (e) {
      const err = e as RuntimeError;
      expect(err.message).toBe("This reward is not available.");
      expect(err.errorType).toBe("INVALID_ARGUMENT");
      done();
    }
  });

  it("should fail when redeeming a future reward", (done) => {
    try {
      const future = new Date(Date.now());
      future.setUTCHours(future.getUTCHours() + 3);
      generateDates("1", future.toISOString());
      redeem("1", future.toISOString());
      done.fail();
    } catch (e) {
      const err = e as RuntimeError;
      expect(err.message).toBe("This reward is not yet available.");
      expect(err.errorType).toBe("INVALID_ARGUMENT");
      done();
    }
  });

  it("should fail when redeeming the same reward multiple times", (done) => {
    try {
      const today = new Date(Date.now());
      generateDates("1", today.toISOString());
      redeem("1", today.toISOString());
      redeem("1", today.toISOString());
      done.fail();
    } catch (e) {
      const err = e as RuntimeError;
      expect(err.message).toBe("This reward has already been redeemed.");
      expect(err.errorType).toBe("INVALID_STATE");
      done();
    }
  });

  it("should fail when redeeming a reward that has already expired", (done) => {
    try {
      const date = new Date(Date.now());
      const past = new Date(date);
      past.setUTCDate(past.getUTCDate() - 1);
      generateDates("1", date.toISOString());
      generateDates("1", past.toISOString());
      redeem("1", past.toISOString());
      done.fail();
    } catch (e) {
      const err = e as RuntimeError;
      expect(err.message).toBe("This reward is already expired");
      expect(err.errorType).toBe("INVALID_ARGUMENT");
      done();
    }
  });
});
