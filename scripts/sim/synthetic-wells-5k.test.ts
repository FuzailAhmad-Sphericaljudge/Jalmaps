import { describe, expect, it } from "vitest";
import { benchmarkClustering } from "./synthetic-wells-5k";

describe("synthetic-wells-5k benchmark", () => {
  it("runs without throwing and clusters within time constraints", () => {
    expect(() => benchmarkClustering()).not.toThrow();
  });
});

