'use client';

import { useState } from 'react';
import { ChevronDown, ArrowRight, Link2 } from 'lucide-react';

// ─── Inline HTML (paragraphs / list items only) ───────────────────────────────
// dangerouslySetInnerHTML is scoped to leaf nodes — never the full article.
function Inline({ as: Tag = 'p', html, className = '' }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-divider rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-foreground hover:text-accent-light transition-colors duration-200"
      >
        <span>{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-subtle mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted leading-relaxed border-t border-divider pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Read-also / interlink box ────────────────────────────────────────────────
function InterlinkBox({ label = 'Read Also', links }) {
  return (
    <div className="my-6 flex gap-4 items-start border border-accent/20 bg-accent/5 rounded-xl px-5 py-4">
      <Link2 size={16} className="text-accent-light shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent-light mb-2">
          {label}
        </p>
        <ul className="space-y-1.5">
          {links.map((link, i) => (
            <li key={i}>
              <a
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent-light transition-colors duration-150"
              >
                <ArrowRight size={12} className="text-accent shrink-0" />
                <span className="line-clamp-1">{link.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
function Table({ rows }) {
  if (!rows?.length) return null;
  const [head, ...body] = rows;
  return (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th
                key={i}
                className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-foreground border-b-2 border-accent/30 bg-accent/5"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-divider hover:bg-surface transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-muted">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ContentRenderer ──────────────────────────────────────────────────────────

export function ContentRenderer({ content = [] }) {
  return (
    <div className="wp-content">
      {content.map((block, i) => {
        switch (block.type) {
          case 'p':
            return <Inline key={i} html={block.html} />;

          case 'h2':
            return <h2 key={i} id={block.id}>{block.text}</h2>;

          case 'h3':
            return <h3 key={i} id={block.id}>{block.text}</h3>;

          case 'h4':
            return <h4 key={i} id={block.id}>{block.text}</h4>;

          case 'ul':
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <Inline key={j} as="li" html={item} />
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={i}>
                {block.items.map((item, j) => (
                  <Inline key={j} as="li" html={item} />
                ))}
              </ol>
            );

          case 'blockquote':
            return <blockquote key={i}><p>{block.text}</p></blockquote>;

          case 'hr':
            return <hr key={i} />;

          case 'code':
            return (
              <pre key={i}>
                <code className={block.lang ? `language-${block.lang}` : ''}>
                  {block.code}
                </code>
              </pre>
            );

          case 'img':
            return (
              <figure key={i}>
                <img
                  src={block.src}
                  alt={block.alt}
                  loading="lazy"
                  className="rounded-xl w-full h-auto"
                />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );

          case 'table':
            return <Table key={i} rows={block.rows} />;

          case 'interlink':
            return <InterlinkBox key={i} label={block.label} links={block.links} />;

          case 'faq':
            return (
              <div key={i} className="space-y-2 my-8">
                {block.items.map((item, j) => (
                  <FaqItem key={j} q={item.q} a={item.a} />
                ))}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

