/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Menu, X } from 'lucide-react';
import {
  LEGAL_ENTITY,
  PRODUCT_LOGO,
  PRODUCT_NAME,
  PRIVACY_EMAIL,
} from '../../lib/brand';
import type { LegalBlock, LegalDocument } from './types';

type LegalPageLayoutProps = {
  document: LegalDocument;
};

function renderBlock(block: LegalBlock, index: number) {
  if (block.type === 'subheading') {
    return (
      <h3 key={index} className="text-base font-semibold text-gray-900 mt-6 mb-2">
        {block.text}
      </h3>
    );
  }
  if (block.type === 'list') {
    return (
      <ul key={index} className="list-disc pl-6 space-y-2 my-4 text-gray-700 leading-relaxed">
        {block.items.map((item) => (
          <li key={item.slice(0, 48)}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <p key={index} className="text-gray-700 leading-relaxed my-4">
      {block.text}
    </p>
  );
}

export function LegalPageLayout({ document }: LegalPageLayoutProps) {
  const [tocOpen, setTocOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(document.sections[0]?.id ?? '');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const ids = document.sections.map((s) => s.id);

    ids.forEach((id) => {
      const el = window.document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [document.sections]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0 group">
            <img
              src={PRODUCT_LOGO}
              alt={PRODUCT_NAME}
              className="h-10 w-10 shrink-0 object-contain"
            />
            <span className="font-bold font-display text-gray-950 truncate">{PRODUCT_NAME}</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-indigo transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start mb-8 lg:mb-0">
            <button
              type="button"
              className="lg:hidden flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium"
              onClick={() => setTocOpen((v) => !v)}
            >
              <span>On this page</span>
              {tocOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <nav
              className={`${tocOpen ? 'block' : 'hidden'} lg:block mt-3 lg:mt-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm`}
              aria-label="Table of contents"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 font-mono">
                Contents
              </p>
              <ul className="space-y-1 max-h-[60vh] overflow-y-auto text-sm">
                {document.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      onClick={() => setTocOpen(false)}
                      className={`block rounded-lg px-2 py-1.5 transition-colors ${
                        activeSection === section.id
                          ? 'bg-brand-indigo/10 text-brand-indigo font-medium'
                          : 'text-gray-600 hover:text-brand-indigo hover:bg-gray-50'
                      }`}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <main className="min-w-0">
            <article className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 sm:px-10 py-10 sm:py-12">
              <header className="border-b border-gray-100 pb-8 mb-2">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-indigo font-mono mb-3">
                  Legal
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-gray-950">
                  {document.title}
                </h1>
                <p className="mt-4 text-gray-600 leading-relaxed max-w-3xl">{document.description}</p>
                <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500">
                  <div>
                    <dt className="inline font-medium text-gray-700">Effective date: </dt>
                    <dd className="inline">{document.effectiveDate}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-gray-700">Last updated: </dt>
                    <dd className="inline">{document.lastUpdated}</dd>
                  </div>
                </dl>
              </header>

              {document.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28 pt-8">
                  <h2 className="text-xl font-bold text-gray-950 mb-4">{section.title}</h2>
                  {section.blocks.map((block, i) => renderBlock(block, i))}
                </section>
              ))}
            </article>

            <footer className="mt-10 text-center text-sm text-gray-500 space-y-2 pb-8">
              <p>
                © {new Date().getFullYear()} {PRODUCT_NAME} · {LEGAL_ENTITY}
              </p>
              <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <Link to="/privacy" className="hover:text-brand-indigo transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-brand-indigo transition-colors">
                  Terms of Service
                </Link>
                <a href={`mailto:${PRIVACY_EMAIL}`} className="hover:text-brand-indigo transition-colors">
                  {PRIVACY_EMAIL}
                </a>
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
