# Article Content Placement Algorithm

## Overview

The new `ArticleContentWithLayout` component implements an intelligent zigzag layout algorithm for article content. This algorithm improves readability and visual engagement by placing images and text side-by-side with smart alternation.

## Algorithm Features

### 1. **Content Scaling (90% of Page Width)**
- All content (except section titles) is constrained to **90% of the available page width**
- This accounts for the expandable/collapsible sidebar in the layout
- Sidebar states:
  - **Expanded**: 288px width (ml-72)
  - **Collapsed**: 72px width (ml-18)

### 2. **Section Title Handling**
- Section titles (`<h2>`) remain **full-width**
- They create natural boundaries between content groups
- Figure position resets to "left" after each section

### 3. **Zigzag Layout Pattern**

#### Pattern Rules:
```
PPTTTTTTTTTTTTT   <- Figure (P) on LEFT, Text (T) wraps on RIGHT
PPTTTTTTTTTTTTT
PPTTTTTTTTTTTTT
TTTTTTTTTTTTTTT   <- Text continues below figure
TTTTTTTTTTTTTTT

TTTTTTTTTTTTPP   <- Next figure (P) on RIGHT, Text (T) wraps on LEFT
TTTTTTTTTTTTPP
TTTTTTTTTTTTPP
TTTTTTTTTTTTTTT   <- Text continues below figure
TTTTTTTTTTTTTTT
```

#### Implementation:
- Figures alternate between **left** and **right** positioning
- Position resets to "left" after each section
- Text automatically wraps alongside figures
- When text ends before figure ends, it flows to next row
- When figure ends, remaining text continues full-width

### 4. **Image Scaling for fullHD Displays**

#### Constraints:
- **Maximum width**: 600px (fits within 35% column on fullHD)
- **Maximum height**: 700px (fits within 1080p vertical viewport)
- **Aspect ratio**: Maintained via `object-contain`
- **Figure column width**: ~35% of 90% content width
- **Text column width**: ~65% of 90% content width

#### Image Dimensions:
- Responsive: Scales down on smaller screens
- Lazy loading: `loading="lazy"` attribute for performance
- Container: `h-fit` ensures proper height in grid

### 5. **CSS Grid Layout**

The component uses CSS Grid for precise control:

```css
/* Figure on LEFT */
grid-cols-[minmax(320px,35%)_1fr]
/* Figure on RIGHT */
grid-cols-[1fr_minmax(320px,35%)]

/* Grid settings */
items-start      /* Align items to top */
auto-rows-max    /* Each row only as tall as needed */
gap-6            /* Spacing between columns */
```

## File Structure Updated

### New Component
- **[ArticleContentWithLayout.tsx](src/components/article/ArticleContentWithLayout.tsx)**
  - Main component implementing the algorithm
  - Handles block grouping and positioning
  - Detects sidebar state for responsive behavior

### Modified Files
1. **[ArticleDetailPage.tsx](src/pages/ArticleDetailPage.tsx)**
   - Changed from `ArticleContentBlocks` to `ArticleContentWithLayout`
   - Uses new component for rendering article content

2. **[Sidebar.tsx](src/components/layout/Sidebar.tsx)**
   - Emits `sidebarToggle` event when toggled
   - Allows `ArticleContentWithLayout` to detect sidebar state

## Block Type Handling

### Section (Full-width, No alternation)
```tsx
<h2>1. Section Title</h2>
```
- Separate from zigzag layout
- Full-width rendering
- Creates boundary for figure position reset

### Paragraph (With optional glossary links)
```tsx
<p className="text-lg text-slate-300 leading-relaxed">
  {text with glossary tooltips}
</p>
```
- Text wraps next to figures
- Supports inline glossary tooltips
- Multiple paragraphs in single group

### Blockquote (With footer)
```tsx
<blockquote className="glass-panel ...">
  <p>{quote text}</p>
  <footer>{attribution}</footer>
</blockquote>
```
- Wrapped in glass-panel styling
- Position-aware (left/right of figure)

### List (Ordered with icons)
```tsx
<ul className="space-y-3">
  <li>
    <span className="material-symbols-outlined">check_circle</span>
    {item text}
  </li>
</ul>
```
- Check-circle icon for each item
- Wraps next to figures

### Figure (Image with caption)
```tsx
<figure className="rounded-xl ...">
  <img src={imageUrl} alt={alt} />
  {caption && <figcaption>{caption}</figcaption>}
</figure>
```
- Sticky positioning (if needed in future)
- Lazy loading for performance
- Responsive scaling for fullHD

## Responsive Behavior

### Sidebar Collapse Detection
The component monitors sidebar state through:
1. **Custom event**: `sidebarToggle` from Sidebar component
2. **DOM observation**: ResizeObserver monitors main element margin-left
3. **State update**: Triggers re-layout when sidebar changes

### Viewport Adaptation
- **Desktop (1920x1080)**: Full zigzag layout with side-by-side figures
- **Tablet/Narrow**: Grid adapts; figures may stack if needed (CSS handles)
- **Mobile**: Consider future responsive breakpoints

## Usage Example

### In ArticleDetailPage
```tsx
import { ArticleContentWithLayout } from '@/components/article/ArticleContentWithLayout'

// Instead of:
<ArticleContentBlocks blocks={contentBlocks} />

// Use:
<ArticleContentWithLayout blocks={contentBlocks} />
```

### Article Content Structure (JSON format)
```json
[
  {
    "type": "section",
    "number": "1",
    "title": "Introduction"
  },
  {
    "type": "paragraph",
    "segments": [
      { "type": "text", "value": "Opening paragraph..." }
    ]
  },
  {
    "type": "figure",
    "imageUrl": "https://...",
    "caption": "Figure description",
    "alt": "Alt text"
  },
  {
    "type": "paragraph",
    "segments": [
      { "type": "text", "value": "Text wraps next to figure..." }
    ]
  }
]
```

## Technical Details

### Grid Layout Behavior
- **`items-start`**: Items align to the top of their cells
- **`auto-rows-max`**: Rows size themselves based on contained content
- **`minmax(320px, 35%)`**: Figures take ~35% width, minimum 320px

### Spacing
- **Between sections**: `space-y-8` (large gap)
- **Before figure layout**: `mb-8` (separate content blocks)
- **In text columns**: `space-y-4` (paragraph spacing)
- **Grid gap**: `gap-6` (6 units between columns)

### Styling Integration
- Uses existing design tokens (colors, spacing)
- Inherits glass-panel, prose, and text utilities
- Material Design icons for captions and lists

## Future Enhancements

Possible improvements:
1. **Mobile responsiveness**: Stack figures on small screens
2. **Sticky positioning**: Make figures stick to viewport while scrolling
3. **Lightbox integration**: Click to expand images
4. **Video support**: Add video block type with same layout
5. **Custom styling**: Allow per-block CSS overrides

## Sidebar Event Handling

### Event Structure
```typescript
window.dispatchEvent(new CustomEvent('sidebarToggle', {
  detail: { collapsed: boolean }
}))
```

### Listener in ArticleContentWithLayout
```typescript
window.addEventListener('sidebarToggle', (e: CustomEvent) => {
  setSidebarCollapsed(e.detail.collapsed)
})
```

This allows the layout to adapt in real-time when users toggle the sidebar.

## CSS Classes Reference

| Class | Purpose |
|-------|---------|
| `max-w-[90%]` | Content width constraint |
| `grid` | Grid layout container |
| `grid-cols-[35%_65%]` | Figure-text column ratio |
| `items-start` | Top alignment in grid cells |
| `auto-rows-max` | Flexible row heights |
| `gap-6` | Column spacing |
| `space-y-4` | Vertical spacing within text |
| `max-w-[600px]` | Image max width |
| `max-h-[700px]` | Image max height |
| `h-fit` | Figure container height |

## Testing Checklist

- [ ] Figures alternate left/right
- [ ] Text wraps properly next to figures
- [ ] Content scales to 90% width
- [ ] Section titles remain full-width
- [ ] Images scale correctly on fullHD (1920x1080)
- [ ] Sidebar collapse/expand triggers layout update
- [ ] No overflow on smaller viewports
- [ ] Glossary tooltips work in text
- [ ] Figure captions display properly
- [ ] Blockquotes and lists position correctly

