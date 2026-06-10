import * as stylex from '@stylexjs/stylex';

export const colours = stylex.defineVars({
  backgroundPrimary: '#ffffff',
  backgroundSecondary: '#f9fafb',
  white: '#ffffff',
  transparent: 'transparent',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  borderDefault: '#e5e7eb',
  riskLow: '#10b981',
  riskMedium: '#f59e0b',
  riskHigh: '#ef4444',
  errorBackground: '#fef2f2',
  errorBorder: '#fecaca',
  errorText: '#991b1b',
  spinner: '#3b82f6',
});

export const spacing = stylex.defineVars({
  none: '0px',
  extraSmall: '4px',
  small: '8px',
  medium: '16px',
  large: '24px',
  extraLarge: '32px',
});

export const fontSize = stylex.defineVars({
  extraSmall: '12px',
  small: '14px',
  base: '16px',
  large: '18px',
  extraLarge: '20px',
  doubleExtraLarge: '24px',
  tripleExtraLarge: '32px',
  quadrupleExtraLarge: '48px',
});

export const fontWeight = stylex.defineVars({
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
});

export const lineHeight = stylex.defineVars({
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.75',
});

export const typography = stylex.defineVars({
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
});

export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
};

export const layout = stylex.defineVars({
  fullHeight: '100vh',
  leftPanelWidth: '520px',
});

export const shadows = stylex.defineVars({
  small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  large: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
});

export const borderRadius = stylex.defineVars({
  small: '4px',
  base: '8px',
  large: '12px',
  round: '50%',
});

export const sizing = stylex.defineVars({
  extraSmall: '24px',
  full: '100%',
  mapMobileHeight: '300px',
});

export const margin = stylex.defineVars({
  none: '0px',
});

export const borderWidth = stylex.defineVars({
  none: '0px',
  thin: '1px',
  base: '2px',
  thick: '3px',
});

export const outline = stylex.defineVars({
  offset: '2px',
});
