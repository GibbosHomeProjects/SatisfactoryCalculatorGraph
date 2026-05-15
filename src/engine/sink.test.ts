import { describe, it, expect } from "vitest";
import { sampleGameData } from "@/data/sample";
import { sinkPointsPerMin, couponCost } from "./sink";

describe("AWESOME Sink math", () => {
  it("60 plates/min (6 pts each) = 360 pts/min", () => {
    const flows = [{ itemId: "iron-plate", amountPerMin: 60 }];
    expect(sinkPointsPerMin(sampleGameData, flows)).toBe(360);
  });

  it("items with 0 sink points contribute 0", () => {
    const flows = [{ itemId: "water", amountPerMin: 600 }];
    expect(sinkPointsPerMin(sampleGameData, flows)).toBe(0);
  });

  it("multiple inputs sum correctly", () => {
    const flows = [
      { itemId: "iron-plate", amountPerMin: 60 },
      { itemId: "screw",      amountPerMin: 120 },
    ];
    expect(sinkPointsPerMin(sampleGameData, flows)).toBe(600);
  });

  it("unknown item is ignored (no throw)", () => {
    const flows = [{ itemId: "made-up", amountPerMin: 100 }];
    expect(sinkPointsPerMin(sampleGameData, flows)).toBe(0);
  });

  it("coupon cost for first coupon (n=0) = 1000", () => {
    expect(couponCost(0)).toBe(1000);
  });

  it("coupon cost for n=3 = 250*(1)^2 + 1000 = 1250", () => {
    expect(couponCost(3)).toBe(1250);
  });

  it("coupon cost for n=6 = 250*(2)^2 + 1000 = 2000", () => {
    expect(couponCost(6)).toBe(2000);
  });

  it("coupon cost flat after n=2998", () => {
    expect(couponCost(3000)).toBe(249_501_250);
  });
});
