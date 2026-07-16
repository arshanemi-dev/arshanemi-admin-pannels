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
      { id: 'pixel-precise-cropping', icon: 'Crop',       title: 'Pixel-Precise Cropping', desc: 'Drag a crop box or enter exact margins in mm/inches — every page is trimmed to the same precision every time.', apiIdentifier: 'crop-precise', coinCost: 1, isActive: true },
      { id: 'batch-processing', icon: 'Layers',     title: 'Batch Processing',       desc: 'Crop hundreds of pages across multiple PDFs in one pass instead of opening each file individually.', apiIdentifier: 'crop-batch', coinCost: 5, isActive: true },
      { id: 'live-preview', icon: 'Eye',        title: 'Live Preview',           desc: 'See the exact crop applied to every page before you export — no surprises, no re-dos.', apiIdentifier: 'crop-preview', coinCost: 1, isActive: true },
      { id: 'runs-in-your-browser', icon: 'Lock',       title: 'Runs in Your Browser',   desc: 'Files are processed locally — nothing is uploaded to a server, so sensitive documents never leave your device.', apiIdentifier: 'crop-local-process', coinCost: 1, isActive: true },
      { id: 'auto-detect-margins', icon: 'Grid',       title: 'Auto-Detect Margins',    desc: 'One click scans the page content and suggests the tightest possible crop automatically.', apiIdentifier: 'crop-autodetect', coinCost: 2, isActive: true },
      { id: 'instant-export', icon: 'Download',   title: 'Instant Export',         desc: 'Download your cropped PDF immediately — no waiting, no email links, no processing queue.', apiIdentifier: 'crop-export', coinCost: 1, isActive: true },
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
    features: [
      { id: 'one-click-ai-removal', icon: 'Sparkles',  title: 'One-Click AI Removal',   desc: 'Our model detects the subject and strips the background automatically — no manual masking or lasso tools.', apiIdentifier: 'bg-remove-single', coinCost: 2, isActive: true },
      { id: 'product-photo-ready', icon: 'Image',     title: 'Product-Photo Ready',    desc: 'Optimised for clean edges around products, packaging, and apparel — ideal for marketplace listings.', apiIdentifier: 'bg-remove-product', coinCost: 2, isActive: true },
      { id: 'portrait-mode', icon: 'User',      title: 'Portrait Mode',          desc: 'Fine-tuned edge detection around hair and skin tones for natural-looking people cutouts.', apiIdentifier: 'bg-remove-portrait', coinCost: 2, isActive: true },
      { id: 'transparent-png-export', icon: 'Download',  title: 'Transparent PNG Export', desc: 'Download a true transparent-background PNG, ready to drop onto any backdrop or template.', apiIdentifier: 'bg-remove-export', coinCost: 1, isActive: true },
      { id: 'seconds-not-minutes', icon: 'Zap',       title: 'Seconds, Not Minutes',   desc: 'Processing typically finishes in under 5 seconds, even for high-resolution images.', apiIdentifier: 'bg-remove-fast', coinCost: 1, isActive: true },
      { id: 'manual-touch-up', icon: 'RefreshCw', title: 'Manual Touch-Up',        desc: 'Erase or restore edges with a brush tool for the rare image the AI doesn\'t nail on the first pass.', apiIdentifier: 'bg-remove-touchup', coinCost: 1, isActive: true },
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
    shortDesc: 'Generate clean short links, QR codes, and trackable URLs to share anywhere in a single click.',
    category: 'embedded',
    badge: 'Free',
    toolUrl: 'https://link-generator.freelax.in/',
    requiresLogin: false,
    features: [
      { id: 'instant-short-links', icon: 'Link2',    title: 'Instant Short Links', desc: 'Paste any long URL and get a clean, shareable short link in one click.', apiIdentifier: 'link-generate', coinCost: 1, isActive: true },
      { id: 'built-in-qr-codes', icon: 'QrCode',   title: 'Built-In QR Codes',   desc: 'Every short link automatically comes with a downloadable QR code for print or offline sharing.', apiIdentifier: 'link-qr-code', coinCost: 1, isActive: true },
      { id: 'click-tracking', icon: 'BarChart3', title: 'Click Tracking',     desc: 'See how many times each link has been clicked, right from your dashboard.', apiIdentifier: 'link-click-tracking', coinCost: 1, isActive: true },
      { id: 'custom-slugs', icon: 'Edit',     title: 'Custom Slugs',        desc: 'Choose your own short link ending instead of a random string, for branded, memorable URLs.', apiIdentifier: 'link-custom-slug', coinCost: 1, isActive: true },
      { id: 'link-expiry-options', icon: 'Clock',    title: 'Link Expiry Options', desc: 'Set links to expire after a date or click count for time-sensitive campaigns.', apiIdentifier: 'link-expiry', coinCost: 1, isActive: true },
      { id: 'one-click-copy', icon: 'Copy',     title: 'One-Click Copy',      desc: 'Copy your new short link or QR code image straight to your clipboard instantly.', apiIdentifier: 'link-copy', coinCost: 1, isActive: true },
    ],
    hero: {
      headline: 'Turn Any Link Into a Short, Trackable One',
      subtext: 'Paste a long URL, get a clean short link and QR code instantly, and track every click — perfect for social bios, print materials, and campaigns.',
    },
    stats: [
      { value: '1M+',    label: 'Links Generated' },
      { value: 'Instant', label: 'Link & QR Creation' },
      { value: '100%',   label: 'Click Tracking Included' },
      { value: 'Free',   label: 'No Signup Required' },
    ],
    steps: [
      { step: '01', title: 'Paste Your URL',      desc: 'Drop in any long link you want to shorten.' },
      { step: '02', title: 'Customise the Slug',  desc: 'Optionally choose your own short link ending for a branded look.' },
      { step: '03', title: 'Generate the QR Code', desc: 'A scannable QR code is created automatically alongside your short link.' },
      { step: '04', title: 'Copy or Download',    desc: 'Copy the link or download the QR code image with one click.' },
      { step: '05', title: 'Track Performance',   desc: 'Watch click counts roll in as people use your link.' },
    ],
    advantages: [
      { icon: 'Share2',   title: 'Share anywhere, cleanly',    desc: 'Replace long, messy URLs with short links that look professional everywhere.' },
      { icon: 'BarChart3', title: 'Know what\'s working',      desc: 'Click tracking shows exactly which links and campaigns are getting engagement.' },
      { icon: 'QrCode',   title: 'Bridge print and digital',   desc: 'QR codes let offline materials — posters, packaging, business cards — link straight to your content.' },
    ],
    faqs: [
      { question: 'Do I need an account to generate links?', answer: 'No — you can generate short links and QR codes without signing up.' },
      { question: 'Can I customise my short link?',          answer: 'Yes — choose a custom slug instead of a random one for branded links.' },
      { question: 'Do links expire?',                        answer: 'By default links don\'t expire, but you can optionally set an expiry date or click limit.' },
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
