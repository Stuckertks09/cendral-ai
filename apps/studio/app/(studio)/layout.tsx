'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

/* ---------- utils ---------- */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type NavItem = { href: string; label: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: 'OSINT',
    items: [{ href: '/model/osint', label: 'Relevant News' }]
  },
  {
    title: 'Assets',
    items: [
      { href: '/assets/personas', label: 'Personas' },
      { href: '/assets/actors', label: 'Actors' },
      { href: '/assets/leaders', label: 'Leaders' },
      { href: '/model/events', label: 'Events' }
    ]
  },
  {
    title: 'Domains',
    items: [{ href: '/domains/defense', label: 'Defense Settings' }]
  },
  {
    title: 'Model',
    items: [
      { href: '/model/cognition', label: 'Cognition' },
      { href: '/model/memory', label: 'Memory' },
      { href: '/model/systems', label: 'Systems' },
      { href: '/model/scenarios', label: 'Scenarios' }
    ]
  }
];

/* ---------- layout ---------- */

export default function StudioLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* responsive breakpoint */
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* lock body scroll when drawer open (mobile only) */
  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, sidebarOpen]);

  /* derived visibility (NO state mutation in effects) */
  const sidebarVisible = !isMobile || sidebarOpen;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Mobile overlay */}
      {isMobile && sidebarVisible && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 border-r border-slate-800 bg-slate-950 p-5 space-y-6',
          isMobile &&
            'fixed inset-y-0 left-0 z-40 transform transition-transform duration-200',
          isMobile && (sidebarVisible ? 'translate-x-0' : '-translate-x-full'),
          !isMobile && 'relative'
        )}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold tracking-wide text-slate-200">
            Modeling Studio
          </h1>

          {isMobile && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white text-lg leading-none"
              aria-label="Close sidebar"
            >
              ×
            </button>
          )}
        </div>

        {NAV.map((group) => (
          <nav key={group.title} className="space-y-3 text-sm">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">
              {group.title}
            </div>

            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setSidebarOpen(false)}
                className="block rounded px-2 py-1 text-slate-300 hover:bg-slate-900 hover:text-white transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ))}
      </aside>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        {isMobile && (
          <header className="h-12 flex items-center gap-3 px-4 border-b border-slate-800 bg-slate-950">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="text-slate-300 hover:text-white text-lg leading-none"
              aria-label="Open sidebar"
            >
              ☰
            </button>

            <span className="text-sm font-medium text-slate-200">
              Modeling Studio
            </span>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
