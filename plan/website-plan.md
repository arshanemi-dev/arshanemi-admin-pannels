# Plan: Santhya Infotech Website — Next.js Rebuild (DianApps Pixel-Match)

## Context

Content source: https://www.santhyainfotech.com/ — SEO & Digital Marketing agency, Surat, Gujarat.
Design reference: https://dianapps.com/ — pixel-match this site exactly.
Language: Pure JavaScript (.jsx / .js) — no TypeScript.

---

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS v3
- Framer Motion
- Embla Carousel React
- Lucide React
- Inter font via next/font/google
- JavaScript only — all files .jsx / .js

---

## Design Tokens (tailwind.config.js)

### Colors
```
bg.primary:   #0a0a0a   page background
bg.secondary: #111111   section alternates
bg.card:      #161616   card surface
bg.hover:     #1a1a1a   card hover
border:       #262626   default border
border.light: #333333
text.primary: #ffffff
text.secondary: #a3a3a3
text.muted:   #6b7280
accent:       #4f46e5   CTA buttons
accent.hover: #4338ca
accent.light: #818cf8
gradient.from: #6366f1
gradient.to:   #06b6d4
```

### Spacing
```
Navbar height:     72px desktop / 64px mobile
Section padding-y: 96px desktop / 64px tablet / 48px mobile
Container:         max-w-7xl mx-auto px-6 lg:px-8
Card radius:       16px large / 12px small / 8px buttons
Button padding:    14px 28px primary / 12px 24px secondary
Card shadow:       0 0 0 1px #262626, 0 4px 24px rgba(0,0,0,0.4)
```

### Typography (clamp-based fluid)
```
display: clamp(2.5rem, 5vw, 4rem)   line-height 1.1  font-weight 700
h1:      clamp(2rem, 4vw, 3rem)     line-height 1.2  font-weight 700
h2:      clamp(1.75rem, 3vw, 2.25rem) line-height 1.25 font-weight 600
h3:      clamp(1.25rem, 2vw, 1.5rem)  line-height 1.35 font-weight 600
body:    1rem  line-height 1.6
small:   0.875rem line-height 1.5
```

### CSS Keyframes (globals.css)
```css
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes gradientPulse {
  0%, 100% { transform: scale(1) translate(0, 0); }
  50%       { transform: scale(1.1) translate(-2%, 2%); }
}
```

---

## Responsive Breakpoints (Mobile-First)

| Breakpoint | px   | Target |
|------------|------|--------|
| default    | 0    | Mobile portrait |
| sm         | 640  | Mobile landscape |
| md         | 768  | Tablet |
| lg         | 1024 | Laptop |
| xl         | 1280 | Desktop |
| 2xl        | 1536 | Large desktop |

Per-component responsive rules:

| Component        | Mobile        | md          | lg+                    |
|------------------|---------------|-------------|------------------------|
| Navbar           | Hamburger     | Hamburger   | Horizontal + dropdown  |
| Hero             | Stacked       | Side-by-side| Side-by-side + image   |
| Services grid    | 1 col         | 2 cols      | 3 cols / 4 cols (xl)   |
| Stats            | 2x2 grid      | 2x2         | 4 inline               |
| Industries       | 1 col         | 2 cols      | 3 cols                 |
| Process          | Vertical      | Vertical    | Horizontal 3-step      |
| Case studies     | 1 card        | 1-2         | 3 cards                |
| Footer           | Stacked       | 2 cols      | 4 cols                 |

---

## Project Structure

```
satyam-infotech/
├── app/
│   ├── layout.jsx
│   ├── page.jsx
│   ├── about/page.jsx
│   ├── services/
│   │   ├── page.jsx
│   │   └── [slug]/page.jsx
│   ├── industries/
│   │   ├── page.jsx
│   │   └── [slug]/page.jsx
│   ├── contact/page.jsx
│   └── blog/page.jsx
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx          sticky, transparent to solid on scroll, dropdowns
│   │   ├── MobileMenu.jsx      slide-in drawer
│   │   └── Footer.jsx          4-col, social icons, legal links
│   ├── sections/
│   │   ├── HeroSection.jsx     full-screen, animated gradient bg, 2 CTAs
│   │   ├── LogosTicker.jsx     pure CSS infinite scroll, fade edge masks
│   │   ├── StatsSection.jsx    count-up on IntersectionObserver
│   │   ├── ServicesGrid.jsx    icon cards, hover lift + border glow
│   │   ├── ProcessSection.jsx  3-step, connecting line, scroll-reveal
│   │   ├── IndustriesSection.jsx accordion with framer height animation
│   │   ├── CaseStudiesCarousel.jsx Embla, drag + auto-play
│   │   ├── TestimonialsCarousel.jsx Embla, auto-rotate 4s, star ratings
│   │   ├── TrustBadges.jsx     grayscale to color on hover
│   │   ├── FAQSection.jsx      AnimatePresence accordion
│   │   └── CTABanner.jsx       gradient bg, phone + email + WhatsApp
│   └── ui/
│       ├── Button.jsx          variant: primary | secondary | ghost
│       ├── Card.jsx            dark surface, border, shadow, hover
│       ├── Badge.jsx           pill label
│       ├── SectionHeading.jsx  centered title + subtitle + accent line
│       └── WhatsAppFloat.jsx   sticky bottom-right
│
├── data/
│   ├── services.js             { slug, title, icon, shortDesc, features[], category }
│   ├── industries.js           { slug, name, icon, description, benefits[] }
│   ├── testimonials.js         { name, company, role, rating, text, avatar }
│   ├── caseStudies.js          { title, industry, service, metrics[], image }
│   ├── stats.js                { label, value, suffix, icon }
│   ├── team.js                 { name, role, photo, linkedin }
│   ├── faqs.js                 { question, answer }
│   └── navigation.js           nav links and dropdown structure
│
├── hooks/
│   ├── useCountUp.js
│   ├── useInView.js
│   └── useScrollHeader.js
│
├── lib/
│   └── utils.js                cn(), slugify(), formatNumber()
│
├── public/images/
│   ├── logo.svg
│   ├── hero-bg.webp
│   ├── clients/
│   ├── team/
│   └── case-studies/
│
├── plan/
│   └── website-plan.md         this file
│
├── styles/
│   └── globals.css
│
├── CLAUDE.md
├── tailwind.config.js
└── next.config.js
```

---

## Homepage Sections (order matches dianapps.com)

1. HeroSection       "Rank Higher. Grow Faster." gradient headline, "Get Free Audit" + "View Services"
2. LogosTicker       partner/client logos infinite scroll
3. StatsSection      200+ Clients | 500+ Projects | 5+ Years | 98% Retention
4. ServicesGrid      Local SEO, eCommerce SEO, Link Building, Google Ads, Social Media, GMB, Shopify SEO, Content Writing
5. ProcessSection    Research & Audit → Strategy & Execution → Track & Scale
6. IndustriesSection Healthcare, Dental, Law, Real Estate, Hotels, Gyms, Salons
7. CaseStudiesCarousel 3 project cards with before/after metrics
8. TestimonialsCarousel client reviews, star ratings
9. TrustBadges       Google Partner, Clutch, certification badges
10. FAQSection       top 6 SEO FAQs
11. CTABanner        "Ready to Grow?" + phone + email + WhatsApp

---

## Framer Motion Patterns

Standard section reveal (apply to every section wrapper):
```jsx
<motion.div
  initial={{ opacity: 0, y: 32 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-80px' }}
  transition={{ duration: 0.6, ease: 'easeOut' }}
/>
```

Staggered card grid:
```jsx
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
```

Card hover:
```jsx
whileHover={{ y: -6, boxShadow: '0 0 0 1px #4f46e5, 0 8px 32px rgba(99,102,241,0.2)' }}
```

FAQ accordion:
```jsx
<AnimatePresence>
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  />
</AnimatePresence>
```

---

## Company Data (Santhya Infotech)

Founder & CEO:  Nand Kishor Yadav
SEO Manager:    Harshil Raval
Team:           Smit Mayani, Mahek Banvadiya, Dhruvi Satasiya
Address:        204 Nilkanth Darshan Building, Katargam, Surat, Gujarat 395004
Phone:          +91 9687176846 / +91 8866993213
Email:          info@santhyainfotech.com
Hours:          Mon-Sat 9 AM – 9 PM IST

---

## Implementation Order

1.  npx create-next-app@latest satyam-infotech --js --tailwind --app --no-src --no-ts --eslint
2.  npm install framer-motion embla-carousel-react lucide-react clsx tailwind-merge
3.  tailwind.config.js — dark tokens, font, keyframes
4.  styles/globals.css — base bg, font-smoothing, ticker + gradientPulse keyframes
5.  lib/utils.js — cn(), slugify(), formatNumber()
6.  hooks/ — useInView.js, useCountUp.js, useScrollHeader.js
7.  data/ — all 8 data files with Santhya Infotech content
8.  components/ui/ — Button, Card, Badge, SectionHeading, WhatsAppFloat
9.  components/layout/ — Header, MobileMenu, Footer
10. components/sections/ — all 11 homepage sections
11. app/layout.jsx — root layout
12. app/page.jsx — homepage
13. app/about/page.jsx
14. app/services/page.jsx + [slug]/page.jsx
15. app/industries/page.jsx + [slug]/page.jsx
16. app/contact/page.jsx
17. app/blog/page.jsx
18. CLAUDE.md — project guide

---

## Verification Checklist

- [ ] npm run dev — zero errors on all pages
- [ ] npm run build — builds successfully
- [ ] Hero gradient animation plays on load
- [ ] Logo ticker scrolls infinitely, pauses on hover, no visible seam
- [ ] Stats count up from 0 when entering viewport
- [ ] Service card hover: border glow + -6px lift
- [ ] Industry accordion: smooth height animation
- [ ] Case studies carousel: drag + auto-play + dots update
- [ ] Testimonials: auto-rotate 4s + prev/next works
- [ ] FAQ: AnimatePresence smooth expand/collapse
- [ ] Header: transparent at top, solid after 50px scroll
- [ ] Mobile hamburger: opens drawer, closes on link click
- [ ] WhatsApp float on all pages, bottom-right
- [ ] Contact form: all fields + submit feedback
- [ ] Fully responsive: tested at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll at any breakpoint
- [ ] Dark theme consistent — no white flash on load
