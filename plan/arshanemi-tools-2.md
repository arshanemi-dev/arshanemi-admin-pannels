# E-Commerce PDF Shipping Label Cropper & Sorter Tool
## Feature Plan — `tools/arshanemi-tools-2`

---

## Context

The project `tools/arshanemi-tools-2` is a standalone Next.js app currently built as a Dropbox file manager with expiry tracking and URL grouping. It needs to be repurposed into a multi-platform e-commerce **PDF shipping label cropper & sorter** supporting Myntra, Flipkart, Meesho, Amazon, and Snapdeal.

The seller is **Nirmita Textile** (Surat, Gujarat — GSTIN: 24ABOPY6489Q2Z6) who ships across all 5 platforms. The tool will parse platform-specific shipping PDFs, extract per-label data, sort/group labels by SKU, pickup partner, date, or company, and produce a reordered downloadable PDF — dramatically reducing manual packing and dispatch effort.

**Constraint:** Never touch the main `arshanemi-admin-pannels` admin panel. All work is scoped entirely to `tools/arshanemi-tools-2/`.

---

## Data Intelligence (from PDF Analysis)

| Platform | Label Type | SKU Format | Key Identifier |
|----------|-----------|------------|----------------|
| **Myntra** | Flipkart Logistics | `B103001-38WT(1)` | Header: `flipkartlogistics`, Order prefix `MYN/` |
| **Flipkart** | STD E-Kart Logistics | `10305-White-Free` | Header: `STD E-Kart`, AWB prefix `FMPC`, Order prefix `OD` |
| **Meesho** | Valmo/Delhivery + Tax Invoice | `106510-Black` | `Valmo`/`dgayl` invoice prefix, embedded GST invoice |
| **Amazon** | (Tab visible in UI, PDF TBD) | Standard ASIN-based | To be confirmed |
| **Snapdeal** | (Tab visible in UI, PDF TBD) | Standard | To be confirmed |

**Universal extractable fields:** SKU, Customer Name, Address, PIN, State, Seller, Courier Partner, Order Date, Quantity

---

## Phase 1 — Cleanup: Strip Dropbox & File Management

**Goal:** Delete all Dropbox/file-management code. Leave only the settings/admin skeleton and utilities.

### Files to DELETE entirely:
```
lib/storage.js                          ← Dropbox SDK wrappers
lib/groupLinks.js                       ← URL grouping logic
data/stored.js                          ← Fallback folder/file records

app/api/files/route.js                  ← File CRUD
app/api/upload/route.js                 ← File upload handler
app/api/thumbnail/route.js              ← Thumbnail proxy
app/api/urls/route.js                   ← Link grouping endpoint
app/api/files-expiry/                   ← Full folder (all files)

app/files/page.js                       ← Root file explorer
app/files/[...path]/page.js             ← Nested path explorer
app/files-expiry/page.js                ← Expiry manager page

components/files/                       ← Full folder (all 14 components)
components/settings/ConnectedSettings.jsx
components/settings/LoginForm.jsx
components/settings/TokenSetup.jsx
components/settings/SubscriptionCard.jsx
components/ui/ExpiryModal.jsx
components/ui/ExpiryPicker.jsx
components/ui/FilesExpiryManagerModal.jsx
components/ui/LoginModal.jsx

context/FileManagerContext.jsx

hooks/useFiles.js
hooks/useSelection.js
hooks/useClipboard.js
hooks/useContextMenu.js
hooks/useUpload.js
```

### package.json — Changes:

**Remove (unused after cleanup):**
- `"dropbox": "^10.34.0"` — Dropbox SDK, entire feature deleted
- `"nanoid": "^5.0.0"` — was used for file ID generation, no longer needed

**Add (new PDF engine):**
```json
"pdf-parse": "^1.1.1",
"pdf-lib": "^1.17.1",
"pdfjs-dist": "^4.10.38",
"xlsx": "^0.18.5"
```

**Also fix:** rename `"name": "arshanemi-tools-1"` → `"arshanemi-tools-2"` in package.json

**Keep as-is:** `next`, `react`, `react-dom`, `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`, `tailwindcss`, `@tailwindcss/postcss`

### Files to KEEP (do not touch):
```
components/settings/LocalModeSettings.jsx
components/settings/local/ProfilePanel.jsx
components/settings/local/CompanyPanel.jsx
components/settings/local/UsersPanel.jsx
components/settings/local/ThemePanel.jsx
components/layout/Header.jsx            ← Update nav links only
components/layout/ToastProvider.jsx
components/ui/Modal.jsx
components/ui/Button.jsx
lib/utils.js
lib/db.js                               ← Simplify to local-only
app/settings/page.js                    ← Keep, update nav
app/layout.js                           ← Keep
```

---

## Phase 2 — Admin Panel Foundation

**Goal:** Dummy login, dashboard, theme & settings management — no external auth.

### New Files:
```
app/page.js                             → Redirect to /pdf-tool
app/admin/page.js                       → Admin dashboard (stats, quick links)
app/admin/login/page.js                 → Dummy login form
```

### Admin Login (dummy, local):
- Credentials stored in `.env.local`: `ADMIN_USER=admin`, `ADMIN_PASS=admin123`
- Token stored in `localStorage` (`pdf-tool-admin-token`)
- No external auth service

### Admin Dashboard Shows:
- Tool usage stats (PDFs processed count, stored in localStorage)
- Quick links: PDF Tool, Settings, SKU Manager
- Premium toggle (enable/disable premium features per session)

### Existing Settings Page (keep `app/settings/page.js`):
- ThemePanel: Dark/light mode toggle, color scheme
- ProfilePanel: Tool operator name/logo
- CompanyPanel: Business name, GSTIN (pre-fill Nirmita Textile data)
- UsersPanel: Local user management

---

## Storage Strategy — No Database, SKU via JSON

**Rule: Zero database writes for any processed PDFs, labels, or results.**
All processing is stateless and in-memory. Files are never persisted server-side after processing.

### Master SKU Storage (the only persistent data):

Controlled by a single `.env.local` flag:

```env
NEXT_PUBLIC_IS_CONNECT=true     # Server-side JSON file (shared across users/sessions)
NEXT_PUBLIC_IS_CONNECT=false    # Client-side localStorage JSON (per-browser, default)
```

| Mode | How it works |
|------|-------------|
| `NEXT_PUBLIC_IS_CONNECT=true` | API routes (`/api/sku/master`, `/api/sku/map`) read/write a local `data/sku-store.json` file on the server. Best for single-machine / LAN tool. |
| `NEXT_PUBLIC_IS_CONNECT=false` | `lib/skuStore.js` reads/writes `localStorage` as JSON strings (`pdf-tool-master-skus`, `pdf-tool-sku-mappings`). Zero server involvement. |

`lib/skuStore.js` detects the mode at runtime:
- Server-side: `fs.readFileSync('data/sku-store.json')`
- Client-side: `localStorage.getItem('pdf-tool-master-skus')`

The UI (SKUManagerPanel) calls the same exported functions regardless of mode — the abstraction is hidden in `skuStore.js`.

---

## Phase 3 — PDF Processing Engine

**Goal:** Core library for parsing, extracting, sorting, and rebuilding PDFs.

### New Dependencies:
```json
"pdf-parse": "^1.1.1",        ← Text extraction from PDF pages
"pdf-lib": "^1.17.1",         ← Rebuild sorted PDF (reorder pages)
"xlsx": "^0.18.5"             ← Export pick list as Excel
```

### New Library Files (`lib/`):

**`lib/platformDetector.js`**
- Input: raw PDF text (first 2 pages)
- Logic: keyword fingerprinting per platform
  - `flipkartlogistics` or `MYN/` → Myntra
  - `STD E-Kart` or `FMPC` or `OD[digits]` → Flipkart
  - `Valmo` or `dgayl` or `Meesho` → Meesho
- Output: `{ platform: 'meesho' | 'flipkart' | 'myntra' | 'amazon' | 'snapdeal' | 'unknown' }`

**`lib/labelExtractor.js`**
- Input: raw page text + platform
- Per-platform regex patterns to extract per-label data:
  ```js
  { sku, size, color, qty, customerName, pin, state,
    courierPartner, orderDate, orderNo, sellerName }
  ```
- Myntra SKU pattern: `/B\d{6}-\d{2}[A-Z]{2,}/`
- Flipkart SKU pattern: `/\d{5}-[A-Za-z]+-[A-Za-z]+/`
- Meesho SKU pattern: `/\d{6}-[A-Za-z]+/`

**`lib/pdfSorter.js`**
- Input: `[{ pageIndex, labelData }]` + sortMode
- Sort modes:
  1. `sku-group` — group by SKU code (alphabetically)
  2. `pickup-partner` — group by courier (Valmo, Delhivery, E-Kart, etc.)
  3. `date` — sort by order/print date ascending
  4. `company-wise` — group by seller name
  5. `master-sku-group` — group by master SKU mapping (requires SKU map data)
- Output: sorted `pageIndex[]` array

**`lib/pdfBuilder.js`**
- Input: original PDF bytes + sorted `pageIndex[]`
- Uses `pdf-lib` to extract pages and rebuild in new order
- Output: reordered PDF bytes → downloadable blob

**`lib/skuStore.js`**
- localStorage-backed CRUD for master SKU and SKU mappings
- `getMasterSKUs()`, `addMasterSKU()`, `deleteMasterSKU()`
- `getSkuMappings()`, `addSkuMapping()`, `updateSkuMapping()`, `deleteSkuMapping()`

### New API Routes (`app/api/`):

**`app/api/pdf/process/route.js`** (POST)
- Receives: multipart form with PDF + `platform` + `sortMode` + `skuMappings`
- Uses: `platformDetector` → `labelExtractor` → `pdfSorter` → `pdfBuilder`
- Returns: `{ sortedPdfBase64, labelsSummary: [{sku, courier, date, ...}], pageCount }`

**`app/api/pdf/download/route.js`** (POST)
- Receives: base64 PDF + filename
- Returns: file stream with `Content-Disposition: attachment`

**`app/api/auth/login/route.js`** (POST)
- Validates against env vars `ADMIN_USER` / `ADMIN_PASS`
- Returns: `{ token }` (simple base64 of user:pass, stored in localStorage)

---

## Phase 3b — Manual Crop Engine

**Goal:** Let the user visually drag a crop rectangle on page 1, then apply the same crop box to every page in the PDF automatically.

### How it works (user flow):
1. User selects the **"Manual"** tab
2. Uploads any PDF
3. Page 1 renders on a `<canvas>` with a draggable/resizable purple crop rectangle overlay
4. User drags the corners/edges to define the crop area
5. Clicks **"Apply Crop to All Pages"**
6. Every page in the PDF is cropped to the same `[x, y, width, height]` coordinates
7. Download the cropped PDF

### New Library: `lib/pdfCropper.js`
- `renderPageToCanvas(pdfBytes, pageIndex, canvas)` — use `pdfjs-dist` to render page to canvas for preview
- `applyCropToAllPages(pdfBytes, cropBox)` — use `pdf-lib` to set `CropBox` on every page
  - `cropBox`: `{ x, y, width, height }` in PDF points (72 pt = 1 inch)
  - Canvas pixel coords → PDF point coords via scale factor: `pdfPointsPerPixel = pdfPage.width / canvas.width`

### New Component: `components/pdf-tool/ManualCropTool.jsx`
- Renders only when "Manual" tab is active
- Canvas element showing page 1 preview
- Overlay `<div>` for the crop rectangle with:
  - 8 drag handles (corners + midpoints)
  - Mouse/pointer events for resize/move
  - Purple dashed border (matches design language)
- Shows crop dimensions in real-time (e.g., `A4: 210mm × 148mm`)
- "Apply Crop to All Pages" button (purple, full width)
- "Reset" button to clear crop selection
- On apply: calls `lib/pdfCropper.js` → downloads cropped PDF directly (no API round-trip needed — runs client-side via `pdf-lib` WASM)

### New dependency:
```json
"pdfjs-dist": "^4.x"    ← PDF page rendering to canvas (preview only)
```
Note: `pdf-lib` (already planned) handles the actual crop write. `pdfjs-dist` is only for the canvas preview render.

### Crop coordinates precision:
- PDF coordinate system origin is bottom-left
- `pdf-lib`'s `page.setCropBox(x, y, width, height)` sets the visible region
- The canvas-to-PDF scale factor is: `scale = page.getWidth() / canvas.clientWidth`
- Crop rect stored as: `{ x: left*scale, y: (canvasH - bottom)*scale, width: w*scale, height: h*scale }`

---

## Phase 4 — Main PDF Tool UI

**Goal:** Build the UI matching `source/ui/pdf-croper-ui.png` exactly.

### New Page:
```
app/pdf-tool/page.js                    → Main tool (uses client components)
```

### New Components (`components/pdf-tool/`):

**`PlatformTabs.jsx`**
- Tabs: Manual | Meesho Label | Flipkart Label | Amazon Label | Myntra Label | Snapdeal Label
- Active tab stored in state, passed to upload zone for auto-detection bypass
- Style: pill tabs with purple active state

**`PDFUploadZone.jsx`**
- Drag & drop area with dashed border and cloud-upload icon (purple)
- "Select PDF File" button (green)
- On file drop/select: show filename + page count
- Auto-detects platform from PDF text on upload, updates tab selection

**`SortOptions.jsx`**
- Two groups of checkboxes:
  - **Free** (white): Sort by SKU Group, Pickup Partner, Date, Company Wise, Master SKU Group
  - **Premium** (orange badge): Pick List, Master Pick List
- Premium options disabled/locked if not in premium mode (show lock icon + "Upgrade" tooltip)
- Only one sort mode active at a time (radio-like behavior)

**`ProcessButton.jsx`**
- Full-width purple "Process PDF" button
- Shows spinner during processing (`/api/pdf/process`)
- On success: shows results panel

**`ResultsPanel.jsx`**
- Shows: platform detected, page count, sort applied, label summary table
- Download button: triggers `/api/pdf/download`
- Pick list preview (if pick list mode): table with SKU, qty, size, color

**Layout of `app/pdf-tool/page.js`:**

**When platform tab active (Meesho / Flipkart / Myntra / Amazon / Snapdeal):**
```
┌─────────────────────────────────────────────────────────┐
│  [Tabs: Manual | Meesho | Flipkart | Amazon | Myntra | Snapdeal] │
├────────────────────────────┬───────────────────────────┤
│  PDFUploadZone             │  SortOptions              │
│  (Drag & drop)             │  ☑ SKU Group (Free)       │
│  [Select PDF File]         │  ☐ Pickup Partner (Free)  │
│                            │  ☐ Date (Free)            │
│  [  Process PDF  ]         │  ☐ Company (Free)         │
│                            │  🔒 Pick List (Premium)   │
├────────────────────────────┴───────────────────────────┤
│  ResultsPanel (shown after processing)                  │
│  [Platform: Meesho] [Pages: 48] [Sorted by: SKU Group] │
│  [⬇ Download Sorted PDF]                               │
├─────────────────────────────────────────────────────────┤
│  SKUManagerPanel                                        │
│  [Master SKU] [Map SKU]                                 │
│  Search... | [+ Add] [↑ Upload] [↓ Download]           │
│  ITO-SARD    [Edit] [Delete]                            │
└─────────────────────────────────────────────────────────┘
```

**When Manual tab active:**
```
┌─────────────────────────────────────────────────────────┐
│  [Tabs: Manual* | Meesho | Flipkart | Amazon | Myntra | Snapdeal] │
├─────────────────────────────────────────────────────────┤
│  PDFUploadZone (same drag & drop)                       │
│  [Select PDF File]                                      │
├─────────────────────────────────────────────────────────┤
│  ManualCropTool                                         │
│  ┌──────────────────────────────────┐                   │
│  │  [Page 1 canvas preview]         │                   │
│  │  ┌ ─ ─ ─ ─ ─ ┐  ← crop rect    │                   │
│  │  │  drag to   │   (purple dash)  │                   │
│  │  │  resize    │                  │                   │
│  │  └ ─ ─ ─ ─ ─ ┘                  │                   │
│  └──────────────────────────────────┘                   │
│  Crop: 210mm × 148mm                                    │
│  [  Apply Crop to All Pages  ]  [Reset]                 │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 5 — SKU Management Panel

**Goal:** Bottom panel for managing master SKU categories and individual SKU mappings.

### Components (`components/sku/`):

**`SKUManagerPanel.jsx`**
- Two-tab panel: "Master SKU" | "Map SKU"
- Top-right: Upload (import JSON/CSV) + Download (export JSON/CSV) buttons
- Search input filters the list in real-time
- List with edit/delete icons per row (purple icon buttons)
- Bottom: "Add New SKU" input + "Add" button

**`MasterSKUList.jsx`**
- Reads from `lib/skuStore.js` `getMasterSKUs()`
- Items: SKU code + edit/delete actions
- On edit: inline input replaces text

**`MapSKUList.jsx`**
- Reads from `lib/skuStore.js` `getSkuMappings()`
- Items: individual SKU code → master SKU mapping
- On edit: dropdown to select master SKU from master list

**Storage**: All SKU data in `localStorage` keys `pdf-tool-master-skus` + `pdf-tool-sku-mappings`

---

## Phase 6 — Header & Navigation Update

**`components/layout/Header.jsx`** — Update nav links to:
- PDF Tool → `/pdf-tool`
- Settings → `/settings`
- Admin → `/admin`
- Remove all file manager / expiry links

---

## Tech Stack (final, tools/arshanemi-tools-2)

| Keep | Add | Remove |
|------|-----|--------|
| Next.js 15.3 | `pdf-parse ^1.1.1` | `dropbox ^10.34.0` |
| React 19 | `pdf-lib ^1.17.1` | `nanoid ^5.0.0` |
| Tailwind CSS v4 | `xlsx ^0.18.5` | |
| Framer Motion | `pdfjs-dist ^4.10.38` | |
| Lucide React, clsx, tailwind-merge | | |

---

## Design Language (match screenshot)

- **Primary color**: Purple/Violet (`#7c3aed` — Tailwind `violet-700`)
- **Success/Upload button**: Green (`#16a34a`)
- **Premium badge**: Orange (`#ea580c`)
- **Background**: Dark card layout (`#111` / `#161616`)
- **Border**: Subtle `#262626`
- **Font**: System stack (already in ThemePanel)
- All Tailwind v4 tokens — no inline styles

---

## .env.local additions needed:
```env
ADMIN_USER=admin
ADMIN_PASS=admin123
PDF_TOOL_NAME=ArshaNemi PDF Tools
```

---

## .env.local additions needed:
```env
ADMIN_USER=admin
ADMIN_PASS=admin123
PDF_TOOL_NAME=ArshaNemi PDF Tools
NEXT_PUBLIC_IS_CONNECT=false        # true = server JSON file, false = localStorage JSON
```

---

## Verification Steps

1. `cd tools/arshanemi-tools-2 && npm install` — verify clean install, no dropbox errors
2. `npm run dev` — app boots, no import errors
3. Navigate to `/pdf-tool` — confirm UI matches screenshot layout

**Sorting:**
4. Upload `source/pdf/Meesho.pdf` → auto-detects "Meesho Label" tab
5. Select "Sort by SKU Group" → click "Process PDF" → download sorted PDF, verify pages reordered by SKU
6. Upload `source/pdf/Flipkart.pdf` → sort by "Pickup Partner" → verify courier grouping
7. Upload `source/pdf/Myntra.pdf` → sort by "Date" → verify date order

**Manual Crop:**
8. Click "Manual" tab → upload `source/pdf/Myntra.pdf` → page 1 renders on canvas
9. Drag crop rectangle to select label area only → click "Apply Crop to All Pages"
10. Download → verify all pages are cropped to same box

**SKU Management:**
11. With `NEXT_PUBLIC_IS_CONNECT=false`: Add Master SKU → refreshes from localStorage; Download exports JSON
12. With `NEXT_PUBLIC_IS_CONNECT=true`: Add Master SKU → `data/sku-store.json` updates on server
13. Map an individual SKU to master → process PDF with "Master SKU Group" sort

**Admin & Settings:**
14. Admin login at `/admin/login` with env credentials → dashboard loads
15. Settings page → toggle dark/light theme → ThemePanel applies correctly
