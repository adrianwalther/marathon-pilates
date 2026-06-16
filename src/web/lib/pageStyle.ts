import type { CSSProperties } from 'react'

// Shared page width + padding for every dashboard page. Centralized so the
// content width, gutters, and centering live in ONE place.
//
//   <div style={pageStyle()}>      → content pages (default CONTENT_MAX, centered)
//   <div style={pageStyle(620)}>   → narrower form/focused pages
//
// Content pages share CONTENT_MAX; forms intentionally stay narrower (a form
// stretched too wide reads poorly) but get the same gutters + centering.
export const CONTENT_MAX = 1100

export function pageStyle(max: number = CONTENT_MAX): CSSProperties {
  return {
    maxWidth: `${max}px`,
    width: '100%',
    margin: '0 auto',       // center within the available space
    padding: '3rem 2.5rem',
  }
}
