---
name: Precision Industrial Modern
colors:
  surface: '#fbf9f3'
  surface-dim: '#dbdad4'
  surface-bright: '#fbf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4ee'
  surface-container: '#efeee8'
  surface-container-high: '#e9e8e2'
  surface-container-highest: '#e3e3dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#434655'
  inverse-surface: '#30312d'
  inverse-on-surface: '#f2f1eb'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#00501f'
  on-tertiary: '#ffffff'
  tertiary-container: '#006b2c'
  on-tertiary-container: '#71ee8a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#fbf9f3'
  on-background: '#1b1c19'
  surface-variant: '#e3e3dd'
typography:
  display:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-default:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-medium:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-default:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  caption:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a calm, orderly, and highly legible visual environment engineered for high-frequency daily operations. Built specifically for field managers, facility operators, and compliance leads performing mission-critical equipment inspections, the interface minimizes visual fatigue while reinforcing confidence and precision.

The style unites a modern industrial aesthetic with understated luxury: crisp tabular structure, high-contrast typographic hierarchy, tactile off-white backgrounds, and pristine white cards. The visual tone avoids noisy gradients and synthetic distractions in favor of deliberate structural clarity, tactile borders, and micro-delight in verification states.

Brand markers center around the wordmark in a bold, slightly tracked sans-serif paired with a compact, rounded-square cobalt glyph housing a verified checkmark. The interface evokes reassurance, audit-ready compliance, and effortless mechanical efficiency.

## Colors

The palette is anchored by warm tactile neutrals and sharp functional accents, calibrated for long-session desktop review.

### Neutral Canvas & Textures
- **Canvas Base**: `#F3F2EC` provides an organic, glare-free working plane that relieves eye strain compared to stark white.
- **Surface Card**: `#FFFFFF` creates distinct focal regions with crisp boundary delineation.
- **Surface Secondary / Recessed**: `#F1EFE8` grounds read-only fields, segmented track containers, and table headers.

### Typography & Monochrome Contrast
- **Text Primary**: `#1A1A18` provides authoritative legibility across headers, active data points, and operational values.
- **Text Secondary**: `#6B6963` establishes contextual hierarchy for structural labels, hints, and standard metrics.
- **Text Muted**: `#9C9A92` is reserved for timestamps, disabled placeholders, and subtle micro-captions.

### Accents & Verification Feedback
- **Brand Primary Accent**: `#1D4ED8` and active trigger `#2563EB` serve as high-visibility operational touchpoints.
- **Active Tint**: `#EFF6FF` background with `#1D4ED8` text for selected rows and list states.
- **Sub-heading Ribbons**: `#DBEAFE` background paired with `#1E40AF` text for inspection section demarcations.
- **Status Tiers**:
  - **Pass / OK**: Background `#DCFCE7`, border/text `#166534`, dot `#16A34A` / `#22C55E`.
  - **Fail / NOT OK**: Background `#FEE2E2`, border/text `#991B1B`, dot `#DC2626`.
  - **Warning / Action Required**: Background `#FEF3C7`, border/text `#92400E`.
  - **Inactive / N/A**: Background `#F1EFE8`, text `#6B6963`.

## Typography

Typography pairs `Manrope` for structured, authoritative geometric headers with `Hanken Grotesk` for data-dense, tabular inspection readability.

- **Headlines (`Manrope`)**: Geometric construction gives title blocks, inspection summaries, and equipment logs clear authority. Tight tracking (-0.015em to -0.02em) keeps headings unified across complex forms.
- **Body & Tabular Data (`Hanken Grotesk`)**: Ensures exceptional clarity at 13px and 14px sizes. Standard text defaults to 14px on a 20px baseline to maintain comfortable vertical cadence.
- **Labels & Micro-Labels**: Form labels adopt a distinct 13px medium weight (`#6B6963`), while table headers and metadata chips leverage 11px uppercase styling with `0.06em` letter spacing for fast horizontal scanning.

## Layout & Spacing

The layout is built around a fixed-fluid hybrid grid optimized for desktop displays (1440px target). The primary canvas centers within a max-width container of 1360px with standard 40px (`2.5rem`) outer canvas margins and 24px (`1.5rem`) column gutters.

- **Vertical Cadence**: Built on an 8px base rhythm. Micro alignments (such as pill paddings and sub-labels) reference a 4px sub-grid.
- **Section Margins**: Major equipment modules and inspection blocks are separated by 32px (`space-xl`).
- **Internal Card Enclosures**: Card modules feature a mandatory 24px (`space-lg`) internal breathing margin, preventing dense data fields from crowding panel borders.
- **Adaptive Compaction**: When screens compress below 1200px, column gutters reduce to 16px (`1rem`), while inner card padding holds at 20px to protect form alignment.

## Elevation & Depth

Visual hierarchy relies on physical boundary contrast, layered tone shifts, and hairline borders rather than heavy, synthetic dropshadows.

- **Surface Level 0 (Canvas)**: Background tone `#F3F2EC`. Purely non-elevated working surface.
- **Surface Level 1 (Card Panels)**: `#FFFFFF` resting on `#F3F2EC`. Outlined with a high-precision hairline border (`0.5px solid rgba(0, 0, 0, 0.12)`). Ambient elevation is whisper-subtle: `0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)`.
- **Surface Level 2 (Floating Popovers & Modals)**: Lifted cards and dropdown pickers feature an ambient soft spread: `0 8px 24px rgba(26, 26, 24, 0.08)` paired with the standard `0.5px solid rgba(0, 0, 0, 0.12)` boundary.
- **Recessed Insets**: Interactive tabs and read-only form backgrounds (`#F1EFE8`) simulate subtle inward depth through contrast rather than inner shadows.

## Shapes

The design system uses a calibrated rounded geometry (Level 2) that softens strict technical grids while preserving functional industrial utility.

- **Primary Cards & Containers**: Standardized at 16px (`1rem`) border radius, creating clean geometric modules.
- **Interactive Controls (Inputs, Buttons, Dropdowns)**: Standardized at 12px (`0.75rem`) border radius, balancing touch target comfort with visual precision.
- **Pills, Status Badges, & Progress Dots**: Fully rounded (`9999px`) pill geometry to clearly differentiate classification labels from clickable input buttons.
- **Step Indicators**: Circular 8px nodes representing sequential inspection phases.

## Components

### Buttons
- **Primary**: Background `#2563EB`, text `#FFFFFF`, radius 12px, vertical padding 10px, horizontal padding 18px, font 14px medium. Hover state shifts to `#1D4ED8`. Active state triggers `transform: scale(0.985)`.
- **Secondary**: Background `#FFFFFF`, text `#1A1A18`, radius 12px, border `0.5px solid rgba(0, 0, 0, 0.20)`. Hover shifts background to `#F9F8F5`.
- **Danger**: Background `#FEF2F2`, border `0.5px solid #FECACA`, text `#DC2626`, radius 12px. Hover shifts background to `#FEE2E2`.

### Input Fields & Controls
- **Standard Input**: Background `#FFFFFF`, text `#1A1A18`, 14px body font, height 40px, padding 0 14px, radius 12px, border `0.5px solid rgba(0, 0, 0, 0.25)`.
- **Focus State**: Border color snaps to `#3B82F6` accompanied by a crisp `0 0 0 2px rgba(59, 130, 246, 0.25)` blue glow.
- **Read-Only / Disabled**: Background filled with `#F1EFE8`, border `0.5px solid rgba(0, 0, 0, 0.12)`, text `#6B6963`.
- **Error State**: Border `#EF4444`. Below-field validation caption renders in 11px `#EF4444` with a 4px gap.
- **Form Labels**: 13px medium `#6B6963`. Required fields append a red asterisk (`#EF4444`) separated by 2px horizontal spacing.

### Status Badges & Evaluation Chips
- **Inspection Badges**: Pill-shaped (`rounded-full`), height 22px, padding 2px 10px, typography 11px uppercase weight 600.
  - *OK*: `#DCFCE7` background, `#166534` text.
  - *NOT OK*: `#FEE2E2` background, `#991B1B` text.
  - *Warning / Attention*: `#FEF3C7` background, `#92400E` text.
  - *Active Accent*: `#EFF6FF` background, `#1D4ED8` text.
  - *Neutral / N/A*: `#F1EFE8` background, `#6B6963` text.

### Inspection Step Trackers
- Linear progression bar composed of 8px circular dots connected by a 2px track:
  - *Active Step*: `#2563EB` with an ambient 2px outer blue ring.
  - *Completed Step*: `#22C55E`.
  - *Upcoming Step*: `rgba(0, 0, 0, 0.15)`.

### Cards & Grouping Bands
- **White Card**: Surface `#FFFFFF`, radius 16px, border `0.5px solid rgba(0, 0, 0, 0.12)`, padding 24px.
- **Inspection Section Ribbon**: Background `#DBEAFE`, text `#1E40AF`, radius 8px, padding 8px 14px, font 13px weight 600.

### Tables & Data Grids
- **Header Row**: Background `#F1EFE8`, height 36px, radius 8px (top corners), text 11px uppercase weight 600 color `#6B6963`.
- **Data Rows**: Hairline horizontal dividers `0.5px solid rgba(0, 0, 0, 0.08)`. Hover row background `#FAF9F5`. Active / selected row switches to `#EFF6FF` with `#1D4ED8` primary identifiers.

### Tabs & View Switchers
- Recessed capsule bar on `#F1EFE8` background, 4px internal padding, radius 10px.
- Active tab pill: `#FFFFFF` card surface, radius 8px, text `#1D4ED8` weight 500, with subtle ambient shadow (`0 1px 2px rgba(0, 0, 0, 0.06)`). Inactive tabs: text `#6B6963`.