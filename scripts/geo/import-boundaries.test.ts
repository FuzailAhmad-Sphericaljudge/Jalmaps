import { describe, expect, it } from "vitest";
import { parseAndProcessBoundaries } from "./import-boundaries";

describe("Boundary Import Pipeline", () => {
  const sampleGeoJson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          code: "27",
          level: "state",
          name_en: "Maharashtra",
          name_hi: "महाराष्ट्र",
          name_mr: "महाराष्ट्र",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [72.5, 15.5],
              [80.9, 15.5],
              [80.9, 22.1],
              [72.5, 22.1],
              [72.5, 15.5],
            ],
          ],
        },
      },
      {
        type: "Feature",
        properties: {
          code: "492",
          parent_code: "27",
          level: "district",
          name_en: "Pune",
          name_mr: "पुणे",
        },
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [73.3, 18.0],
                [75.1, 18.0],
                [75.1, 19.3],
                [73.3, 19.3],
                [73.3, 18.0],
              ],
            ],
          ],
        },
      },
    ],
  };

  it("parses valid GeoJSON and normalizes Polygon to MultiPolygon", () => {
    const results = parseAndProcessBoundaries(sampleGeoJson);
    expect(results).toHaveLength(2);

    const state = results[0];
    expect(state).toBeDefined();
    expect(state?.code).toBe("27");
    expect(state?.level).toBe("state");
    expect(state?.names.en).toBe("Maharashtra");
    expect(state?.names.hi).toBe("महाराष्ट्र");
    expect(state?.names.mr).toBe("महाराष्ट्र");
    expect(state?.geometry.type).toBe("MultiPolygon");
    expect(state?.simplifiedGeometry.type).toBe("MultiPolygon");

    const district = results[1];
    expect(district).toBeDefined();
    expect(district?.code).toBe("492");
    expect(district?.parent_code).toBe("27");
    expect(district?.level).toBe("district");
    expect(district?.names.en).toBe("Pune");
    expect(district?.geometry.type).toBe("MultiPolygon");
  });

  it("throws validation error on invalid feature missing required properties", () => {
    const invalidGeoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            // missing code, level, name_en
          },
          geometry: {
            type: "Polygon",
            coordinates: [],
          },
        },
      ],
    };

    expect(() => parseAndProcessBoundaries(invalidGeoJson)).toThrow();
  });
});

