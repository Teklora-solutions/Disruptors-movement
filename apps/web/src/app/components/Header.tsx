'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const partners = [
  { slug: 'partner-a', name: 'Partner A', tagline: 'Innovating together' },
  { slug: 'partner-b', name: 'Partner B', tagline: 'Driving change' },
  { slug: 'partner-c', name: 'Partner C', tagline: 'Empowering communities' },
  { slug: 'partner-d', name: 'Partner D', tagline: 'Future forward' },
];

export default function Header({ isAuthenticated = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileOrganisationsOpen, setMobileOrganisationsOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 0);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      setMobileOrganisationsOpen(false);
    }
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOrgMenuOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navLinks = [
    { href: '/events', label: 'Events' },
    { href: '/fellowships', label: 'Fellowships' },
    { href: '/organisations', label: 'Organisations' },
    { href: '/activities', label: 'Activities' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex items-center transition-[height] duration-300 bg-warmPaper/80 dark:bg-deepInk/80 backdrop-blur-md ${
        scrolled ? 'h-headerShrunk' : 'h-header'
      } shadow-md`}
    >
      {/* Mobile menu toggle */}
      <button
        className="ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-deepInk transition hover:bg-deepInk/5 focus-visible:outline-none lg:hidden"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Logo */}
      <div className="flex-1 flex items-center ml-4 lg:ml-8">
        <Link href="/" onClick={closeMobile} className="text-xl font-heading text-deepInk sm:text-2xl">
          Disruptors
        </Link>
      </div>

      {/* Desktop navigation */}
      <nav className="hidden lg:flex space-x-6 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-base font-medium hover:text-vividOrange transition-colors"
            onMouseEnter={link.label === 'Organisations' ? () => setOrgMenuOpen(true) : undefined}
            onMouseLeave={link.label === 'Organisations' ? () => setOrgMenuOpen(false) : undefined}
            aria-haspopup={link.label === 'Organisations' ? 'true' : undefined}
            aria-expanded={link.label === 'Organisations' ? orgMenuOpen : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="hidden lg:flex items-center space-x-4 mr-4 lg:mr-8">
        <button aria-label="Search" className="p-2 hover:text-vividOrange">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1115.5 8.5a7.5 7.5 0 010 15z" />
          </svg>
        </button>
        {!isAuthenticated && (
          <Link href="/signin" className="text-base font-medium hover:text-vividOrange">
            Sign in
          </Link>
        )}
        {isAuthenticated ? (
          <div className="relative">
            {/* Avatar placeholder */}
            <button
              className="flex items-center rounded-full bg-deepInk p-2"
              aria-label="User menu"
              aria-haspopup="true"
            >
              <svg className="w-6 h-6 text-warmPaper" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </button>
            {/* Avatar dropdown – simplified */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-deepInk rounded-md shadow-lg py-1">
              <Link href="/dashboard" className="block px-4 py-2 text-sm hover:bg-warmPaper/50 dark:hover:bg-warmPaper/10">
                Dashboard
              </Link>
              <Link href="/tickets" className="block px-4 py-2 text-sm hover:bg-warmPaper/50 dark:hover:bg-warmPaper/10">
                My tickets
              </Link>
              <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-warmPaper/50 dark:hover:bg-warmPaper/10">
                Profile
              </Link>
              <Link href="/signout" className="block px-4 py-2 text-sm hover:bg-warmPaper/50 dark:hover:bg-warmPaper/10">
                Sign out
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/join"
            className="px-4 py-2 bg-vividOrange text-warmPaper rounded-md font-medium hover:bg-orange-600 transition-colors"
          >
            Join the Movement
          </Link>
        )}
      </div>

      {/* Mega menu for Organisations */}
      {orgMenuOpen && (
        <div
          className="absolute top-full left-0 w-full bg-warmPaper dark:bg-deepInk shadow-lg border-t border-gray-200 dark:border-gray-700"
          onMouseEnter={() => setOrgMenuOpen(true)}
          onMouseLeave={() => setOrgMenuOpen(false)}
        >
          <div className="max-w-7xl mx-auto py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {partners.map((p) => (
              <Link key={p.slug} href={`/organisations/${p.slug}`} className="flex flex-col items-center text-center p-4 hover:bg-warmPaper/50 dark:hover:bg-warmPaper/10 rounded-md">
                <span aria-hidden="true" className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-lg font-bold text-vividOrange">
                  {p.name.slice(-1)}
                </span>
                <span className="font-heading text-deepInk dark:text-warmPaper">{p.name}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{p.tagline}</span>
              </Link>
            ))}
            <Link href="/organisations" className="flex items-center justify-center font-medium text-vividOrange">
              See all →
            </Link>
          </div>
        </div>
      )}

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-deepInk/45 backdrop-blur-[2px]"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside
            id="mobile-navigation"
            className="absolute inset-y-0 left-0 flex w-[min(88vw,24rem)] flex-col overflow-y-auto bg-warmPaper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-deepInk shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
          >
            <div className="flex items-center justify-between border-b border-deepInk/10 pb-5">
              <Link href="/" onClick={closeMobile} className="text-xl font-bold tracking-tight">
                Disruptors
              </Link>
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-deepInk/5"
                aria-label="Close menu"
                onClick={closeMobile}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1 py-5">
              {navLinks.map((link) => (
                link.label === 'Organisations' ? (
                  <div key={link.label}>
                    <div className="flex items-center">
                      <Link
                        href={link.href}
                        className="flex min-h-12 flex-1 items-center rounded-xl px-3 text-base font-semibold transition hover:bg-deepInk/5 hover:text-vividOrange"
                        onClick={closeMobile}
                      >
                        {link.label}
                      </Link>
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-deepInk/5"
                        aria-label="Toggle organisation links"
                        aria-expanded={mobileOrganisationsOpen}
                        aria-controls="mobile-organisation-links"
                        onClick={() => setMobileOrganisationsOpen((open) => !open)}
                      >
                        <svg
                          className={`h-5 w-5 transition-transform ${mobileOrganisationsOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                    {mobileOrganisationsOpen && (
                      <div id="mobile-organisation-links" className="ml-3 border-l border-deepInk/10 py-1 pl-3">
                        {partners.map((partner) => (
                          <Link
                            key={partner.slug}
                            href={`/organisations/${partner.slug}`}
                            className="flex min-h-11 items-center rounded-lg px-3 text-sm text-gray-700 transition hover:bg-orange-50 hover:text-vividOrange"
                            onClick={closeMobile}
                          >
                            {partner.name}
                          </Link>
                        ))}
                        <Link
                          href="/organisations"
                          className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-vividOrange transition hover:bg-orange-50"
                          onClick={closeMobile}
                        >
                          Browse all organisations
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex min-h-12 items-center rounded-xl px-3 text-base font-semibold transition hover:bg-deepInk/5 hover:text-vividOrange"
                    onClick={closeMobile}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </nav>
            <div className="mt-auto space-y-3 border-t border-deepInk/10 pt-5">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="secondary-btn w-full" onClick={closeMobile}>Dashboard</Link>
                  <Link href="/tickets" className="secondary-btn w-full" onClick={closeMobile}>My tickets</Link>
                  <Link href="/profile" className="secondary-btn w-full" onClick={closeMobile}>Profile</Link>
                  <Link href="/signout" className="primary-btn w-full" onClick={closeMobile}>Sign out</Link>
                </>
              ) : (
                <>
                  <Link href="/signin" className="secondary-btn w-full" onClick={closeMobile}>Sign in</Link>
                  <Link href="/join" className="primary-btn w-full" onClick={closeMobile}>Join the movement</Link>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}

