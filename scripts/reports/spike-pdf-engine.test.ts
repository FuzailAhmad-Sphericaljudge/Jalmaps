import { describe, it, expect } from "vitest";
import { SCRIPT_SAMPLES, buildSpikeHtml } from "./spike-pdf-engine";

describe("spike-pdf-engine", () => {
  it("includes all 11 supported locales with complex script phrases", () => {
    const locales = SCRIPT_SAMPLES.map((s) => s.locale);
    expect(locales).toContain("en");
    expect(locales).toContain("hi");
    expect(locales).toContain("pa");
    expect(locales).toContain("mr");
    expect(locales).toContain("gu");
    expect(locales).toContain("bn");
    expect(locales).toContain("ta");
    expect(locales).toContain("te");
    expect(locales).toContain("kn");
    expect(locales).toContain("ml");
    expect(locales).toContain("or");
    expect(locales).toHaveLength(11);
  });

  it("builds valid HTML document containing all script samples and print styles", () => {
    const html = buildSpikeHtml(SCRIPT_SAMPLES);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("@page");
    expect(html).toContain("A4 portrait");
    expect(html).toContain("जल स्तर स्थिति एवं भूजल विश्लेषण रिपोर्ट");
    expect(html).toContain("ਜਲ ਪੱਧਰ ਰਿਪੋਰਟ ਅਤੇ ਧਰਤੀ ਹੇਠਲਾ ਪਾਣੀ ਮੁਲਾਂਕਣ");
    expect(html).toContain("நிலத்தடி நீர் மட்டம் மற்றும் மழைநீர் சேமிப்பு அறிக்கை");
  });
});
