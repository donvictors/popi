import { classifyToilet, isAssociatedToBusiness, hasFee } from "./classification.js";

describe("classifyToilet", () => {
  it("detecta baño público", () => {
    const result = classifyToilet({ amenity: "toilets" });
    expect(result.category).toBe("PUBLICO");
  });

  it("detecta baño pagado con asociación", () => {
    const result = classifyToilet({ amenity: "toilets", fee: "yes", shop: "mall" });
    expect(result.category).toBe("PAGADO");
    expect(result.secondaryBadges).toContain("asociado a local");
  });

  it("detecta baño asociado a local por toilets key", () => {
    const result = classifyToilet({ toilets: "customers", amenity: "fast_food" });
    expect(result.category).toBe("ASOCIADO_A_LOCAL");
  });

  it("cae en desconocido sin tags", () => {
    const result = classifyToilet({});
    expect(result.category).toBe("DESCONOCIDO");
  });
});

describe("helpers", () => {
  it("detecta fee en variantes", () => {
    expect(hasFee({ fee: "yes" })).toBe(true);
    expect(hasFee({ "toilets:fee": "yes" })).toBe(true);
    expect(hasFee({ payment: "cash" })).toBe(true);
  });

  it("detecta asociación por amenity comercial", () => {
    expect(isAssociatedToBusiness({ amenity: "cafe" })).toBe(true);
    expect(isAssociatedToBusiness({ shop: "mall" })).toBe(true);
  });
});
