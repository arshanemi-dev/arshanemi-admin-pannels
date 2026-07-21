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
    toolUrl: 'https://pdf-cropper.freelax.in/',
    requiresLogin: false,
    features: [
      // "Premium" master-sort mode in the PDF Cropper app's Sort Options panel
      // (components/pdf-tool/SortOptions.jsx there) — gated by Fix Fee rather
      // than coinCost, since it's a one-time unlock, not a per-use charge.
      { id: 'master-sku-group-sort', icon: 'Layers2', title: 'Master SKU Group Sort', desc: 'Sort and group shipping labels by a master SKU list across multiple orders — built for high-volume sellers managing several storefronts at once.', apiIdentifier: 'crop-master-sku-group', coinCost: 0, fixFeePaise: 0, isActive: true },
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
    toolUrl: 'https://bg-remover.freelax.in/',
    requiresLogin: false,
    // Features are keyed by server-side quality TIER, not by capability —
    // matches components/bg-remover/TierSelector.jsx and BgRemoverTool.jsx's
    // handleProcessImage/handleRemoveSelected in tools-3 (see
    // plan/tools-pricing-cut-paln.md §7). The `normal` tier runs entirely
    // client-side (Web Worker) and is never billed, so it has no feature row
    // here — only medium/advanced/pro, the tiers that call a paid server API.
    features: [
      { id: 'medium-quality-removal', icon: 'Server', title: 'Medium Quality Removal', desc: 'Self-hosted AI background removal with sharper edges than the free client-side mode.', apiIdentifier: 'bg-remove-medium', coinCost: 1, fixFeePaise: 0, isActive: true },
      { id: 'advanced-quality-removal', icon: 'Sparkles', title: 'Advanced Quality Removal', desc: 'Professional-grade edge detection powered by poof.bg — built for tricky edges like hair and fur.', apiIdentifier: 'bg-remove-advanced', coinCost: 3, fixFeePaise: 0, isActive: true },
      { id: 'pro-quality-removal', icon: 'Crown', title: 'Pro Quality Removal', desc: 'Studio-quality cutouts powered by Photoroom — the best-in-class tier for client-facing product photography.', apiIdentifier: 'bg-remove-pro', coinCost: 5, fixFeePaise: 0, isActive: true },
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
    toolUrl: 'https://link-generator.freelax.in/',
    requiresLogin: false,
    // apiIdentifiers below must match what's wired into FileExplorer.jsx's
    // handleCopyUrls (single vs batch) and handleInlineCopyExcel — see
    // plan/tools-pricing-cut-paln.md §7. `link-copy` is a pre-existing
    // identifier, reused as-is so old usage history/grants stay meaningful.
    features: [
      { id: 'browse-upload-files', icon: 'FolderOpen', title: 'Browse & Upload Files', desc: 'Navigate your cloud-stored files and folders in a familiar two-pane explorer, and upload new files straight from your browser.', apiIdentifier: 'link-browse', coinCost: 0, fixFeePaise: 0, isActive: true },
      { id: 'copy-file-url', icon: 'Copy', title: 'Copy File URL', desc: 'Select a single file and copy its shareable link to your clipboard in one click — no dashboards, no waiting.', apiIdentifier: 'link-copy', coinCost: 1, fixFeePaise: 0, isActive: true },
      { id: 'batch-copy-urls', icon: 'Layers2', title: 'Batch Copy URLs', desc: 'Select dozens of files at once and copy every shareable link together, grouped and sorted the way you need them.', apiIdentifier: 'link-batch-copy', coinCost: 2, fixFeePaise: 0, isActive: true },
      { id: 'export-links-excel', icon: 'Table2', title: 'Export Links to Excel', desc: 'Copy your link list as tab-separated rows, ready to paste straight into a spreadsheet with custom column grouping.', apiIdentifier: 'link-export-excel', coinCost: 1, fixFeePaise: 0, isActive: true },
      { id: 'export-links-json', icon: 'Braces', title: 'Export Links to JSON', desc: 'Copy the same grouped link list as structured JSON for feeding into another tool or script.', apiIdentifier: 'link-export-json', coinCost: 1, fixFeePaise: 0, isActive: true },
      { id: 'folder-organization', icon: 'FolderTree', title: 'Folder Organization', desc: 'Create, rename, and move folders to keep uploads organized before you ever need to share a link.', apiIdentifier: 'link-folder-organize', coinCost: 0, fixFeePaise: 0, isActive: true },
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
// created for a user (at signup, or when seeding default accounts).
// master_admin and admin get every current tool since they're only ever
// created by an existing admin (and an admin needs tools of their own before
// they can grant any to their team, per Admin → Settings). A plain 'user' —
// created via self-signup or Admin → Users — starts with NO tools access at
// all; an admin has to explicitly grant each one from Admin → Settings.
export const defaultToolsAccessByRole = {
  master_admin: tools.map((t) => t.slug),
  admin: tools.map((t) => t.slug),
  user: [],
};
