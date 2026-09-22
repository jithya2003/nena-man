// =============================================================================
// Nena-Man ("නැණ මං") Theme & Design Tokens
// Modern, warm, dyslexia-friendly design for Sinhala learning
// =============================================================================

export const ThemeColors = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  background: '#F4F9F5',         // Gentle minty off-white background
  backgroundMuted: '#EBF3ED',    // Slightly deeper mint background
  backgroundAlt: '#EEF6F0',      // Card/section tint
  card: '#FFFFFF',               // Clean white card surface
  cardElevated: '#FFFFFF',

  // ── Primary Brand Palette (Emerald & Mint) ─────────────────────────────────
  primary: '#0B7A44',            // Deep Emerald Green (Primary buttons, accents)
  primaryDark: '#086337',        // Active / pressed green
  primaryLight: '#E8F6ED',       // Mint background for active states & badges
  primarySurface: '#E2F4E8',     // Soft mint card background
  primaryBorder: '#B2E2C3',      // Border for mint cards

  // ── Secondary Accent (Amber/Brown for Journey & Streak) ────────────────────
  accent: '#965B20',             // Warm bronze/amber for progress bars
  accentDark: '#7A4815',
  accentLight: '#FDF3E7',        // Soft cream/amber surface for streak badges
  accentBorder: '#EED9BE',

  // ── Structural Surfaces (Cards, Containers, Inputs) ────────────────────────
  surface: '#FFFFFF',            // Pure white elevated card
  surfaceElevated: '#FFFFFF',
  surfaceMint: '#EAF7EE',        // Mint green container
  surfaceIceBlue: '#E8F1F8',     // Soft light blue for input fields
  surfaceAmber: '#FDF4E9',       // Soft amber container for streaks
  surfaceMuted: '#F0F4F2',

  // ── Typography & Text ──────────────────────────────────────────────────────
  textPrimary: '#172B20',        // Deep forest charcoal for high legibility
  textSecondary: '#4F6659',      // Medium forest gray for helper text
  textMuted: '#7F9489',          // Muted labels & placeholders
  textGreen: '#0B7A44',          // Brand green text
  textWhite: '#FFFFFF',
  textAmber: '#965B20',

  // ── Semantic States ────────────────────────────────────────────────────────
  success: '#0B7A44',
  successSurface: '#EAF7EE',
  successBorder: '#BCE6CB',

  error: '#C14343',
  errorSurface: '#FDECEC',
  errorBorder: '#F6BEBE',

  warning: '#D97706',
  warningSurface: '#FEF3C7',
  warningBorder: '#FCD34D',

  info: '#2563EB',
  infoSurface: '#EFF6FF',
  infoBorder: '#BFDBFE',

  // ── AI Modules ─────────────────────────────────────────────────────────────
  m1: '#0B7A44',
  m1Surface: '#EAF7EE',
  m2: '#965B20',
  m2Surface: '#FDF4E9',
  m3: '#0B7A44',
  m3Surface: '#E2F4E8',
  m4: '#D97706',
  m4Surface: '#FEF3C7',

  // ── Borders & Shadows ──────────────────────────────────────────────────────
  border: '#D9E6DE',
  borderLight: '#E8F0EB',
  divider: '#E2ECE6',
  overlay: 'rgba(15, 30, 20, 0.4)',
};

export const ThemeSpacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const ThemeRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const ThemeFontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  xxxl: 32,
  display: 40,
};

export const ThemeFontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const ThemeShadow = {
  sm: {
    shadowColor: '#0B381E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0B381E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0B381E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const Colors = ThemeColors;
export const Spacing = ThemeSpacing;
export const Radius = ThemeRadius;
export const FontSize = ThemeFontSize;
export const FontWeight = ThemeFontWeight;
export const Shadow = ThemeShadow;
