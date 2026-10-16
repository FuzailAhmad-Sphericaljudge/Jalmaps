/**
 * JalMaps Phase 23 - PDF Engine Spike
 * Evaluates Indic complex script text shaping (Devanagari, Gurmukhi, Bengali, Tamil, etc.)
 * using Chromium (HarfBuzz) to ensure 100% typographic fidelity.
 */
import { chromium } from "@playwright/test";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface ScriptSample {
  locale: string;
  language: string;
  title: string;
  complexText: string;
}

export const SCRIPT_SAMPLES: ScriptSample[] = [
  {
    locale: "en",
    language: "English",
    title: "Groundwater Monitoring Report",
    complexText: "Hydrogeological analysis, seasonal recovery, and aquifer stress indicators.",
  },
  {
    locale: "hi",
    language: "Hindi",
    title: "जल स्तर स्थिति एवं भूजल विश्लेषण रिपोर्ट",
    complexText: "कुओं की स्थिति, वर्षा जल पुनर्भरण और भूजल निष्कर्षण दर का विस्तृत ब्यौरा।",
  },
  {
    locale: "pa",
    language: "Punjabi",
    title: "ਜਲ ਪੱਧਰ ਰਿਪੋਰਟ ਅਤੇ ਧਰਤੀ ਹੇਠਲਾ ਪਾਣੀ ਮੁਲਾਂਕਣ",
    complexText: "ਟਿਊਬਵੈੱਲ ਨਿਗਰਾਨੀ, ਮਾਨਸੂਨ ਰੀਚਾਰਜ ਅਤੇ ਪਿੰਡ ਪੱਧਰੀ ਪਾਣੀ ਦੇ ਭੰਡਾਰ ਦੀ ਸਥਿਤੀ।",
  },
  {
    locale: "mr",
    language: "Marathi",
    title: "भूजल पातळी व पुनर्भरण विश्लेषण अहवाल",
    complexText: "विहिरींची सद्यस्थिती, उपसा प्रमाण आणि पावसाळ्यानंतरची जल पुनर्भरण आकडेवारी।",
  },
  {
    locale: "gu",
    language: "Gujarati",
    title: "ભૂગર્ભ જળ સ્તર અને સંરક્ષણ વિશ્લેષણ અહેવાલ",
    complexText: "બોરવેલ સરેરાશ ઊંડાઈ, ચોમાસાનું રિચાર્જ અને ગામ સ્તરીય પાણી વપરાશ અહેવાલ.",
  },
  {
    locale: "bn",
    language: "Bengali",
    title: "ভূগর্ভস্থ জলস্তর ও পুনর্ভরণ বিশ্লেষণ প্রতিবেদন",
    complexText: "নলকূপের বর্তমান অবস্থা, বৃষ্টিপাতের প্রভাব এবং ভূগর্ভস্থ পানির সঞ্চয় নিরীক্ষণ।",
  },
  {
    locale: "ta",
    language: "Tamil",
    title: "நிலத்தடி நீர் மட்டம் மற்றும் மழைநீர் சேமிப்பு அறிக்கை",
    complexText: "ஆழ்துளை கிணறுகளின் நீர் இருப்பு, பருவமழை மறுஊட்டம் மற்றும் பயன்பாட்டு விவரம்.",
  },
  {
    locale: "te",
    language: "Telugu",
    title: "భూగర్భ జల స్థాయి మరియు రీఛార్జ్ విశ్లేషణ నివేదిక",
    complexText: "బోరుబావుల స్థితి, వర్షపాతం ప్రభావం మరియు గ్రామ స్థాయి నీటి వనరుల సమగ్ర వివరాలు.",
  },
  {
    locale: "kn",
    language: "Kannada",
    title: "ಅಂತರ್ಜಲ ಮಟ್ಟ ಮತ್ತು ಮರುಪೂರಣ ವಿಶ್ಲೇಷಣೆ ವರದಿ",
    complexText: "ಕೊಳವೆ ಬಾವಿಗಳ ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ, ಮಳೆಗಾಲದ ನಂತರದ ನೀರಿನ ಮಟ್ಟ ಮತ್ತು ಬಳಕೆ ವಿವರ.",
  },
  {
    locale: "ml",
    language: "Malayalam",
    title: "ഭൂഗർഭ ജലനിരപ്പും റീചാർജ് വിശകലന റിപ്പോർട്ടും",
    complexText: "കിണറുകളിലെ ജലനിരപ്പ്, കാലവർഷ റീചാർജ്, ഗ്രാമതല ജലവിഭവ സ്ഥിതിവിവരം.",
  },
  {
    locale: "or",
    language: "Odia",
    title: "ଭୂତଳ ଜଳ ସ୍ତର ଏବଂ ପୁନର୍ଭରଣ ବିଶ୍ଳେଷଣ ରିପୋର୍ଟ",
    complexText: "ନଳକୂପ ସ୍ଥିତି, ବର୍ଷାଜଳ ପ୍ରଭାବ ଏବଂ ଗ୍ରାମ୍ୟ ଜଳସମ୍ପଦର ସମ୍ପୂର୍ଣ୍ଣ ସମୀକ୍ଷା।",
  },
];

export function buildSpikeHtml(samples: ScriptSample[]): string {
  const rows = samples
    .map(
      (s) => `
    <div class="sample-card" data-locale="${s.locale}">
      <div class="locale-badge">${s.language} (${s.locale})</div>
      <h2 class="sample-title">${s.title}</h2>
      <p class="sample-body">${s.complexText}</p>
    </div>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>JalMaps Indic Typography & Script Shaping Spike</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0 0 4px 0;
      font-size: 18px;
      color: #0369a1;
    }
    .header p {
      margin: 0;
      color: #64748b;
      font-size: 11px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .sample-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background: #f8fafc;
      page-break-inside: avoid;
    }
    .locale-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: #e0f2fe;
      color: #0369a1;
      margin-bottom: 6px;
    }
    .sample-title {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 6px 0;
      color: #0f172a;
    }
    .sample-body {
      font-size: 12px;
      margin: 0;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>JalMaps Indic Typography Shaping Benchmark</h1>
    <p>Phase 23 Spike: Evaluation of OpenType HarfBuzz shaping across 11 Indic scripts</p>
  </div>
  <div class="grid">
    ${rows}
  </div>
</body>
</html>`;
}

export async function runPdfSpike(outputDir: string = "docs/phases"): Promise<string> {
  const html = buildSpikeHtml(SCRIPT_SAMPLES);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await fs.mkdir(outputDir, { recursive: true });
    const pdfPath = path.join(outputDir, "phase23-indic-shaping-spike.pdf");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
    });
    await fs.writeFile(pdfPath, pdfBuffer);
    return pdfPath;
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith("spike-pdf-engine.ts")) {
  runPdfSpike()
    .then((filePath) => {
      console.log(`[SPIKE] Generated PDF successfully at: ${filePath}`);
    })
    .catch((err) => {
      console.error("[SPIKE] Failed to generate PDF:", err);
      process.exit(1);
    });
}
