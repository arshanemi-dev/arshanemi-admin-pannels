'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { blogs } from '@/data/blogs';
import SectionHeading from '@/components/ui/SectionHeading';
import { getCategoryStyle } from '@/lib/utils';
import { CategoryBadge } from '@/components/blog/BlogGrid';

/* ── Thumbnail: real image when available, category gradient fallback ── */
function CardThumbnail({ image, title, category }) {
  const catSlug =
    typeof category === 'object'
      ? category?.slug
      : category?.toLowerCase().replace(/\s+/g, '-');
  const cfg = getCategoryStyle(catSlug);

  if (image) {
    return (
      <div className="relative h-40 shrink-0 overflow-hidden bg-card">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 46vw, 25vw"
        />
        {/* subtle darkening at bottom so category badge stays readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className={`relative h-40 shrink-0 overflow-hidden ${cfg.thumbnailBg}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.06)_0%,transparent_65%)]" />
    </div>
  );
}

function BlogCard({ post }) {
  return (
    <div className="flex-[0_0_82%] sm:flex-[0_0_46%] lg:flex-[0_0_30%] xl:flex-[0_0_22%] min-w-0 pl-5">
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <article className="bg-card border border-divider rounded-2xl overflow-hidden h-full flex flex-col hover:border-accent/30 hover:shadow-md transition-all duration-300">

          {/* ── Thumbnail ── */}
          <div className="relative">
            <CardThumbnail image={post.image} title={post.title} category={post.category} />
            <div className="absolute bottom-3 left-3">
              <CategoryBadge category={post.category} />
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="text-sm font-bold text-foreground leading-snug mb-2 group-hover:text-accent-light transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-xs text-muted leading-relaxed flex-1 mb-3 line-clamp-3">
              {post.excerpt}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-divider">
              <span className="flex items-center gap-1.5 text-xs text-subtle">
                <Clock size={10} /> {post.readTime} read
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-accent-light group-hover:gap-2 transition-all">
                Read <ArrowRight size={10} />
              </span>
            </div>
          </div>

        </article>
      </Link>
    </div>
  );
}

export default function ServiceBlogsCarousel() {
  const latestBlogs = [...blogs].slice(0, 10);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 3500, stopOnInteraction: false })]
  );

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!latestBlogs.length) return null;

  return (
    <section className="section-pad bg-surface overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
        >
          <SectionHeading
            eyebrow="Latest Insights"
            title="From Our Blog"
            subtitle="Expert guides, industry news, and proven strategies to grow your online presence."
            center={false}
          />
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full bg-card border border-divider text-muted hover:text-foreground hover:border-accent/50 transition-all flex items-center justify-center"
              aria-label="Previous"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-card border border-divider text-muted hover:text-foreground hover:border-accent/50 transition-all flex items-center justify-center"
              aria-label="Next"
            >
              <ArrowRight size={16} />
            </button>
            <Link
              href="/blog"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-accent-light transition-colors ml-2"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-5">
            {latestBlogs.map((post) => (
              <BlogCard key={post.id || post.slug} post={post} />
            ))}
          </div>
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-accent-light transition-colors"
          >
            View All Articles <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
