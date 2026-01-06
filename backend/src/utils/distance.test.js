import { haversineDistance } from "./distance.js";

describe("haversineDistance", () => {
  it("calcula distancia en metros", () => {
    const santiagoCenter = { lat: -33.4489, lng: -70.6693 };
    const parqueO = { lat: -33.4431, lng: -70.6549 };
    const distance = haversineDistance(santiagoCenter, parqueO);
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(2000);
  });
});
