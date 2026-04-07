/**
 * Ornamental Rule Design System
 * A reusable, strongly-typed SVG ornamental divider component
 * with preset styles and proportional scaling
 */

import React from 'react'
import { Box } from '@mui/material'

// ============================================================================
// TYPES
// ============================================================================

export interface OrnamentAsset {
  left: string
  right: string
  center?: string
}

export type RulePresetName = 
  | 'newsGapHome'
  | 'scotchRule'
  | 'doubleRule'
  | 'fleuronCenter'
  | 'victorianDivider'
  | 'minimalEditorial'

export interface OrnamentalRuleOptions {
  text?: string
  width?: number
  height?: number
  preset?: RulePresetName
  alignment?: 'left' | 'center' | 'right'
  padding?: number
  lineThickness?: number
  ornamentScale?: number
  fontFamily?: string
  fontSize?: number
  lineColor?: string
  ornamentColor?: string
}

export interface RulePreset {
  name: RulePresetName
  lineThickness: number
  ornamentScale: number
  height: number
  spacing: number
  ornaments: OrnamentAsset
  fontFamily: string
  fontSize: number
  alignment: 'left' | 'center' | 'right'
  decorative: boolean
}

// ============================================================================
// ORNAMENT ASSETS (SVG paths and symbols)
// ============================================================================

const ORNAMENTS = {
  newsGapBulb: {
    left: 'M 0 8 Q -8 0, -8 8 Q -8 16, 0 8',
    right: 'M 0 8 Q 8 0, 8 8 Q 8 16, 0 8',
    center: 'M 0 8 C -4 4, -4 12, 0 8 C 4 4, 4 12, 0 8',
  },
  scotchFleuron: {
    left: 'M -2 0 L -4 4 L -2 8 L 0 6 L -2 4 L 0 2 Z',
    right: 'M 2 0 L 4 4 L 2 8 L 0 6 L 2 4 L 0 2 Z',
    center: 'M 0 0 L 2 4 L 0 8 L -2 4 Z',
  },
  victorianOrnament: {
    left: 'M -1 2 Q -4 4, -3 8 Q -1 10, 0 8 Q -1 6, -2 4 Q -2 2, 0 1',
    right: 'M 1 2 Q 4 4, 3 8 Q 1 10, 0 8 Q 1 6, 2 4 Q 2 2, 0 1',
    center: 'M -1 4 Q -2 2, 0 0 Q 2 2, 1 4 Q 2 6, 0 8 Q -2 6, -1 4',
  },
  goldfish: {
    left: 'M 5 0 L -2 -3 L -4 0 L -2 3 Z M 0 -2 Q -3 0, -4 2',
    right: 'M -5 0 L 2 -3 L 4 0 L 2 3 Z M 0 -2 Q 3 0, 4 2',
    center: 'M 0 -4 L -2 -1 L -3 2 L 0 4 L 3 2 L 2 -1 L 0 -4',
  },
  doubleBar: {
    left: '',
    right: '',
    center: 'M 0 4 L 0 4 M 0 3 L 0 3',
  },
  minimalDot: {
    left: 'M 0 0 C 1.5 0, 2 0.5, 2 1.5 C 2 2.5, 1.5 3, 0 3 C -1.5 3, -2 2.5, -2 1.5 C -2 0.5, -1.5 0, 0 0',
    right: 'M 0 0 C 1.5 0, 2 0.5, 2 1.5 C 2 2.5, 1.5 3, 0 3 C -1.5 3, -2 2.5, -2 1.5 C -2 0.5, -1.5 0, 0 0',
    center: 'M 0 0 C 1.5 0, 2 0.5, 2 1.5 C 2 2.5, 1.5 3, 0 3 C -1.5 3, -2 2.5, -2 1.5 C -2 0.5, -1.5 0, 0 0',
  },
}

// ============================================================================
// PRESET DEFINITIONS
// ============================================================================

const PRESETS: Record<RulePresetName, RulePreset> = {
  newsGapHome: {
    name: 'newsGapHome',
    lineThickness: 2,
    ornamentScale: 1,
    height: 32,
    spacing: 20,
    ornaments: ORNAMENTS.newsGapBulb,
    fontFamily: 'Didot, Georgia, serif',
    fontSize: 16,
    alignment: 'center',
    decorative: false,
  },
  scotchRule: {
    name: 'scotchRule',
    lineThickness: 1.5,
    ornamentScale: 0.8,
    height: 24,
    spacing: 16,
    ornaments: ORNAMENTS.scotchFleuron,
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 12,
    alignment: 'center',
    decorative: true,
  },
  doubleRule: {
    name: 'doubleRule',
    lineThickness: 1,
    ornamentScale: 0.5,
    height: 20,
    spacing: 12,
    ornaments: ORNAMENTS.doubleBar,
    fontFamily: 'Georgia, serif',
    fontSize: 14,
    alignment: 'center',
    decorative: true,
  },
  fleuronCenter: {
    name: 'fleuronCenter',
    lineThickness: 1,
    ornamentScale: 1.2,
    height: 36,
    spacing: 24,
    ornaments: ORNAMENTS.victorianOrnament,
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 14,
    alignment: 'center',
    decorative: false,
  },
  victorianDivider: {
    name: 'victorianDivider',
    lineThickness: 2,
    ornamentScale: 1.1,
    height: 40,
    spacing: 28,
    ornaments: ORNAMENTS.goldfish,
    fontFamily: 'Didot, Georgia, serif',
    fontSize: 18,
    alignment: 'center',
    decorative: false,
  },
  minimalEditorial: {
    name: 'minimalEditorial',
    lineThickness: 0.8,
    ornamentScale: 0.6,
    height: 16,
    spacing: 10,
    ornaments: ORNAMENTS.minimalDot,
    fontFamily: 'Helvetica Neue, sans-serif',
    fontSize: 12,
    alignment: 'center',
    decorative: true,
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Approximate text width without DOM measurement
 * Uses average character width of ~0.5 * fontSize
 */
function estimateTextWidth(text: string, fontSize: number): number {
  const charWidth = fontSize * 0.5
  return text.length * charWidth
}

/**
 * Calculate proportional spacing for ornaments
 * (Unused - kept for reference)
 */
// function calculateOrnamentSpacing(
//   totalWidth: number,
//   textWidth: number,
//   preset: RulePreset
// ): { leftSpace: number; rightSpace: number } {
//   const totalSpacing = totalWidth - textWidth
//   const leftSpace = totalSpacing / 2
//   const rightSpace = totalSpacing / 2
//   return { leftSpace, rightSpace }
// }

/**
 * Scale ornament paths by a given factor
 */
function scaleOrnament(path: string, scale: number, originX: number = 0): string {
  if (!path) return ''
  // Simple regex-based scaling: multiply all numeric values by scale
  return path.replace(/(-?\d+\.?\d*)/g, (match) => {
    const num = parseFloat(match)
    const scaled = (num - originX) * scale + originX
    return scaled.toFixed(2)
  })
}

/**
 * Translate path by x, y offset
 * (Unused - kept for reference)
 */
// function translatePath(path: string, x: number, y: number): string {
//   if (!path) return ''
//   return `translate(${x} ${y}) ${path}`
// }

// ============================================================================
// MAIN COMPONENT BUILDER
// ============================================================================

export function createOrnamentalRule(options: OrnamentalRuleOptions = {}): string {
  const preset = PRESETS[options.preset || 'newsGapHome']

  const width = options.width ?? 800
  const height = options.height ?? preset.height
  const padding = options.padding ?? 20
  const lineThickness = options.lineThickness ?? preset.lineThickness
  const ornamentScale = options.ornamentScale ?? preset.ornamentScale
  const fontFamily = options.fontFamily ?? preset.fontFamily
  const fontSize = options.fontSize ?? preset.fontSize
  const lineColor = options.lineColor ?? '#000000'
  const ornamentColor = options.ornamentColor ?? '#000000'
  const text = options.text ?? ''

  const contentWidth = width - 2 * padding
  const centerY = height / 2

  // Calculate text dimensions
  const textWidth = text ? estimateTextWidth(text, fontSize) : 0
  const lineSpacing = (contentWidth - textWidth) / 2

  // SVG container
  let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">\n`

  // === LEFT SECTION ===
  const leftOrnamentX = padding + lineSpacing / 2
  const leftLineStart = padding
  const leftLineEnd = padding + lineSpacing - preset.spacing

  // Left horizontal line
  svg += `  <line x1="${leftLineStart}" y1="${centerY}" x2="${leftLineEnd}" y2="${centerY}" stroke="${lineColor}" stroke-width="${lineThickness}" stroke-linecap="round" />\n`

  // Left ornament
  if (preset.ornaments.left) {
    const scaledOrnament = scaleOrnament(preset.ornaments.left, ornamentScale, 0)
    svg += `  <g transform="translate(${leftOrnamentX} ${centerY})">\n`
    svg += `    <path d="${scaledOrnament}" fill="${ornamentColor}" />\n`
    svg += `  </g>\n`
  }

  // === CENTER TEXT ===
  if (text) {
    const textX = width / 2
    svg += `  <text x="${textX}" y="${centerY + fontSize * 0.35}" text-anchor="middle" font-family="${fontFamily}" font-size="${fontSize}" fill="${lineColor}">\n`
    svg += `    ${text}\n`
    svg += `  </text>\n`
  }

  // === RIGHT SECTION ===
  const rightOrnamentX = width - padding - lineSpacing / 2
  const rightLineEnd = width - padding
  const rightLineStart = width - padding - lineSpacing + preset.spacing

  // Right horizontal line
  svg += `  <line x1="${rightLineStart}" y1="${centerY}" x2="${rightLineEnd}" y2="${centerY}" stroke="${lineColor}" stroke-width="${lineThickness}" stroke-linecap="round" />\n`

  // Right ornament
  if (preset.ornaments.right) {
    const scaledOrnament = scaleOrnament(preset.ornaments.right, ornamentScale, 0)
    svg += `  <g transform="translate(${rightOrnamentX} ${centerY})">\n`
    svg += `    <path d="${scaledOrnament}" fill="${ornamentColor}" />\n`
    svg += `  </g>\n`
  }

  svg += `</svg>`

  return svg
}

// ============================================================================
// REACT COMPONENT WRAPPER
// ============================================================================

export interface OrnamentalRuleComponentProps extends OrnamentalRuleOptions {
  className?: string
}

export const OrnamentalRuleComponent = React.forwardRef<
  HTMLDivElement,
  OrnamentalRuleComponentProps
>(({ className, ...options }, ref) => {
  const svg = React.useMemo(() => createOrnamentalRule(options), [options])

  return (
    <Box
      ref={ref}
      className={className}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        mb: 2.5,
        svg: {
          maxWidth: '100%',
          height: 'auto',
        },
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
})

OrnamentalRuleComponent.displayName = 'OrnamentalRuleComponent'

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
// Homepage title divider (primary)
const homeRule = createOrnamentalRule({
  text: 'NewsGap',
  width: 800,
  preset: 'newsGapHome',
})

// Section heading
const sectionRule = createOrnamentalRule({
  text: 'Latest Stories',
  width: 600,
  preset: 'victorianDivider',
  fontSize: 14,
})

// Article break (no text)
const articleBreak = createOrnamentalRule({
  width: 400,
  preset: 'scotchRule',
})

// Pure ornamental (minimal)
const minimal = createOrnamentalRule({
  preset: 'minimalEditorial',
})

// React component usage:
<OrnamentalRuleComponent text="NewsGap" preset="newsGapHome" width={800} />
*/
