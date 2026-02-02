/**
 * Hex 색상을 HSL로 변환
 */
function hexToHsl(hex: string) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }
  
  /**
   * HSL → CSS 문자열
   */
  function hslToCss(h: number, s: number, l: number) {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  
  /**
   * 진행률에 따라 색상을 진하게 만드는 함수
   * @param hex - 기본 색상 (#FF6B6B 형식)
   * @param progress - 진행률 (0 ~ 1)
   * @returns CSS 색상 문자열
   */
  export function getProgressColor(hex: string, progress: number) {
    const { h, s, l } = hexToHsl(hex);
    // 밝기 감소 (진해짐 효과)
    const newLightness = Math.max(30, l - progress * 25);
    // 채도 살짝 증가 (생동감)
    const newSaturation = Math.min(90, s + progress * 10);
    return hslToCss(h, newSaturation, newLightness);
  }
    