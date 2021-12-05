import request from "supertest";
import { app } from "../src/app";
import { clearCache, toStringWithoutMillis } from "../src/dateService";
import { IDateEntry } from "./types";

describe("generate rewards endpoint", () => {
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(jest.fn());
    jest.spyOn(console, "debug").mockImplementation(jest.fn());
    jest.spyOn(console, "error").mockImplementation(jest.fn());
  });

  afterEach(() => clearCache());

  const expectedWeek = {
    data: [
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
    ],
  };

  it("should work with a normal date", async () => {
    expect.assertions(2);
    const result = await request(app).get(
      "/users/1/rewards?at=2021-11-30T10:10:10Z"
    );
    expect(result.statusCode).toBe(200);
    expect(result.body).toStrictEqual(expectedWeek);
  });

  it("should work with precise week start", async () => {
    expect.assertions(2);
    const result = await request(app).get(
      "/users/1/rewards?at=2021-11-28T00:00:00Z"
    );
    expect(result.statusCode).toBe(200);
    expect(result.body).toStrictEqual(expectedWeek);
  });

  it("should work with precise moment before midnight", async () => {
    expect.assertions(2);
    const result = await request(app).get(
      "/users/1/rewards?at=2021-12-04T23:59:59Z"
    );
    expect(result.statusCode).toBe(200);
    expect(result.body).toStrictEqual(expectedWeek);
  });

  it("should return the same response when called with the same date multiple times", async () => {
    expect.assertions(23);
    const first = await request(app).get(
      "/users/1/rewards?at=2021-11-30T10:10:10Z"
    );
    expect(first.statusCode).toBe(200);
    const second = await request(app).get(
      "/users/1/rewards?at=2021-11-30T10:10:10Z"
    );
    expect(second.statusCode).toBe(200);
    for (let i = 0; i < 7; ++i) {
      const e1 = first.body?.data[i] as IDateEntry;
      const e2 = second.body?.data[i] as IDateEntry;
      expect(e1).toBeTruthy();
      expect(e2).toBeTruthy();
      expect(
        e1.availableAt === e2.availableAt &&
          e1.redeemedAt === e2.redeemedAt &&
          e1.expiresAt === e2.expiresAt
      ).toBeTruthy();
    }
  });

  it("should return the same response when called with multiple dates in the same week", async () => {
    expect.assertions(23);
    const first = await request(app).get(
      "/users/1/rewards?at=2021-11-30T10:10:10Z"
    );
    expect(first.statusCode).toBe(200);
    const second = await request(app).get(
      "/users/1/rewards?at=2021-11-29T10:10:10Z"
    );
    expect(second.statusCode).toBe(200);
    for (let i = 0; i < 7; ++i) {
      const e1 = first.body?.data[i] as IDateEntry;
      const e2 = second.body?.data[i] as IDateEntry;
      expect(e1).toBeTruthy();
      expect(e2).toBeTruthy();
      expect(
        e1.availableAt === e2.availableAt &&
          e1.redeemedAt === e2.redeemedAt &&
          e1.expiresAt === e2.expiresAt
      ).toBeTruthy();
    }
  });

  it("should return different response when called with different dates in different weeks", async () => {
    expect.assertions(23);
    const first = await request(app).get(
      "/users/1/rewards?at=2021-11-30T10:10:10Z"
    );
    expect(first.statusCode).toBe(200);
    const second = await request(app).get(
      "/users/1/rewards?at=2021-12-30T10:10:10Z"
    );
    expect(second.statusCode).toBe(200);
    for (let i = 0; i < 7; ++i) {
      const e1 = first.body?.data[i] as IDateEntry;
      const e2 = second.body?.data[i] as IDateEntry;
      expect(e1).toBeTruthy();
      expect(e2).toBeTruthy();
      expect(
        e1.availableAt === e2.availableAt &&
          e1.redeemedAt === e2.redeemedAt &&
          e1.expiresAt === e2.expiresAt
      ).toBeFalsy();
    }
  });

  it("should return similar rewards when called with same date but with multiple IDs", async () => {
    expect.assertions(23);
    const first = await request(app).get(
      "/users/1/rewards?at=2021-11-30T10:10:10Z"
    );
    expect(first.statusCode).toBe(200);
    const second = await request(app).get(
      "/users/2/rewards?at=2021-11-30T10:10:10Z"
    );
    expect(second.statusCode).toBe(200);
    for (let i = 0; i < 7; ++i) {
      const e1 = first.body?.data[i] as IDateEntry;
      const e2 = second.body?.data[i] as IDateEntry;
      expect(e1).toBeTruthy();
      expect(e2).toBeTruthy();
      expect(
        e1.availableAt === e2.availableAt &&
          e1.redeemedAt === e2.redeemedAt &&
          e1.expiresAt === e2.expiresAt
      ).toBeTruthy();
    }
  });

  it("should return different rewards when called with different dates and IDs", async () => {
    expect.assertions(23);
    const first = await request(app).get(
      "/users/1/rewards?at=2021-11-30T10:10:10Z"
    );
    expect(first.statusCode).toBe(200);
    const second = await request(app).get(
      "/users/2/rewards?at=2021-12-30T10:10:10Z"
    );
    expect(second.statusCode).toBe(200);
    for (let i = 0; i < 7; ++i) {
      const e1 = first.body?.data[i] as IDateEntry;
      const e2 = second.body?.data[i] as IDateEntry;
      expect(e1).toBeTruthy();
      expect(e2).toBeTruthy();
      expect(
        e1.availableAt === e2.availableAt &&
          e1.redeemedAt === e2.redeemedAt &&
          e1.expiresAt === e2.expiresAt
      ).toBeFalsy();
    }
  });

  it("should fail when missing at query param", async () => {
    expect.assertions(2);
    const result = await request(app).get("/users/1/rewards");
    expect(result.statusCode).toBe(400);
    expect(result.body).toStrictEqual({
      error: {
        message: "Date is required.",
      },
    });
  });

  it("should fail when given invalid date", async () => {
    expect.assertions(2);
    const result = await request(app).get("/users/1/rewards?at=foobar");
    expect(result.statusCode).toBe(400);
    expect(result.body).toStrictEqual({
      error: {
        message: "Given date must have valid format.",
      },
    });
  });
});

describe("redeem reward endpoint", () => {
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(jest.fn());
    jest.spyOn(console, "debug").mockImplementation(jest.fn());
    jest.spyOn(console, "error").mockImplementation(jest.fn());
  });

  afterEach(() => clearCache());

  it("should work with already generated weekly rewards (using date string with milliseconds)", async () => {
    expect.assertions(3);
    const today = new Date(Date.now());
    const todayWithoutTime = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    const tmrWithoutTime = new Date(todayWithoutTime);
    tmrWithoutTime.setUTCDate(tmrWithoutTime.getUTCDate() + 1);

    const generateResult = await request(app).get(
      `/users/1/rewards?at=${today.toISOString()}`
    );
    expect(generateResult.statusCode).toBe(200);

    const redeemResult = await request(app).patch(
      `/users/1/rewards/${today.toISOString()}/redeem`
    );
    expect(redeemResult.statusCode).toBe(200);
    expect(redeemResult.body).toStrictEqual({
      data: {
        availableAt: toStringWithoutMillis(todayWithoutTime),
        redeemedAt: toStringWithoutMillis(today),
        expiresAt: toStringWithoutMillis(tmrWithoutTime),
      },
    });
  });

  it("should work with already generated weekly rewards (using date string without milliseconds)", async () => {
    expect.assertions(3);
    const today = new Date(Date.now());
    const todayWithoutTime = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    const tmrWithoutTime = new Date(todayWithoutTime);
    tmrWithoutTime.setUTCDate(tmrWithoutTime.getUTCDate() + 1);

    const generateResult = await request(app).get(
      `/users/1/rewards?at=${toStringWithoutMillis(today)}`
    );
    expect(generateResult.statusCode).toBe(200);

    const redeemResult = await request(app).patch(
      `/users/1/rewards/${toStringWithoutMillis(today)}/redeem`
    );
    expect(redeemResult.statusCode).toBe(200);
    expect(redeemResult.body).toStrictEqual({
      data: {
        availableAt: toStringWithoutMillis(todayWithoutTime),
        redeemedAt: toStringWithoutMillis(today),
        expiresAt: toStringWithoutMillis(tmrWithoutTime),
      },
    });
  });
  it("should work with already generated weekly rewards (using date string without time)", async () => {
    expect.assertions(3);
    const today = new Date(Date.now());
    const todayWithoutTime = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    const tmrWithoutTime = new Date(todayWithoutTime);
    tmrWithoutTime.setUTCDate(tmrWithoutTime.getUTCDate() + 1);

    const generateResult = await request(app).get(
      `/users/1/rewards?at=${toStringWithoutMillis(todayWithoutTime)}`
    );
    expect(generateResult.statusCode).toBe(200);

    const redeemResult = await request(app).patch(
      `/users/1/rewards/${toStringWithoutMillis(today)}/redeem`
    );
    expect(redeemResult.statusCode).toBe(200);
    expect(redeemResult.body).toStrictEqual({
      data: {
        availableAt: toStringWithoutMillis(todayWithoutTime),
        redeemedAt: toStringWithoutMillis(today),
        expiresAt: toStringWithoutMillis(tmrWithoutTime),
      },
    });
  });

  it("should fail when given invalid date", async () => {
    expect.assertions(3);

    const generateResult = await request(app).get(
      `/users/1/rewards?at=${toStringWithoutMillis(new Date(Date.now()))}`
    );
    expect(generateResult.statusCode).toBe(200);

    const redeemResult = await request(app).patch(
      `/users/1/rewards/foobar/redeem`
    );
    expect(redeemResult.statusCode).toBe(400);
    expect(redeemResult.body).toStrictEqual({
      error: {
        message: "Given date must have valid format.",
      },
    });
  });

  it("should fail when trying to redeem a reward that has not been generated", async () => {
    expect.assertions(2);

    const redeemResult = await request(app).patch(
      `/users/1/rewards/${toStringWithoutMillis(new Date(Date.now()))}/redeem`
    );
    expect(redeemResult.statusCode).toBe(400);
    expect(redeemResult.body).toStrictEqual({
      error: {
        message: "This reward is not available.",
      },
    });
  });

  it("should fail when redeem a reward that has already been redeemed", async () => {
    expect.assertions(4);

    const today = new Date(Date.now());

    const generateResult = await request(app).get(
      `/users/1/rewards?at=${toStringWithoutMillis(today)}`
    );
    expect(generateResult.statusCode).toBe(200);

    const firstRedeem = await request(app).patch(
      `/users/1/rewards/${toStringWithoutMillis(today)}/redeem`
    );
    expect(firstRedeem.statusCode).toBe(200);

    const secondRedeem = await request(app).patch(
      `/users/1/rewards/${toStringWithoutMillis(today)}/redeem`
    );
    expect(secondRedeem.statusCode).toBe(409);
    expect(secondRedeem.body).toStrictEqual({
      error: {
        message: "This reward has already been redeemed.",
      },
    });
  });

  it("should fail when redeem a reward that is not yet available", async () => {
    expect.assertions(3);

    const today = new Date(Date.now());
    const tmr = new Date(today);
    tmr.setUTCDate(today.getUTCDate() + 1);

    const generateResult = await request(app).get(
      `/users/1/rewards?at=${toStringWithoutMillis(today)}`
    );
    expect(generateResult.statusCode).toBe(200);

    const redeemResult = await request(app).patch(
      `/users/1/rewards/${toStringWithoutMillis(tmr)}/redeem`
    );
    expect(redeemResult.statusCode).toBe(400);
    expect(redeemResult.body).toStrictEqual({
      error: {
        message: "This reward is not yet available.",
      },
    });
  });

  it("should fail when redeem a reward that has already expired", async () => {
    expect.assertions(3);

    const past = new Date("2021-11-30T10:10:10Z");

    const generateResult = await request(app).get(
      `/users/1/rewards?at=${toStringWithoutMillis(past)}`
    );
    expect(generateResult.statusCode).toBe(200);

    const redeemResult = await request(app).patch(
      `/users/1/rewards/${toStringWithoutMillis(past)}/redeem`
    );
    expect(redeemResult.statusCode).toBe(400);
    expect(redeemResult.body).toStrictEqual({
      error: {
        message: "This reward is already expired",
      },
    });
  });
});
