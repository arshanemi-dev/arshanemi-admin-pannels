import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, ArrowRight } from 'lucide-react';
import { getCategoryStyle } from '@/lib/utils';
import { getPublishedBlogs, getBlogBySlug, getRelatedBlogs } from '@/lib/blog';
import { CategoryBadge } from '@/components/blog/BlogGrid';
import { ContentRenderer } from '@/components/blog/ContentRenderer';
import BlogProgressBar from '@/components/blog/BlogProgressBar';
import CTABanner from '@/components/sections/CTABanner';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const blogs = await getPublishedBlogs();
  return blogs.map((b) => ({ slug: b.slug }));
}

const SITE_URL = 'https://www.santhyainfotech.com';

export async function generateMetadata({ params }) {
  const slug = (await params).slug;
  const post = await getBlogBySlug(slug);
  if (!post) return {};
  const pageUrl = `${SITE_URL}/blog/${slug}`;

  return {
    title: `${post.title} | Arshanemi Blog`,
    description: post.excerpt,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: pageUrl,
      publishedTime: post.dateISO,
      authors: [`${SITE_URL}/about`],
      images: post.image
        ? [{ url: post.image, width: 1200, height: 630, alt: post.title }]
        : [{ url: `${SITE_URL}/images/arshanemi-infotech-logo.png`, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.image ? [post.image] : [`${SITE_URL}/images/arshanemi-infotech-logo.png`],
    },
  };
}

// ─── TOC sidebar (h2 headings only) ──────────────────────────────────────────

function TOC({ headings }) {
  const h2s = headings.filter((h) => h.level === 2);
  if (!h2s.length) return null;
  return (
    <div className="bg-card border border-divider rounded-2xl p-5">
      <p className="text-xs font-bold text-foreground uppercase tracking-[0.12em] mb-4">
        Table of Contents
      </p>
      <nav className="space-y-0.5">
        {h2s.map((h, i) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className="flex items-start gap-2.5 py-1.5 text-xs text-muted hover:text-accent-light transition-colors duration-150 group"
          >
            <span className="text-accent/50 font-semibold tabular-nums mt-px shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="leading-relaxed group-hover:text-accent-light">{h.text}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

// ─── Author card ──────────────────────────────────────────────────────────────

function AuthorCard({ name }) {
  return (
    <div className="bg-card border border-divider rounded-2xl p-5">
      <p className="text-xs font-bold text-foreground uppercase tracking-[0.12em] mb-4">
        Written By
      </p>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-accent-light">SI</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-subtle">Arshanemi</p>
        </div>
      </div>
      <p className="text-xs text-muted leading-relaxed">
        SEO specialists and digital marketers helping businesses rank higher,
        grow faster, and convert better through data-driven strategies.
      </p>
      <Link
        href="/contact"
        className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-accent-light hover:text-foreground transition-colors"
      >
        Work with us <ArrowRight size={11} />
      </Link>
    </div>
  );
}

// ─── Share buttons ────────────────────────────────────────────────────────────

function ShareButtons({ postUrl, title }) {
  const encoded = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(title);
  const links = [
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.85L2.25 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encoded}&title=${encodedTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-card border border-divider rounded-2xl p-5">
      <p className="text-xs font-bold text-foreground uppercase tracking-[0.12em] mb-4">
        Share Article
      </p>
      <div className="flex gap-2">
        {links.map(({ label, href, icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${label}`}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-divider text-subtle hover:text-accent-light hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
          >
            {icon}
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Related post card ────────────────────────────────────────────────────────

function RelatedCard({ post }) {
  const style = getCategoryStyle(post.category?.slug);
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="bg-card border border-divider rounded-2xl overflow-hidden card-glow transition-all duration-300 flex flex-col h-full">
        <div className="relative h-36 overflow-hidden">
          {post.image ? (
            <>
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </>
          ) : (
            <div className={`absolute inset-0 ${style.thumbnailBg}`}>
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
            </div>
          )}
          <div className="absolute bottom-2.5 left-3">
            <CategoryBadge category={post.category} />
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-xs font-bold text-foreground leading-snug mb-2 group-hover:text-accent-light transition-colors line-clamp-2 flex-1">
            {post.title}
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-subtle pt-2.5 border-t border-divider mt-2">
            <Clock size={10} />
            {post.readTime}
            <span className="text-divider-light">·</span>
            <Calendar size={10} />
            {post.date}
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogDetailPage({ params }) {
  const slug = (await params).slug;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  const headings = post.content
    .filter((b) => b.type === 'h2' || b.type === 'h3')
    .map((b) => ({ level: b.type === 'h2' ? 2 : 3, text: b.text, id: b.id }));
  const related = await getRelatedBlogs(slug, 3);
  const postUrl = `${SITE_URL}/blog/${slug}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${postUrl}/#article`,
    headline: post.title,
    description: post.excerpt,
    image: post.image
      ? [post.image]
      : [`${SITE_URL}/images/arshanemi-infotech-logo.png`],
    datePublished: post.dateISO,
    dateModified: post.dateISO,
    author: {
      '@type': 'Person',
      name: post.author,
      url: `${SITE_URL}/about`,
      worksFor: { '@id': `${SITE_URL}/#organization` },
    },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    url: postUrl,
    articleSection: post.category.name,
    inLanguage: 'en-IN',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogProgressBar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-[120px] pb-12 bg-background overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.13) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-subtle mb-6">
            <Link
              href="/blog"
              className="hover:text-muted transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={12} />
              Blog
            </Link>
            <span className="text-divider-light">/</span>
            <span className="text-muted">{post.category.name}</span>
          </div>

          <div className="mb-4">
            <CategoryBadge category={post.category} />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-[1.15] text-foreground mt-4 mb-4">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-base sm:text-lg text-muted leading-relaxed max-w-3xl mb-7">
              {post.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-subtle">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-accent/15 border border-accent/25 inline-flex items-center justify-center">
                <span className="text-[8px] font-bold text-accent-light">SI</span>
              </span>
              {post.author}
            </span>
            <span className="text-divider-light">·</span>
            <span className="flex items-center gap-1.5">
              <Calendar size={11} />
              {post.date}
            </span>
            <span className="text-divider-light">·</span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} />
              {post.readTime} read
            </span>
          </div>
        </div>
      </section>

      {/* ── Featured image ───────────────────────────────────────────────────── */}
      {post.image && (
        <div className="bg-background pb-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative h-64 sm:h-80 lg:h-[440px] rounded-2xl overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.5)]">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1024px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      )}

      {/* ── Content + Sidebar ────────────────────────────────────────────────── */}
      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Article */}
            <article className="lg:col-span-8 min-w-0">
              <ContentRenderer content={post.content} />
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-4">
                <TOC headings={headings} />
                <AuthorCard name={post.author} />
                <ShareButtons postUrl={postUrl} title={post.title} />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Related Posts ─────────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="section-pad bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-semibold tracking-widest text-accent-light uppercase mb-1">
                  Continue Reading
                </p>
                <h2 className="text-xl font-bold text-foreground">Related Articles</h2>
              </div>
              <Link
                href="/blog"
                className="text-xs font-semibold text-subtle hover:text-accent-light transition-colors flex items-center gap-1.5"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((p) => (
                <RelatedCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CTABanner />
    </>
  );
}
