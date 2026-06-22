'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Calendar, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategoryStyle } from '@/lib/utils';

const POSTS_PER_PAGE = 9;

// ─── CategoryBadge (exported for use in detail page) ─────────────────────────

export function CategoryBadge({ category }) {
  const slug = typeof category === 'object' ? category.slug : category?.toLowerCase().replace(/\s+/g, '-');
  const name = typeof category === 'object' ? category.name : category;
  const style = getCategoryStyle(slug);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {name}
    </span>
  );
}

// ─── Thumbnail (real image or gradient fallback) ──────────────────────────────

function Thumbnail({ image, title, category, className = 'h-44' }) {
  const style = getCategoryStyle(category?.slug || category);
  if (image) {
    return (
      <div className={`relative ${className} overflow-hidden bg-card`}>
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>
    );
  }
  return (
    <div className={`relative ${className} overflow-hidden ${style.thumbnailBg}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.06)_0%,transparent_65%)]" />
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="bg-card border border-divider rounded-2xl overflow-hidden card-glow transition-all duration-300 flex flex-col h-full">
        <div className="relative">
          <Thumbnail image={post.image} title={post.title} category={post.category} className="h-44" />
          <div className="absolute bottom-3 left-3">
            <CategoryBadge category={post.category} />
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h2 className="text-sm font-bold text-foreground leading-snug mb-2.5 group-hover:text-accent transition-colors duration-200 line-clamp-2">
            {post.title}
          </h2>
          <p className="text-xs text-muted leading-relaxed flex-1 mb-4 line-clamp-2">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-divider">
            <div className="flex items-center gap-2.5 text-xs text-subtle">
              <span className="flex items-center gap-1">
                <Calendar size={10} className="shrink-0" />
                {post.date}
              </span>
              <span className="text-divider-light">·</span>
              <span className="flex items-center gap-1">
                <Clock size={10} className="shrink-0" />
                {post.readTime}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-accent-light group-hover:gap-2 transition-all duration-200">
              Read <ArrowRight size={11} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── FeaturedCard ─────────────────────────────────────────────────────────────

function FeaturedCard({ post }) {
  const style = getCategoryStyle(post.category?.slug || post.category);
  return (
    <Link href={`/blog/${post.slug}`} className="group block mb-8">
      <article className="bg-card border border-divider rounded-2xl overflow-hidden card-glow transition-all duration-300 grid grid-cols-1 lg:grid-cols-5 min-h-[220px]">
        {/* Visual — image or gradient */}
        <div className="lg:col-span-2 relative min-h-52 lg:min-h-0 overflow-hidden">
          {post.image ? (
            <>
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:to-black/20" />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-white/90 uppercase bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                  Featured Article
                </span>
              </div>
            </>
          ) : (
            <div className={`absolute inset-0 ${style.thumbnailBg}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.05)_0%,transparent_65%)]" />
              <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Featured Article</span>
                <CategoryBadge category={post.category} />
                <div className="flex items-center gap-2 text-xs text-subtle">
                  <Clock size={10} />
                  {post.readTime} read
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 p-7 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <CategoryBadge category={post.category} />
            <span className="text-xs text-subtle flex items-center gap-1">
              <Clock size={10} />
              {post.readTime} read
            </span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground leading-tight mb-3 group-hover:text-accent-light transition-colors duration-200">
            {post.title}
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-6 line-clamp-3">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-subtle">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-accent/15 border border-accent/20 inline-flex items-center justify-center text-[8px] font-bold text-accent-light">
                  SI
                </span>
                {post.author}
              </span>
              <span className="text-divider-light">·</span>
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {post.date}
              </span>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold bg-accent text-white px-4 py-2 rounded-full group-hover:bg-accent-hover transition-colors duration-200 shrink-0">
              Read Article <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function getPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total]);
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) pages.add(i);
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const items = getPageItems(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-lg flex items-center justify-center border border-divider text-subtle hover:border-divider-light hover:text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {items.map((item, i) =>
        item === '…' ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-xs text-subtle select-none">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold border transition-all duration-200 ${
              item === currentPage
                ? 'bg-accent text-white border-accent shadow-lg shadow-accent/30'
                : 'bg-transparent text-subtle border-divider hover:border-divider-light hover:text-muted'
            }`}
            aria-current={item === currentPage ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-lg flex items-center justify-center border border-divider text-subtle hover:border-divider-light hover:text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── BlogGrid ─────────────────────────────────────────────────────────────────

export default function BlogGrid({ posts = [] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => {
    const seen = new Map();
    for (const p of posts) {
      const cat = p.category;
      if (cat && !seen.has(cat.slug)) seen.set(cat.slug, cat);
    }
    return Array.from(seen.values());
  }, [posts]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const filtered = activeFilter === 'all'
    ? posts
    : posts.filter((p) => p.category?.slug === activeFilter);

  const featured = currentPage === 1 && activeFilter === 'all' && filtered.length > 0 ? filtered[0] : null;
  const allGrid = featured ? filtered.slice(1) : filtered;
  const totalPages = Math.max(1, Math.ceil(allGrid.length / POSTS_PER_PAGE));
  const pagedGrid = allGrid.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  if (!posts.length) {
    return (
      <div className="text-center py-24">
        <p className="text-muted text-sm">No articles found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap mb-10">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
            activeFilter === 'all'
              ? 'bg-accent text-white border-accent shadow-lg shadow-accent/30'
              : 'bg-transparent text-subtle border-divider hover:border-divider-light hover:text-muted'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleFilterChange(cat.slug)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
              activeFilter === cat.slug
                ? 'bg-accent text-white border-accent shadow-lg shadow-accent/30'
                : 'bg-transparent text-subtle border-divider hover:border-divider-light hover:text-muted'
            }`}
          >
            {cat.name}
          </button>
        ))}
        <span className="ml-auto text-xs text-subtle flex items-center gap-1.5">
          <Tag size={11} />
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Featured post — only on page 1 with no active filter */}
      {featured && <FeaturedCard post={featured} />}

      {/* Grid */}
      {pagedGrid.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pagedGrid.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted text-sm">No articles in this category yet.</p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
