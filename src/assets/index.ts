// Asset exports for consistent imports across the application
import logoSvg from './logo.png';
import logoPng from './blockFinax.png';

// Default logo export (PNG for compatibility)
export const logoPath = logoPng;
export const logoSvgPath = logoSvg;

// Asset constants
export const ASSETS = {
  logo: {
    svg: logoSvg,
    png: logoPng,
  },
} as const;

// Default export
export default logoPath;
