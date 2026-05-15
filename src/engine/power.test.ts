import { describe, it, expect } from "vitest";
import { powerPerMachineMW, log2_2_5 } from "./power";

describe("overclock power formula", () => {
  it("100% clock, no sloops = base power", () => {
    expect(powerPerMachineMW(4, 100, 0, 1)).toBeCloseTo(4, 6);
  });

  it("250% clock applies (2.5^1.321928) ~= 3.4 multiplier", () => {
    expect(powerPerMachineMW(4, 250, 0, 1)).toBeCloseTo(4 * Math.pow(2.5, log2_2_5), 6);
  });

  it("50% clock applies (0.5)^1.321928 multiplier", () => {
    expect(powerPerMachineMW(4, 50, 0, 1)).toBeCloseTo(4 * Math.pow(0.5, log2_2_5), 6);
  });

  it("1 sloop in 1-slot doubles output, quadruples power", () => {
    expect(powerPerMachineMW(4, 100, 1, 1)).toBeCloseTo(16, 6);
  });

  it("log2(2.5) constant", () => {
    expect(log2_2_5).toBeCloseTo(1.32192809488736, 12);
  });
});
