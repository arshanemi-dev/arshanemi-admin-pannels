import BlogGrid from '@/components/blog/BlogGrid';
import CTABanner from '@/components/sections/CTABanner';
import { getPublishedBlogs } from '@/lib/blog';

export const metadata = {
  title: 'Blog | SEO Insights & Digital Marketing Guides — Arshanemi',
  description:
    'Read the latest SEO tips, digital marketing strategies, and technology insights from the Arshanemi team. Actionable guides for real business growth.',
};

export default async function BlogPage() {
  const blogs = await getPublishedBlogs();
  
  return (
    <>
      {/* Hero */}
      <section className="relative pt-[120px] pb-16 bg-background overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 65%)',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest text-accent-light uppercase bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full mb-6">
            Our Blog
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
            Insights, Guides &amp;{' '}
            <span className="gradient-text">Ideas That Work</span>
          </h1>
          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto">
            Actionable SEO strategies, digital marketing playbooks, and
            technology insights from the team at Arshanemi.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="section-pad bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlogGrid posts={blogs} />
        </div>
      </section>

      <CTABanner />
    </>
  );
}
