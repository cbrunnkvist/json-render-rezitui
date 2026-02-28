import { logDebug } from "./logger.js";

/**
 * Standard TUI color map to Rgb objects.
 */
const COLOR_MAP: Record<string, { r: number, g: number, b: number }> = {
  black: { r: 0, g: 0, b: 0 },
  red: { r: 255, g: 0, b: 0 },
  green: { r: 0, g: 255, b: 0 },
  yellow: { r: 255, g: 255, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  magenta: { r: 255, g: 0, b: 255 },
  cyan: { r: 0, g: 255, b: 255 },
  white: { r: 255, g: 255, b: 255 },
  gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 },
  dim: { r: 100, g: 100, b: 100 },
};

/**
 * Strict style mapper that separates styling from other props.
 * Rezi's widgets often perform an 'isTextProps' check which fails if styling
 * properties like 'fg' or 'bold' are at the top level.
 */
export function mapStyles(props: Record<string, any>): any {
  if (!props) return props;
  
  const result: any = { ...props };
  const style: any = props.style ? { ...props.style } : {};
  
  const resolveColor = (color: any) => {
    if (typeof color === 'string') {
      const lower = color.toLowerCase();
      if (COLOR_MAP[lower]) return COLOR_MAP[lower];
      // Support hex colors if they start with #
      if (color.startsWith('#')) return color;
    }
    return color;
  };

  // 1. Map color/fg to style.fg
  if (props.color || props.fg || style.fg) {
    style.fg = resolveColor(props.color || props.fg || style.fg);
    delete result.color;
    delete result.fg;
  }
  
  // 2. Map backgroundColor/bg to style.bg
  if (props.backgroundColor || props.bg || style.bg) {
    style.bg = resolveColor(props.backgroundColor || props.bg || style.bg);
    delete result.backgroundColor;
    delete result.bg;
  }

  // 3. Map formatting flags
  if (props.bold !== undefined) {
    style.bold = !!props.bold;
    delete result.bold;
  }
  
  if (props.dim !== undefined) {
    style.dim = !!props.dim;
    delete result.dim;
  }

  if (props.italic !== undefined) {
    style.italic = !!props.italic;
    delete result.italic;
  }

  if (props.underline !== undefined) {
    style.underline = !!props.underline;
    delete result.underline;
  }

  // 4. Always nest styling in the style object for widgets
  if (Object.keys(style).length > 0) {
    result.style = style;
  }

  return result;
}
