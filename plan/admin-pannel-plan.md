# Admin Panel — Arshanemi CMS

## Context
The site has 20 static JavaScript data files (`data/*.js`). The goal is to:
1. Migrate all data to **Vercel Blob JSON storage** (persistent, Vercel-hosted)
2. Build a **light-themed admin panel** at `/admin` protected by ENV-based JWT login
3. Create **API routes** for public reads (ISR-cached) and admin CRUD
4. Update **frontend** pages to fetch from `lib/db.js` (Vercel Blob) instead of static imports
5. Handle **image upload/update/delete** via Vercel Blob (already configured in `.env`)

---

## New Packages
```bash
npm install @vercel/blob jose nanoid
```
- `@vercel/blob` — Blob SDK (put, del, list, head)
- `jose` — JWT sign/verify (no Node crypto dep, works on Edge)
- `nanoid` — short unique IDs for new records

---

## ENV Variables to Add (`.env`)
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@1234
JWT_SECRET=<generate-32-char-random-string>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Existing: `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` already present.

---

## Data Storage Design

| Blob Key Pattern | Usage |
|---|---|
| `arshanemi-data/[collection].json` | All collection/singleton JSON |
| `arshanemi-images/[collection]/[nanoid].[ext]` | Uploaded images/logos |

**List collections** (array of items, each with `id: nanoid()`):
`services`, `service-content`, `industries`, `blogs`, `blog-categories`, `case-studies`, `testimonials`, `team`, `faqs`, `partners`, `careers`, `seo-packages`

**Singleton collections** (plain objects, edit-only):
`company`, `stats`, `badges`, `hero`, `process`, `about`, `life-at-arshanemi`, `contact`, `navigation`

---

## Files to Create

### 1. Lib Layer — `lib/`

**`lib/db.js`** — Vercel Blob JSON CRUD
```js
// Exports:
getCollection(name)           // → array[]
getItem(name, id)             // → item | null
createItem(name, data)        // nanoid id, put blob, return item
updateItem(name, id, data)    // find+replace in array, put blob
deleteItem(name, id)          // filter out, put blob
getSingleton(name)            // → object
updateSingleton(name, data)   // put blob
seedCollection(name, array)   // initial migration only
```
Blob key: `arshanemi-data/${name}.json`

**`lib/auth.js`** — JWT utilities
```js
signToken(payload)            // → JWT string (7d expiry, HS256)
verifyToken(token)            // → payload | null
getAdminFromRequest(req)      // reads 'admin-token' cookie, verifies
```

**`lib/upload.js`** — Vercel Blob image helpers
```js
uploadImage(file, collection) // put to arshanemi-images/[col]/[id].[ext], return url
deleteImage(url)              // del from Vercel Blob by URL
```

### 2. Middleware — `middleware.js`
Protects `/admin/*` except `/admin/login`.
Reads `admin-token` cookie → verifies JWT → redirect to `/admin/login` if invalid.
Also adds `X-Admin-User` header for downstream use.

### 3. Seed Script — `scripts/seed.js`
Node script (`node scripts/seed.js`) that:
1. Imports each `data/*.js` file
2. Adds `id: nanoid()` to each item in list collections
3. Uploads as JSON to Vercel Blob (`arshanemi-data/[name].json`)
Run once after setup.

**Image fields audit — what needs special handling during seed:**

| Collection | Field | Current state | Seed action |
|---|---|---|---|
| `team` | `photo` | `/images/team/*.jpg` — **folders empty, images missing** | Set to `null` during seed; admin uploads via Vercel Blob |
| `testimonials` | `avatar` | `/images/team/avatar-*.jpg` — **folders empty, images missing** | Set to `null` during seed; admin uploads via Vercel Blob |
| `case-studies` | `image` | `/images/case-studies/*.jpg` — **folders empty, images missing** | Set to `null` during seed; admin uploads via Vercel Blob |
| `partners` | `url` | External WordPress CDN URLs (working) | **Fetch each URL and re-upload to Vercel Blob** during seed (avoids WordPress CDN dependency) |
| `blogs` | `image` | `null` on most posts; some have external URLs | Keep as-is during seed; admin sets via Vercel Blob when editing |
| `blogs content[].img` | `src` | External URLs in rare img blocks | Keep as-is; admin uses ImageBlockEditor in BlogBlockEditor for new uploads |

**Partners re-upload in seed script:**
```js
import { put } from '@vercel/blob'

async function reuploadPartnerLogos(partners) {
  return Promise.all(partners.map(async (p) => {
    const res = await fetch(p.url)
    const buffer = await res.arrayBuffer()
    const ext = p.url.split('.').pop().split('?')[0]
    const blob = await put(`arshanemi-images/partners/${nanoid()}.${ext}`, buffer, {
      access: 'public', contentType: res.headers.get('content-type') || 'image/png'
    })
    return { ...p, id: nanoid(), url: blob.url }
  }))
}
```

**`next.config.js` update required** — add Vercel Blob hostname so `next/image` can load Blob URLs:
```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    { protocol: 'https', hostname: 'www.santhyainfotech.com' }, // keep for existing blog images
  ]
}
```

### 4. API Routes — `app/api/`

```
auth/
  login/route.js      POST: validate ENV creds, sign JWT, set httpOnly cookie (7d)
  logout/route.js     POST: clear cookie
  me/route.js         GET: verify cookie → return { username }

upload/route.js
  POST: multipart file → uploadImage() → return { url }
  DELETE: { url } body → deleteImage(url)

revalidate/route.js
  POST: { tags: ['services'] } → revalidateTag() — called by admin saves

# Public read (ISR tagged by collection)
data/[collection]/route.js
  GET: getCollection() with next: { tags: [collection], revalidate: 3600 }
data/[collection]/[id]/route.js
  GET: getItem() with same caching

# Admin CRUD (auth-checked server-side)
admin/[collection]/route.js
  GET: getCollection()           (list)
  POST: createItem(body)         (create)
admin/[collection]/[id]/route.js
  GET: getItem()
  PUT: updateItem(id, body)      + revalidateTag
  DELETE: deleteItem(id)         + deleteImage(old url) + revalidateTag
```

### 5. Admin UI Components — `components/admin/`

| File | Purpose |
|---|---|
| `Sidebar.jsx` | Fixed left sidebar, indigo bg, grouped nav links, active highlight |
| `Topbar.jsx` | White header: page title, user chip, logout button |
| `DataTable.jsx` | Search input + sortable table + pagination + Edit/Delete row actions |
| `FormField.jsx` | Label + input/textarea/select/number/toggle with error display |
| `ImageUpload.jsx` | Drop zone → POST /api/upload → preview → stores URL in form state; on remove → DELETE /api/upload. Must handle three states: (1) `null` — shows empty drop zone, (2) existing Vercel Blob URL — shows preview + replace/remove, (3) existing non-Blob URL (e.g. partner logos after migration) — shows preview, replace triggers re-upload |
| `BlockEditor.jsx` | Generic block editor: `p`, `h2`, `h3`, `ul`, `ol`, `callout` — used by services, about, etc. |
| `BlogBlockEditor.jsx` | Full blog content editor: all 11 block types (`p`, `h2`–`h4`, `ul`, `ol`, `blockquote`, `hr`, `code`, `img`, `table`, `interlink`, `faq`) with drag-reorder, inline HTML helpers, per-block toolbar |
| `IconPicker.jsx` | Text input + dropdown of filtered Lucide icon names |
| `Toast.jsx` | Global toast context + fixed bottom-right toast stack |
| `ConfirmDialog.jsx` | Modal: "Delete [item]? This cannot be undone." |

### 6. Admin Pages — `app/admin/`

**`layout.js`** — Admin shell (Server Component)
- Reads `admin-token` cookie; if missing/invalid → redirect `/admin/login`
- Renders `<Sidebar>` + `<Topbar>` + `{children}`
- Skip auth check for `/admin/login` (handled by middleware too)

**`login/page.js`** — Client Component
- Centered card: logo + username/password fields + submit
- POST `/api/auth/login` → on success navigate `/admin`

**`page.js`** — Dashboard (Client Component)
- Stat cards: Services (16), Industries (9), Blogs (10), Case Studies (8), Team (5), Testimonials (6)
- Quick-access buttons to each section

**Full CRUD sections** (each has `page.js` list + `new/page.js` + `[id]/page.js` edit):

| Section | Image field | Current image state | Special |
|---|---|---|---|
| `services/` | None | — | Icon picker (Lucide name), features[] array builder |
| `industries/` | None | — | Icon picker, benefits[] + services[] refs |
| `blogs/` | `image` (featured) | `null` on most posts | Full BlogEditor + BlogBlockEditor; inline `img` blocks via ImageBlockEditor |
| `blog-categories/` | None | — | slug, name, id (numeric), thumbnailBg CSS class |
| `case-studies/` | `image` | **Null after seed** (local files missing) | metrics[] builder, testimonial sub-form; admin must upload image |
| `team/` | `photo` | **Null after seed** (local files missing) | Admin must upload photo to Vercel Blob |
| `testimonials/` | `avatar` | **Null after seed** (local files missing) | Star rating selector; avatar optional — graceful initials fallback in UI |
| `partners/` | `url` | **Re-uploaded to Vercel Blob during seed** | No further change needed unless replacing a logo |
| `faqs/` | None | — | question + answer |
| `seo-packages/` | None | — | features[] builder, teaserFeatures[] |
| `careers/` | None | — | openings tab + perks tab |

**Singleton edit pages** (just a form, no list/create/delete):

| Page | Edits |
|---|---|
| `company/page.js` | 6 constants (email, phones, address, hours, WhatsApp) |
| `stats/page.js` | 4 stats: value, suffix, label, icon, description |
| `badges/page.js` | 6 trust badges: icon, label, sub |
| `hero/page.js` | heroBullets[] + heroMetrics[] |
| `process/page.js` | 3 processSteps: number, icon, title, description, tags[] |
| `about/page.js` | aboutValues, aboutServices, whyUs, aboutStats |
| `life-at-arshanemi/page.js` | companyValues[] + milestones[] |
| `contact/page.js` | contactInfo[], contactServices[], contactBudgets[] |
| `navigation/page.js` | navLinks, footerLinks, socialLinks |
| `service-content/page.js` | List of slugs → click → edit hero/stats/process/whyUs/faqs |

---

## Blog Management — Deep Dive

### Blog Data Schema

Each blog document stored in `arshanemi-data/blogs.json`:

```js
{
  id: 'nanoid()',          // string — replaces numeric WP id after migration
  slug: 'earned-media',   // URL-safe string, must be unique across all blogs
  title: 'Earned Media Explained...',
  excerpt: 'Short summary shown in cards and OG description (≤160 chars)',
  date: 'Jun 12, 2026',   // human-readable, e.g. "Jun 12, 2026"
  dateISO: '2026-06-12T09:27:23',  // ISO 8601 — used for OG publishedTime, sorting
  readTime: '12 min',     // e.g. "7 min", "12 min"
  category: {
    slug: 'social-media',
    name: 'Social Media',
    id: 7                  // numeric category id (kept for reference; use slug in logic)
  },
  image: null,            // null OR Vercel Blob URL for featured image
  author: 'Jiya Pansuriya',
  status: 'published',    // 'published' | 'draft'  — NEW field for admin workflow
  content: [ /* array of content blocks — see below */ ]
}
```

**Category document** stored in `arshanemi-data/blog-categories.json`:
```js
{
  id: 7,                  // keep numeric id from WordPress for backwards compat
  slug: 'social-media',
  name: 'Social Media',
  thumbnailBg: 'bg-gradient-to-br from-pink-900/60 to-rose-800/40'  // used in BlogGrid cards with no image
}
```

---

### Content Block Types (full spec — matches ContentRenderer.jsx)

| type | Required fields | Notes |
|---|---|---|
| `p` | `html` (string) | Inline HTML allowed: `<strong>`, `<em>`, `<a>`, `<code>`, `<br>` |
| `h2` | `id` (slug), `text` | Auto-generate id from text via slugify() |
| `h3` | `id` (slug), `text` | Same |
| `h4` | `id` (slug), `text` | Same |
| `ul` | `items` (string[]) | Each item is an HTML string (inline bold/links OK) |
| `ol` | `items` (string[]) | Same |
| `blockquote` | `text` | Plain text; rendered inside `<blockquote><p>` |
| `hr` | — | Divider; no extra fields |
| `code` | `code` (string), `lang?` (string) | `lang` → CSS class `language-{lang}` |
| `img` | `src`, `alt`, `caption?` | src = Vercel Blob URL or external URL |
| `table` | `rows` (string[][]) | First row = header. Each cell is a plain string |
| `interlink` | `label?`, `links` | label defaults to "Read Also". links = `[{href, text}]` |
| `faq` | `items` | items = `[{q: string, a: string}]` — rendered as accordion |

---

### New Lib File — `lib/blog.js`

Extract blog-specific query helpers from `data/blogs.js` into `lib/blog.js` so the frontend never imports static data again:

```js
// lib/blog.js
import { getCollection } from '@/lib/db'

export async function getBlogBySlug(slug) {
  const blogs = await getCollection('blogs')
  return blogs.find((b) => b.slug === slug && b.status !== 'draft') ?? null
}

export async function getRelatedBlogs(currentSlug, limit = 3) {
  const all = await getCollection('blogs')
  const current = all.find((b) => b.slug === currentSlug)
  if (!current) return []
  return all
    .filter((b) => b.slug !== currentSlug && b.status !== 'draft' &&
                   b.category?.slug === current.category?.slug)
    .slice(0, limit)
}

export async function getPublishedBlogs() {
  const blogs = await getCollection('blogs')
  return blogs
    .filter((b) => b.status !== 'draft')
    .sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO))
}

export function generateBlogSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function estimateReadTime(content) {
  const wordCount = content
    .map((b) => {
      if (b.html) return b.html.replace(/<[^>]+>/g, '')
      if (b.text) return b.text
      if (b.items) return b.items.join(' ').replace(/<[^>]+>/g, '')
      return ''
    })
    .join(' ')
    .split(/\s+/).length
  return `${Math.max(1, Math.ceil(wordCount / 200))} min`
}
```

---

### Admin Blog Pages — `app/admin/blogs/`

**`page.js` — Blog List**

Columns in DataTable:
| Column | Source | Notes |
|---|---|---|
| Title | `post.title` | Truncated to 60 chars |
| Category | `post.category.name` | Color badge matching category |
| Author | `post.author` | Plain text |
| Status | `post.status` | Green chip = published, Yellow = draft |
| Date | `post.date` | Formatted |
| Actions | — | Edit / Delete buttons |

- Default sort: `dateISO` descending (newest first)
- Search filters: title, category slug, author, status
- Bulk action: "Publish selected" / "Move to Draft" (checkbox selection)

**`new/page.js` — Create Blog Post**

Split into two panels:

*Left panel (8/12 columns) — Content Editor:*
1. Title field → onChange: auto-fills Slug field (via `generateBlogSlug`) if slug is empty
2. Slug field — editable; shows red border if duplicate detected (client-side check against full list)
3. Excerpt textarea (max 160 chars with character counter)
4. **BlogBlockEditor** — full block editor (see below)

*Right panel (4/12 columns) — Metadata sidebar:*
- Status toggle: Draft / Published
- Category dropdown (loaded from `blog-categories` collection)
- Author text field
- Date input (type="date") — defaults to today; stored as both `date` (formatted) and `dateISO`
- Read Time — auto-calculated via `estimateReadTime(content)` but manually overridable
- Featured Image — `ImageUpload` component → Vercel Blob URL stored in `image` field
- SEO Preview card — live preview of Google snippet (title 60 char cap, description 160 char)

Action bar (sticky bottom):
- "Save Draft" button (sets `status: 'draft'`, POSTs/PUTs, shows toast)
- "Publish" button (sets `status: 'published'`, POSTs/PUTs, revalidates `blogs` tag)
- "Preview" link — opens `/blog/[slug]` in new tab (only works if slug exists in DB)

**`[id]/page.js` — Edit Blog Post**

- Same layout as new/page.js
- On load: GET `/api/admin/blogs/[id]` → hydrate all fields
- "Publish" button calls PUT `/api/admin/blogs/[id]`
- On successful PUT: revalidates ISR tags `blogs` and the individual slug
- "Delete" button: shows `ConfirmDialog` → DELETE `/api/admin/blogs/[id]` → also deletes `post.image` from Vercel Blob if set → redirects to list

---

### Admin Blog Categories — `app/admin/blog-categories/`

**`page.js` — Categories List + Inline Create**

Simple table with inline add-row at the bottom:

| Column | Field |
|---|---|
| Name | Editable text |
| Slug | Auto-generated from name, also editable |
| ID | Numeric (for WordPress compat), auto-incremented |
| Thumbnail Bg | Tailwind gradient CSS string, text input |
| Actions | Delete |

- No separate `/new` page — inline form at bottom of table
- On delete: warn if any blog post references this category slug

---

### BlogBlockEditor Component — `components/admin/BlogBlockEditor.jsx`

This is the most complex admin component. It replaces the generic `BlockEditor.jsx` for blog posts specifically.

**Architecture:**
```
BlogBlockEditor
  ├── BlockToolbar       — "+ Add Block" dropdown with all 11 types
  ├── BlockList          — ordered list of blocks with drag handles
  │   └── BlockItem[n]   — renders the correct editor for each block type
  │       ├── ParagraphEditor    — textarea with inline HTML helpers (bold, link, code)
  │       ├── HeadingEditor      — type select (h2/h3/h4) + text input + auto-id
  │       ├── ListEditor         — type select (ul/ol) + dynamic item rows
  │       ├── BlockquoteEditor   — single textarea
  │       ├── CodeEditor         — textarea + language selector (js/ts/bash/python/html/css)
  │       ├── ImageBlockEditor   — uses ImageUpload component + alt + caption fields
  │       ├── TableEditor        — row/col grid; first row = header
  │       ├── InterlinkEditor    — label field + dynamic link rows [{href, text}]
  │       └── FaqBlockEditor     — dynamic Q&A pairs
  └── BlockPreview        — live rendered preview toggle (renders ContentRenderer)
```

**Per-block toolbar actions:** Move Up ↑, Move Down ↓, Duplicate, Delete

**Inline HTML helpers for ParagraphEditor:**
- Wrap selection in `<strong>`, `<em>`, `<code>`, `<a href="">`, `<br>`
- Shown as small icon buttons above the textarea when text is selected

**Key implementation notes:**
- Store `content` as array in React state; each block has a local `_key` (nanoid) for React `key` prop — do NOT use array index
- `id` fields on headings are auto-generated from `text` via `generateBlogSlug` but can be manually overridden (relevant for TOC anchor links)
- Image blocks uploaded inline via `/api/upload` — same flow as featured image
- Table editor: start 2×2, "+ Row" and "+ Column" buttons, any cell editable

---

### API Route Additions for Blogs

```
app/api/admin/blogs/route.js
  GET  — list all blogs (no filter; admin sees drafts too)
  POST — create blog: validate slug uniqueness, set id=nanoid(), dateISO auto-set if missing

app/api/admin/blogs/[id]/route.js
  GET    — single blog by id
  PUT    — update; if slug changed → check uniqueness; revalidateTag('blogs')
  DELETE — delete blog; also deleteImage(post.image) if set; revalidateTag('blogs')

app/api/admin/blog-categories/route.js
  GET  — list all categories
  POST — create category

app/api/admin/blog-categories/[id]/route.js
  PUT    — update category
  DELETE — refuse if any blog references category.slug (return 409 with count)
```

Slug uniqueness check helper (in `lib/blog.js`):
```js
export async function isSlugTaken(slug, excludeId = null) {
  const blogs = await getCollection('blogs')
  return blogs.some((b) => b.slug === slug && b.id !== excludeId)
}
```

---

### Frontend Migration — Blog Pages

**`app/blog/page.js`** — replace static import:
```js
// BEFORE
import { blogs } from '@/data/blogs'

// AFTER
import { getPublishedBlogs } from '@/lib/blog'
const blogs = await getPublishedBlogs()
```

**`app/blog/[slug]/page.js`** — replace static imports and helpers:
```js
// BEFORE
import { blogs, getBlogBySlug, getRelatedBlogs } from '@/data/blogs'

// AFTER
import { getPublishedBlogs, getBlogBySlug, getRelatedBlogs } from '@/lib/blog'

// generateStaticParams
export async function generateStaticParams() {
  const blogs = await getPublishedBlogs()
  return blogs.map((b) => ({ slug: b.slug }))
}
```

**ISR tags for blogs:**
- `lib/db.js` caches `blogs` collection with `next: { tags: ['blogs'], revalidate: 3600 }`
- Admin publish/update/delete calls `revalidateTag('blogs')`
- Individual slug pages: add `next: { tags: ['blogs', `blog-${slug}`] }` so a single post edit revalidates only that page

---

### Seed Migration — blogs.js specifics

The current `data/blogs.js` is 2.5 MB — auto-generated from WordPress. Special handling needed in `scripts/seed.js`:

```js
// scripts/seed.js — blog section
import { blogs } from '../data/blogs.js'
import { nanoid } from 'nanoid'

const blogsWithIds = blogs.map((post) => ({
  ...post,
  id: nanoid(),          // replace numeric WP id with nanoid
  status: 'published',   // all existing posts are published
}))

await seedCollection('blogs', blogsWithIds)
```

**Category seed** — extract unique categories from blogs:
```js
const categories = [...new Map(
  blogs.map((b) => [b.category.slug, b.category])
).values()].map((cat) => ({
  ...cat,
  id: nanoid(),
  thumbnailBg: 'bg-gradient-to-br from-indigo-900/60 to-violet-800/40'
}))

await seedCollection('blog-categories', categories)
```

---

## Frontend Migration

**Pattern change across ~25 files:**
```js
// BEFORE (static import)
import { services } from '@/data/services'

// AFTER (server component async fetch via lib/db)
import { getCollection } from '@/lib/db'
const services = await getCollection('services')
```

**Files to update:**
- `app/page.js` — fetch all 11 section datasets, pass as props to sections
- `components/sections/*.jsx` (11 files) — remove data imports, receive props
- `app/services/page.js` + `[slug]/page.js`
- `app/industries/page.js` + `[slug]/page.js`
- `app/blog/page.js` → `getPublishedBlogs()` from `lib/blog.js`
- `app/blog/[slug]/page.js` → `getBlogBySlug()`, `getRelatedBlogs()` from `lib/blog.js`; update `generateStaticParams`
- `app/about/AboutContent.jsx`
- `app/case-studies/page.js`
- `app/testimonials/page.js`
- `app/careers/page.js` + `app/seo-packages/page.js`
- `app/life-at-arshanemi/page.js` + `app/contact/page.js`
- `components/layout/Header.jsx` + `Footer.jsx`

**ISR strategy:**
- `lib/db.js` calls `unstable_cache` from Next.js with tag = collection name
- Admin PUT/DELETE/POST routes call `revalidateTag(collection)` after save
- Pages immediately show updated data without rebuild

---

## Admin UI Design (Light Theme)

```
Layout background:  #f9fafb  (gray-50)
Sidebar:            bg-indigo-600, text-white, hover:bg-indigo-700
Active nav item:    bg-indigo-800 text-white
Topbar:             bg-white border-b border-gray-200 shadow-sm
Cards:              bg-white border border-gray-200 rounded-xl shadow-sm
Table header:       bg-gray-50 text-gray-500 text-xs uppercase
Table row hover:    bg-gray-50
Primary button:     bg-indigo-600 hover:bg-indigo-700 text-white
Secondary button:   bg-white border border-gray-300 text-gray-700
Danger button:      bg-red-600 hover:bg-red-700 text-white
Input:              border-gray-300 focus:ring-indigo-500 focus:border-indigo-500
Toast success:      bg-green-500 text-white
Toast error:        bg-red-500 text-white
```

---

## Admin Sidebar Navigation Groups

```
Dashboard

CONTENT
  Services
  Industries
  Blog Posts
  Blog Categories
  Case Studies

TEAM & SOCIAL
  Team Members
  Testimonials
  Partners

SITE CONFIG
  Stats
  FAQs
  Trust Badges
  Hero Content
  Company Info

PAGES
  About Page
  Process Steps
  SEO Packages
  Careers
  Life at Santhya
  Contact Page
  Navigation
  Service Content
```

---

## Image Lifecycle

**Collections with image fields:**
- `team.photo`, `testimonials.avatar`, `case-studies.image` — start as `null` (local public/ folders are empty); admin uploads to Vercel Blob
- `partners.url` — re-uploaded to Vercel Blob automatically during seed script; admin can replace later
- `blogs.image` — optional featured image; `null` on most posts; admin uploads to Vercel Blob
- `blogs content[].img.src` — inline blog images uploaded via BlogBlockEditor → ImageBlockEditor → `/api/upload`

**Upload flow:** Drop/select → `/api/upload` → Vercel Blob → URL stored in form state → saved with record on submit

**Replace flow:** Admin picks new image → `/api/upload` new file → save → DELETE `/api/upload` old URL (if old URL is a Vercel Blob URL; skip DELETE if it was an external URL)

**Delete record flow:** Admin deletes item → API extracts image URL(s) from item → `deleteImage(url)` for each Vercel Blob URL → removes blob. Skip `deleteImage` if URL is `null` or external.

**`deleteImage` guard** (in `lib/upload.js`):
```js
export async function deleteImage(url) {
  if (!url || !url.includes('blob.vercel-storage.com')) return  // skip nulls + external URLs
  await del(url)
}
```

**`next/image` configuration** — add to `next.config.js` before any Blob URL will render:
```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    { protocol: 'https', hostname: 'www.santhyainfotech.com' },
  ]
}
```

---

## Implementation Phases

1. **Foundation** — packages install, lib/db.js, lib/auth.js, lib/upload.js, lib/blog.js, middleware.js, update .env
2. **Seed** — scripts/seed.js → run once; special handling for 2.5 MB blogs.js (add `status`, replace numeric id with nanoid, seed blog-categories)
3. **API Routes** — auth, upload, public data, admin CRUD (all route files incl. blog-categories)
4. **Admin Components** — Sidebar, Topbar, DataTable, FormField, ImageUpload, BlogBlockEditor, BlockEditor, IconPicker, Toast, ConfirmDialog
5. **Admin Pages** — login, dashboard, all CRUD sections (blogs + blog-categories included), all singleton pages
6. **Frontend Migration** — update pages/sections to use lib/db.js + lib/blog.js, add ISR tags

---

## Verification Steps

1. `node scripts/seed.js` → 21+ blobs created in Vercel Blob dashboard (blogs + blog-categories included)
2. `/admin/login` → wrong password shows error; correct → redirects to dashboard
3. Direct visit `/admin/services` without login → redirect to `/admin/login`
4. Create new service → appears on `/services` page after save
5. **Partner logos** — after `node scripts/seed.js`, verify all 9 partner `url` fields in Vercel Blob are reachable (not santhyainfotech.com/wp-content URLs anymore); logos render in homepage ticker
6. **Team photos** — after seed, `team[*].photo` is `null`; open `/admin/team/[id]`, upload photo → saved as Vercel Blob URL → renders on `/about` page
7. **Testimonial avatars** — after seed `avatar` is `null`; frontend must show initials fallback gracefully when `avatar` is `null`
8. Delete case study with image → Vercel Blob image removed; `null`-image case studies must not crash delete route
7. Edit company phone → reflected in footer and hero instantly
8. **Blog flow** — create draft post → not visible on `/blog`; publish → appears; edit title → revalidates ISR; delete → removes from site and Vercel Blob (if image set)
9. **Blog slug uniqueness** — attempt to save two posts with the same slug → second save shows inline error, does not proceed
10. **Blog categories** — delete category referenced by an existing post → API returns 409; UI shows "X posts use this category"
11. **TOC accuracy** — create post with h2/h3 blocks → `/blog/[slug]` TOC sidebar shows correct anchors
12. `npm run build` → no errors, all pages statically generated

---

## File Count Summary

| Category | New Files |
|---|---|
| lib/ | 4 (`db`, `auth`, `upload`, `blog`) |
| middleware | 1 |
| scripts/ | 1 |
| API routes | ~14 (includes blog + blog-categories routes) |
| Admin components | 10 (adds `BlogBlockEditor`) |
| Admin pages | ~50 (adds blogs list/new/edit + blog-categories) |
| **Total new** | **~80** |
| Frontend files modified | ~25 |
