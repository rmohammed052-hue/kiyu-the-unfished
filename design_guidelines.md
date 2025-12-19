# ModestGlow Design Guidelines

## Design Philosophy
Luxury fashion e-commerce inspired by Net-a-Porter and Farfetch, infused with Islamic cultural authenticity. Prioritize elegance through whitespace, refined typography, premium imagery, and serene user experiences.

---

## Typography

**Fonts:**
- Primary: Cormorant Garamond/Crimson Text (serif)
- Secondary: Quicksand/Raleway (sans-serif UI)
- Arabic: Noto Naskh Arabic

**Scale:**
```
Hero: 56-80px, font-light, tracking-wide
Sections: 36-48px, font-normal
Collections: 28-32px, font-medium
Products: 18-20px, font-normal
Body: 16px, leading-loose
Labels: 14px, uppercase, tracking-wider
Price: 20-24px, font-semibold
```

---

## Layout & Spacing

**Container:** max-w-7xl, py-20 to py-32  
**Spacing Units:** 4, 6, 8, 12, 16, 20, 24, 32  
**Grids:**
- Products: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (max 3 columns)
- Featured: `grid-cols-1 lg:grid-cols-2` with asymmetric sizing
- Editorial: Single column, max-w-3xl
- Gaps: gap-8 (desktop), gap-6 (mobile)

---

## Color Palette

**Primary:** Emerald (backgrounds, accents, CTAs)  
**Secondary:** Gold (borders, highlights, icons)  
**Base:** Cream/white (backgrounds), deep purple (footer)  
**Text:** High contrast meeting WCAG AA standards

---

## Components

### Navigation
**Desktop Header:** h-24, center logo, flanking links, right-aligned icons (search, wishlist, cart, account), sticky with shadow on scroll  
**Mobile:** Full-screen overlay menu, h-16 touch targets, bottom nav (4 icons)  
**Mega Menu:** Full-width dropdowns with category imagery

### Product Cards
**Standard:**
- Image: 4:5 aspect ratio, second image fade on hover
- Wishlist: Top-right heart, backdrop-blur-sm
- Quick view: Full-width bottom button on hover, backdrop-blur
- Text: Brand (text-sm uppercase), name (text-lg), price
- Spacing: mb-6 between image and text

**Hero:**
- Large format (60-100% width)
- Text overlay with gradient veil
- CTA: backdrop-blur-md, gold border

### Forms & Inputs
**Fields:** h-14, border-1 emerald tint, rounded-sm, labels above (text-sm uppercase, mb-3), emerald focus glow  
**Buttons:**
- Primary: h-14, px-12, emerald bg, gold border hover
- Secondary: Emerald outline, transparent, hover fill
- Icon: w-12 h-12, circular, soft shadow

### Product Detail
**Layout:** 60% sticky imagery / 40% scrollable content  
**Gallery:** Large main + thumbnail strip (w-20 h-24), click for lightbox  
**Content:** Brand → name → price → size guide → selector → CTA → expandable description  
**Trust:** Modesty guarantee, delivery promise, returns

### Shopping Bag
**Drawer:** Slide right, w-96 (desktop), full-width (mobile)  
**Items:** w-24 thumbnail, name, size, price, quantity adjuster  
**Footer:** Subtotal, full-width emerald CTA, "Complete your look" recommendations

### Category Showcases
**Tiles:** Asymmetric layouts (full/half width), h-80 lifestyle images, text overlay (category + count), gentle brightness hover, gap-8  
**Headers:** h-80 to h-96 banner, gradient overlay, large serif typography

### Editorial
**Story Cards:** Masonry layout, mixed landscape/portrait, overlay (title, author, read time)  
**Reviews:** Photo reviews featured, gold stars, verified badge, filter by size/rating/photos

### Homepage Sections
1. **Hero:** h-screen (desktop)/h-96 (mobile), single image, gradient veil bottom 40%, large headline, 2 CTAs, scroll indicator
2. **Featured Collections:** 3-column grid, h-80 images, overlaid text, subtle zoom hover
3. **New Arrivals:** 3-column product grid, gold divider, "View All" link
4. **Editorial:** Full-width cream bg, 60/40 split, py-32
5. **Values:** Centered max-w-4xl, 3 gold circular icons (w-16 h-16)
6. **Testimonials:** Carousel, w-20 h-20 circular photo, large italic quote
7. **Newsletter:** Emerald bg, centered inline form
8. **Footer:** 4-column grid, deep purple bg, cream text

---

## Images

**Requirements:**
- Hero: Full-length models, serene settings (gardens, Islamic architecture), soft natural lighting, subtle vignette
- Product: Full-length on light backgrounds (drape/flow), detail shots (texture), flat lays, lifestyle contexts
- Category: Lifestyle-focused, soft focus backgrounds, emerald-gold color harmony
- Editorial: Aspirational, behind-the-scenes craftsmanship, seasonal themes
- Community: Customer photos (permission-based, faces optional), modest team photos

---

## Responsive

**Breakpoints:**
- Mobile (<768px): Single column, bottom nav, full-width cards
- Tablet (768-1024px): 2-column grids, collapsible filters
- Desktop (>1024px): 3-column grids, persistent filters, sidebars

**Mobile:** Full-width images with swipe indicators, full-screen navigation, bottom sheet filters, scaled typography

---

## Accessibility

- Touch targets: min h-12 (48px)
- Labels: Always visible above inputs
- Contrast: WCAG AA compliant
- Focus: Emerald outline with glow
- Alt text: Descriptive for products and cultural context
- Keyboard: Logical tab order
- Screen readers: Clear labels for cultural references

---

## Animations

**Use (subtle only):**
- Image hover: opacity/brightness (300ms ease)
- Dropdowns: Fade + downward (200ms)
- Buttons: Background shift (150ms)
- Page transitions: Gentle fade
- Drawers: Slide-in (250ms ease-out)

**Avoid:** Parallax, scale transforms, bouncing, auto-play carousels

---

## Key Principles

✅ **Do:**
- Generous whitespace (py-20 minimum sections)
- Max 3-column product grids
- Cultural sensitivity in imagery
- Elegant serif headlines
- Gold accents sparingly
- User-controlled interactions

❌ **Don't:**
- Dense layouts or tight spacing
- 4+ column grids
- Playful/casual design elements
- Auto-advancing content
- Aggressive animations
- Faces without permission