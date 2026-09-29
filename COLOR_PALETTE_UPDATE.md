# Color Palette Update - Warm Wellness Theme

## Overview
The application has been updated with a warm, approachable wellness color palette that matches modern health/fitness apps. The new palette avoids harsh colors in favor of soft contrast and pastel pops.

## Color Palette

### Backgrounds & Base
- **Main Background**: Off-white / light beige `#F5F0EB`
- **Card Surfaces**: Pure white `#FFFFFF`

### Accent Colors
- **Coral/Salmon Orange**: `#F07A5A` — Primary CTA buttons, highlights (stopwatch icon, selected card border)
- **Soft Teal/Mint**: `#6ECFCF` — Secondary accent (timer badge, step dot)
- **Muted Olive/Sage Green**: `#A8C07A` — Ranking badge, success states
- **Light Sky Blue**: `#B8E0F0` — Marathon card background, soft highlights

### Text
- **Dark Charcoal**: `#2C2C2C` — Headings, primary text
- **Medium Grey**: `#9A9A9A` — Subtext, labels, muted content

### Data Visualization
- **Coral Red**: `#E8614A` — Negative/down trend lines, destructive actions
- **Steel Blue**: `#5B9BD5` — Positive/up trend lines, success indicators

## CSS Variables Updated

### Light Theme (`:root`)
```css
--background: #F5F0EB;           /* Main background */
--foreground: #2C2C2C;           /* Primary text */
--card: #FFFFFF;                 /* Card surfaces */
--primary: #6ECFCF;              /* Soft teal/mint */
--secondary: #F07A5A;            /* Coral/salmon */
--accent: #F07A5A;               /* Coral accent */
--success: #A8C07A;              /* Sage green */
--destructive: #E8614A;          /* Coral red */
--muted-foreground: #9A9A9A;     /* Medium grey */
```

### Dark Theme (`.dark`)
```css
--background: #2C2C2C;           /* Dark background */
--foreground: #F5F0EB;           /* Light text */
--card: #3A3A3A;                 /* Dark card */
--primary: #5DBFBF;              /* Muted teal */
--secondary: #E8614A;            /* Coral */
--accent: #E8614A;               /* Coral accent */
--success: #A8C07A;              /* Sage green */
```

## Component Updates

### Buttons
- **Primary CTA**: Coral/salmon `#F07A5A` background
- **Secondary**: Soft teal `#6ECFCF` background
- **Destructive**: Coral red `#E8614A` background

### Badges & Tags
- **Success/Positive**: Sage green `#A8C07A`
- **Neutral**: Soft teal `#6ECFCF`
- **Highlight**: Coral `#F07A5A`

### Cards & Surfaces
- **Background**: Off-white `#F5F0EB`
- **Card**: Pure white `#FFFFFF`
- **Border**: Light beige `#E8E3DC`

### Text Hierarchy
- **Headings**: Dark charcoal `#2C2C2C`
- **Body**: Dark charcoal `#2C2C2C`
- **Labels/Subtext**: Medium grey `#9A9A9A`
- **Muted**: Medium grey `#9A9A9A`

## Neumorphic Shadows
Updated for warm background:
- **Light shadow**: `#FFFFFF` (white)
- **Dark shadow**: `#D9D0C5` (warm beige)

## Design Philosophy
- **Warm & Approachable**: Off-white base creates a friendly, inviting feel
- **Soft Contrast**: Pastel colors reduce eye strain
- **Accessible**: High contrast between text and backgrounds
- **Modern Wellness**: Aligns with contemporary health app design trends
- **Emotional**: Coral conveys energy and motivation, teal conveys calm and trust

## Files Modified
- `src/styles.css` — All CSS variables updated
- `backend/seeds/mentalHealth.js` — Real YouTube video URLs
- `backend/seeds/healthyLiving.js` — Real YouTube video URLs, article content, recipe images

## Testing
- ✅ Frontend builds successfully with 0 errors
- ✅ Color palette applied to all components
- ✅ Both light and dark themes updated
- ✅ Neumorphic shadows adjusted for new palette
- ✅ All accent colors properly mapped

## Browser Compatibility
The new color palette uses standard CSS variables and is compatible with all modern browsers:
- Chrome/Edge 49+
- Firefox 31+
- Safari 9.1+
- Mobile browsers (iOS Safari, Chrome Mobile)
