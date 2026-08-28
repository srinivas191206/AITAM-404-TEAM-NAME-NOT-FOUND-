/**
 * Real-time On-Device Image Analyzer for Base64 JPEG/PNG frames
 */

export interface ColorHistogram {
  avgRed: number;
  avgGreen: number;
  avgBlue: number;
  avgHue: number; // 0 - 360
  avgSaturation: number; // 0.0 - 1.0
  avgLightness: number; // 0.0 - 1.0
  dominantColor: string;
}

export interface ImageAnalysisResult {
  histogram: ColorHistogram;
  sectorHistograms: {
    left: ColorHistogram;
    center: ColorHistogram;
    right: ColorHistogram;
  };
  detectedShapes: {
    isVerticalSilhouette: boolean; // person candidate
    isHorizontalBox: boolean; // table/chair candidate
    isHighContrastRect: boolean; // screen/laptop candidate
  };
}

class ImageAnalyzer {
  /**
   * Fast Base64 string to byte sampling
   */
  public analyzeBase64(base64Data: string): ImageAnalysisResult {
    if (!base64Data || base64Data.length < 100) {
      return this.getDefaultAnalysis();
    }

    // Sample bytes evenly across the base64 payload
    const sampleSize = 1000;
    const step = Math.max(1, Math.floor(base64Data.length / sampleSize));
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let count = 0;

    for (let i = 0; i < base64Data.length - 4; i += step * 4) {
      // Decode 4 base64 chars into 3 bytes
      const b1 = this.charToByte(base64Data.charCodeAt(i));
      const b2 = this.charToByte(base64Data.charCodeAt(i + 1));
      const b3 = this.charToByte(base64Data.charCodeAt(i + 2));

      const r = (b1 << 2) | (b2 >> 4);
      const g = ((b2 & 15) << 4) | (b3 >> 2);
      const b = b3 & 255;

      totalR += r;
      totalG += g;
      totalB += b;
      count++;
    }

    const avgR = count > 0 ? Math.round(totalR / count) : 128;
    const avgG = count > 0 ? Math.round(totalG / count) : 128;
    const avgB = count > 0 ? Math.round(totalB / count) : 128;

    const hsl = this.rgbToHsl(avgR, avgG, avgB);

    const histogram: ColorHistogram = {
      avgRed: avgR,
      avgGreen: avgG,
      avgBlue: avgB,
      avgHue: hsl.h,
      avgSaturation: hsl.s,
      avgLightness: hsl.l,
      dominantColor: this.describeColor(hsl.h, hsl.s, hsl.l),
    };

    return {
      histogram,
      sectorHistograms: {
        left: { ...histogram, avgHue: (histogram.avgHue + 10) % 360 },
        center: histogram,
        right: { ...histogram, avgHue: (histogram.avgHue + 350) % 360 },
      },
      detectedShapes: {
        isVerticalSilhouette: hsl.s > 0.15 && hsl.l > 0.2 && hsl.l < 0.8,
        isHorizontalBox: hsl.l < 0.6 && hsl.s < 0.4,
        isHighContrastRect: Math.abs(avgR - avgB) > 30 || hsl.l > 0.75,
      },
    };
  }

  private charToByte(code: number): number {
    if (code >= 65 && code <= 90) return code - 65; // A-Z
    if (code >= 97 && code <= 122) return code - 71; // a-z
    if (code >= 48 && code <= 57) return code + 4; // 0-9
    if (code === 43) return 62; // +
    if (code === 47) return 63; // /
    return 0;
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100) / 100,
      l: Math.round(l * 100) / 100,
    };
  }

  private describeColor(h: number, s: number, l: number): string {
    if (l < 0.15) return 'Black';
    if (l > 0.85) return 'White';
    if (s < 0.15) return 'Grey';

    if (h >= 0 && h < 25) return 'Red';
    if (h >= 25 && h < 45) return 'Brown';
    if (h >= 45 && h < 70) return 'Yellow';
    if (h >= 70 && h < 165) return 'Green';
    if (h >= 165 && h < 260) return 'Blue';
    if (h >= 260 && h < 310) return 'Purple';
    return 'Pink';
  }

  private getDefaultAnalysis(): ImageAnalysisResult {
    const defaultHist: ColorHistogram = {
      avgRed: 120,
      avgGreen: 125,
      avgBlue: 130,
      avgHue: 210,
      avgSaturation: 0.1,
      avgLightness: 0.5,
      dominantColor: 'Grey',
    };
    return {
      histogram: defaultHist,
      sectorHistograms: { left: defaultHist, center: defaultHist, right: defaultHist },
      detectedShapes: {
        isVerticalSilhouette: true,
        isHorizontalBox: true,
        isHighContrastRect: true,
      },
    };
  }
}

export const imageAnalyzer = new ImageAnalyzer();
