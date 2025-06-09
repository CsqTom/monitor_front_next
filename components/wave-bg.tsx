

import '../app/wave-animations.css';

interface Props {
  /** Theme color */
  themeColor: string;
}

type ColorPaletteNumber = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
type ColorIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
type AnyColor = string;

// 颜色处理工具函数
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function mixColor(color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color2;
  
  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
  
  return rgbToHex(r, g, b);
}

function getHex(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

// 生成Ant Design风格的调色板
function getAntDPaletteColorByIndex(color: AnyColor, index: ColorIndex): string {
  const baseColor = getHex(color);
  const rgb = hexToRgb(baseColor);
  
  if (!rgb) return baseColor;
  
  // Ant Design调色板算法简化版
  const lightness = [
    0.95, // index 1 - 最浅
    0.85, // index 2
    0.75, // index 3
    0.65, // index 4
    0.55, // index 5
    1.0,  // index 6 - 原色
    0.85, // index 7
    0.7,  // index 8
    0.55, // index 9
    0.4,  // index 10
    0.25  // index 11 - 最深
  ];
  
  const factor = lightness[index - 1];
  
  if (index <= 5) {
    // 浅色：与白色混合
    return mixColor('#ffffff', baseColor, 1 - factor);
  } else if (index === 6) {
    // 原色
    return baseColor;
  } else {
    // 深色：降低亮度
    const r = Math.round(rgb.r * factor);
    const g = Math.round(rgb.g * factor);
    const b = Math.round(rgb.b * factor);
    return rgbToHex(r, g, b);
  }
}

function getAntDColorPalette(color: AnyColor, darkTheme = false, darkThemeMixColor = '#141414'): string[] {
  const indexes: ColorIndex[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const patterns = indexes.map(index => getAntDPaletteColorByIndex(color, index));
  
  if (darkTheme) {
    // 暗色主题处理（暂时不实现）
    return patterns;
  }
  
  return patterns;
}

function getPaletteColorByNumber(color: string, number: ColorPaletteNumber): string {
  const colors = getAntDColorPalette(color);
  const colorNumbers: ColorPaletteNumber[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  
  const colorMap = new Map<ColorPaletteNumber, string>();
  colorNumbers.forEach((num, index) => {
    colorMap.set(num, colors[index]);
  });
  
  return colorMap.get(number) || color;
}

const WaveBg = ({ themeColor }: Props) => {
  const lightColor = getPaletteColorByNumber(themeColor, 200);
  const darkColor = getPaletteColorByNumber(themeColor, 500);

  return (
    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-blue-50">
      <div className="absolute -right-[45vw] -top-[80vh] max-sm:-right-[10vw] max-sm:-top-[65vh] wave-drift">
        <svg 
        height="130vh" 
        width="130vw" 
        viewBox="0 0 1337 1337" 
        className="wave-float wave-pulse"
        >
          <defs>
            <path
              d="M1337,668.5 C1337,1037.455193874239 1037.455193874239,1337 668.5,1337 C523.6725684305388,1337 337,1236 370.50000000000006,1094 C434.03835568300906,824.6732385973953 6.906089672974592e-14,892.6277623047779 0,668.5000000000001 C0,299.5448061257611 299.5448061257609,1.1368683772161603e-13 668.4999999999999,0 C1037.455193874239,0 1337,299.544806125761 1337,668.5Z"
              fillRule="evenodd"
              id="path-1"
              opacity="1"
            />
            <linearGradient
              id="linearGradient-2"
              x1="0.79"
              x2="0.21"
              y1="0.62"
              y2="0.86"
            >
              <stop
                offset="0"
                stopColor={lightColor}
                stopOpacity="1"
              />
              <stop
                offset="1"
                stopColor={darkColor}
                stopOpacity="1"
              />
            </linearGradient>
          </defs>
          <g opacity="1">
            <use
              fill="url(#linearGradient-2)"
              fillOpacity="1"
              xlinkHref="#path-1"
            />
          </g>
        </svg>
      </div>
      <div className="absolute -bottom-[22vh] -left-[10vw] max-sm:-bottom-[42vh] max-sm:-left-[8vw] wave-drift" style={{ animationDelay: '3s' }}>
        <svg
          height="100vh"
          width="100vw"
          viewBox="300 -200 967.8852157128662 896"
          className="wave-float wave-pulse"
          style={{ animationDelay: '1.5s' }}
        >
          <defs>
            <path
              d="M896,448 C1142.6325445712241,465.5747656464056 695.2579309733121,896 448,896 C200.74206902668806,896 5.684341886080802e-14,695.2579309733121 0,448.0000000000001 C0,200.74206902668806 200.74206902668791,5.684341886080802e-14 447.99999999999994,0 C695.2579309733121,0 475,418 896,448Z"
              fillRule="evenodd"
              id="path-2"
              opacity="1"
            />
            <linearGradient
              id="linearGradient-3"
              x1="0.5"
              x2="0.5"
              y1="0"
              y2="1"
            >
              <stop
                offset="0"
                stopColor={lightColor}
                stopOpacity="1"
              />
              <stop
                offset="1"
                stopColor={darkColor}
                stopOpacity="1"
              />
            </linearGradient>
          </defs>
          <g opacity="1">
            <use
              fill="url(#linearGradient-3)"
              fillOpacity="1"
              xlinkHref="#path-2"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default WaveBg;
