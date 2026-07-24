export const toolCategories = [
  { id: 'research',    label: 'Research Tools' },
  { id: 'analytics',  label: 'Analytics Tools' },
  { id: 'listing',    label: 'Listing Tools' },
  { id: 'embedded',   label: 'Embedded Tools' },
];

export const tools = [

  {
    slug: 'pdf-cropper',
    title: 'PDF Cropper',
    icon: 'Crop',
    shortDesc: 'Batch crop, trim margins, and resize PDF pages with pixel precision — no software, no uploads.',
    category: 'embedded',
    badge: 'Free',
    toolUrl: 'http://localhost:3002/',
    requiresLogin: false,
    // Every real sort/generate mode in the app's Sort Options panel
    // (components/pdf-tool/SortOptions.jsx there) now has a matching
    // feature — all free (0 coins), so any of them becomes instantly
    // price-editable via this catalog later with no code changes in the
    // tool app (see app/pdf-tool/page.js's SORT_MODE_FEATURES map).
    features: [
      { id: 'sort-sku-group', icon: 'ListOrdered', title: 'Sort by SKU', desc: '', apiIdentifier: 'crop-sku-group', coinCost: 0, fixFeeCoins: 0, isActive: true },
      { id: 'master-pick-list', icon: 'ClipboardCheck', title: 'Master Pick List', desc: 'Generate a consolidated pick list across the master SKU grouping.', apiIdentifier: 'crop-master-pick-list', coinCost: 0, fixFeeCoins: 0, isActive: true },
      { id: 'master-sku-group', icon: 'FolderTree', title: 'Master SKU Group Sort', desc: 'Sort and group pages by their mapped Master SKU.', apiIdentifier: 'crop-master-sku-group', coinCost: 0, fixFeeCoins: 0, isActive: true },

    ],
    hero: {
      headline: 'Crop Every Page. Perfectly. Every Time.',
      subtext: 'Upload a PDF, set your crop once, and apply it across every page in seconds — all inside your browser, with nothing ever leaving your device.',
    },
    stats: [
      { value: '10K+',  label: 'Pages Cropped Weekly' },
      { value: '100%',  label: 'Client-Side & Private' },
      { value: '<5 sec', label: 'Avg. Processing Time' },
      { value: 'Free',  label: 'Full Access, No Signup' },
    ],
    steps: [
      { step: '01', title: 'Upload Your PDF',    desc: 'Drag and drop any PDF file — multi-page documents are fully supported.' },
      { step: '02', title: 'Set the Crop Area',  desc: 'Drag the crop handles or enter exact margin values for pixel-precise trimming.' },
      { step: '03', title: 'Preview Every Page', desc: 'Scroll through a live preview to confirm the crop looks right on every page.' },
      { step: '04', title: 'Apply to All Pages', desc: 'Apply your crop settings to the entire document, or select specific page ranges.' },
      { step: '05', title: 'Download Instantly', desc: 'Export your cropped PDF in seconds — ready to print, share, or archive.' },
    ],
    advantages: [
      { icon: 'Clock',  title: 'Save hours of manual editing', desc: 'What used to take page-by-page editing in Acrobat now takes one pass across the whole document.' },
      { icon: 'Lock',   title: 'Nothing leaves your device',   desc: 'All cropping happens locally in your browser — no server uploads, no privacy risk.' },
      { icon: 'Layers', title: 'Consistent results every time', desc: 'Batch crop guarantees every page is trimmed identically — no manual drift between pages.' },
    ],
    faqs: [
      { question: 'Is my PDF uploaded to a server?',  answer: 'No — PDF Cropper processes everything locally in your browser. Your file never leaves your device.' },
      { question: 'Can I crop specific pages only?',  answer: 'Yes — apply your crop to the whole document or a custom page range.' },
      { question: 'Is there a file size limit?',      answer: 'Most PDFs up to a few hundred MB work smoothly since processing happens on your own device.' },
    ],
  },

  {
    slug: 'bg-remover',
    title: 'Background Remover',
    icon: 'Sparkles',
    shortDesc: 'AI-powered background removal for product photos and portraits — export transparent PNGs in seconds.',
    category: 'embedded',
    badge: 'AI-Powered',
    toolUrl: 'http://localhost:3003/',
    requiresLogin: false,
    features: [
      { id: 'medium-quality-removal', icon: 'Server', title: 'Medium Quality Removal', desc: 'Self-hosted AI background removal with sharper edges than the free client-side mode.', apiIdentifier: 'bg-remove-medium', coinCost: 0, fixFeeCoins: 0, isActive: true },
      { id: 'advanced-quality-removal', icon: 'Sparkles', title: 'Advanced Quality Removal', desc: 'Professional-grade edge detection powered by poof.bg — built for tricky edges like hair and fur.', apiIdentifier: 'bg-remove-advanced', coinCost: 2, fixFeeCoins: 0, isActive: true },
      { id: 'pro-quality-removal', icon: 'Crown', title: 'Pro Quality Removal', desc: 'Studio-quality cutouts powered by Photoroom — the best-in-class tier for client-facing product photography.', apiIdentifier: 'bg-remove-pro', coinCost: 3, fixFeeCoins: 0, isActive: true },
    ],
    hero: {
      headline: 'Remove Any Background in One Click',
      subtext: 'Drop in a photo and our AI isolates the subject instantly — clean edges, transparent PNG, ready for your listing, thumbnail, or design in seconds.',
    },
    stats: [
      { value: '2M+',   label: 'Images Processed' },
      { value: '<5 sec', label: 'Avg. Processing Time' },
      { value: '99%',   label: 'Edge Accuracy on Products' },
      { value: 'Free',  label: 'To Start, No Credit Card' },
    ],
    steps: [
      { step: '01', title: 'Upload Your Image',    desc: 'Drag and drop any JPG or PNG — product photo, portrait, or graphic.' },
      { step: '02', title: 'AI Detects the Subject', desc: 'Our model automatically identifies the foreground and separates it from the background.' },
      { step: '03', title: 'Preview the Cutout',   desc: 'Zoom in to check edges around hair, fur, or fine details before exporting.' },
      { step: '04', title: 'Touch Up If Needed',   desc: 'Use the brush tool to manually restore or erase any missed spots.' },
      { step: '05', title: 'Export Transparent PNG', desc: 'Download your background-free image, ready to use anywhere.' },
    ],
    advantages: [
      { icon: 'Zap',         title: 'Skip expensive photo editors',  desc: 'Get studio-quality cutouts without Photoshop or a subscription.' },
      { icon: 'ShieldCheck', title: 'Consistent, professional results', desc: 'Every image gets the same clean, marketplace-ready treatment.' },
      { icon: 'Clock',       title: 'Turn hours into seconds',       desc: 'Batch-ready product shoots go from raw photo to listing-ready in moments.' },
    ],
    faqs: [
      { question: 'What image formats are supported?', answer: 'JPG, PNG, and WebP uploads; export is always a transparent PNG.' },
      { question: 'Does it work on group photos?',      answer: 'Yes, though single-subject images (products, single portraits) get the cleanest results.' },
      { question: 'Is there a resolution limit?',       answer: 'Images up to 4000×4000px are supported for full-quality processing.' },
    ],
  },
  {
    slug: 'link-generator',
    title: 'Link Generator',
    icon: 'Link2',
    shortDesc: 'Browse your uploaded files and folders, then copy shareable links — single or in bulk — with Excel and JSON export built in.',
    category: 'embedded',
    badge: 'Free',
    toolUrl: 'http://localhost:3001/',
    requiresLogin: true,
    // apiIdentifiers below must match what's wired into FileExplorer.jsx's
    // handleCopyUrls (single vs batch) and handleInlineCopyExcel — see
    // plan/tools-pricing-cut-paln.md §7. `link-copy` is a pre-existing
    // identifier, reused as-is so old usage history/grants stay meaningful.
    features: [
    
      { id: 'image-upload', icon: 'Upload', title: 'File Upload', desc: 'Upload new files straight from your browser — 1 coin per file uploaded.', apiIdentifier: 'link-image-upload', coinCost: 1, fixFeeCoins: 0, isActive: true },
      // coinCost here is the per-GB rate scripts/cron-storage-billing.mjs
      // reads — NOT fixFeeCoins (that's the unrelated monthly-activation-
      // toggle mechanism). Storage is metered/cron-billed, never a toggle.
      { id: 'storage-per-gb', icon: 'HardDrive', title: 'Storage', desc: '50 coins per GB per month, with 1GB free — billed automatically.', apiIdentifier: 'link-storage-gb-month', coinCost: 0, fixFeeCoins: 50, isActive: true },
    ],
    hero: {
      headline: 'Browse Your Files. Copy Any Link. Instantly.',
      subtext: 'Every file you\'ve already uploaded lives in one explorer — pick one file or a hundred, and copy shareable URLs single, batched, or exported straight to Excel and JSON.',
    },
    stats: [
      { value: '1M+',    label: 'Links Copied' },
      { value: 'Instant', label: 'Single & Batch Copy' },
      { value: '2',      label: 'Export Formats (Excel, JSON)' },
      { value: 'Free',   label: 'Browsing & Uploads' },
    ],
    steps: [
      { step: '01', title: 'Open Your File Explorer', desc: 'Browse your uploaded files and folders in a familiar two-pane layout.' },
      { step: '02', title: 'Select One or Many',      desc: 'Click a single file for a quick copy, or check several for a batch operation.' },
      { step: '03', title: 'Group & Sort (Optional)', desc: 'For batch selections, group links into columns and sort by name or date before copying.' },
      { step: '04', title: 'Copy to Clipboard',       desc: 'Copy the link list as plain text, Excel-ready rows, or JSON in one click.' },
      { step: '05', title: 'Share Anywhere',          desc: 'Paste the copied links into an email, spreadsheet, or another tool — no re-uploading, no re-fetching.' },
    ],
    advantages: [
      { icon: 'Layers2',  title: 'Built for bulk, not just one link', desc: 'Select hundreds of files and copy every shareable link in one pass instead of opening each file individually.' },
      { icon: 'Table2',   title: 'Spreadsheet-ready by default',      desc: 'Excel export copies tab-separated rows you can paste directly into a spreadsheet — no reformatting.' },
      { icon: 'FolderOpen', title: 'Everything already in one place', desc: 'Files you\'ve already uploaded are the source — no separate shortening step, no broken links to a third-party shortener.' },
    ],
    faqs: [
      { question: 'Do I need to upload a file every time I want its link?', answer: 'No — browse files you\'ve already uploaded and copy their link directly; uploading is only needed for new files.' },
      { question: 'Can I copy links for many files at once?',               answer: 'Yes — select multiple files and use Batch Copy URLs, with optional grouping and sorting before you copy.' },
      { question: 'What formats can I export a link list in?',              answer: 'Plain list, Excel-ready tab-separated rows, or JSON — pick whichever fits where you\'re pasting it.' },
    ],
  },
];

// Default per-role tools access, applied when a user_settings row is first
// created for a user (at signup, Admin → Users, or when seeding default
// accounts). Every default role — master_admin, admin, and plain 'user' —
// starts with every current tool granted; an admin can still revoke
// individual tools per-user afterwards from Admin → Settings.
export const defaultToolsAccessByRole = {
  master_admin: tools.map((t) => t.slug),
  admin: tools.map((t) => t.slug),
  user: tools.map((t) => t.slug),
};
