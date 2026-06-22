'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { faqs as globalFaqs } from '@/data/faqs';
import SectionHeading from '@/components/ui/SectionHeading';

function FAQItem({ faq, index }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border border-divider rounded-xl overflow-hidden bg-card"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-card-hover transition-colors"
      >
        <span className={`text-sm font-semibold pr-4 ${open ? 'text-foreground' : 'text-muted'}`}>
          {faq.question}
        </span>
        <div className="w-6 h-6 rounded-full border border-divider flex items-center justify-center shrink-0 bg-surface">
          {open
            ? <Minus size={12} className="text-accent-light" />
            : <Plus size={12} className="text-muted" />
          }
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <p className="px-5 pb-5 text-sm text-muted leading-relaxed border-t border-divider pt-4">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection({ faqs, title = 'Frequently Asked Questions', subtitle = 'Everything you need to know about our SEO services and how we work.' }) {
  const displayed = (faqs || globalFaqs).slice(0, 8);

  return (
    <section className="section-pad bg-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <SectionHeading eyebrow="FAQ" title={title} subtitle={subtitle} />
        </motion.div>

        <div className="space-y-3">
          {displayed.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
