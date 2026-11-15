'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Skeleton } from '../components/Skeleton';
import { Notice } from '../components/AuthCard';
import { formatEventDate, getMemberJson, listWithAnd } from '../lib/auth-client';

type EventSummary = {
  id: string;
  title: string;
  startsAt: string;
  location: string | null;
  onlineUrl: string | null;
  priceKes: number;
  organisation: { name: string; slug: string };
};
type Dashboard = {
  member: { name: string | null; email: string; memberSince: string };
  stats: { upcomingEvents: number; tickets: number; applications: number; profileComplete: number };
  missingProfileFields: string[];
  upcoming: Array<{ id: string; status: 'CONFIRMED' | 'PENDING_PAYMENT'; event: EventSummary }>;
  suggestions: EventSummary[];
};

const where = (e: EventSummary) => e.location ?? (e.onlineUrl ? 'Online' : 'Location to be confirmed');

function EventRow({ event, badge }: { event: EventSummary; badge?: string }) {
  return (
    <li className="rounded-2xl border border-white/15 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-white">{event.title}</p>
        {badge && <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-xs text-orange-200">{badge}</span>}
      </div>
      <p className="mt-1 text-sm text-orange-200">{formatEventDate(event.startsAt)} • {where(event)}</p>
      <p className="mt-1 text-xs text-white/60">{event.organisation.name}</p>
    </li>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [justVerified, setJustVerified] = useState(false);

  useEffect(() => {
    setJustVerified(new URLSearchParams(window.location.search).get('verified') === '1');
    getMemberJson<Dashboard>('/api/members/me/dashboard').then(setData, () =>
      setError('We could not load your dashboard. Please refresh the page.'),
    );
  }, []);

  const firstName = data?.member.name?.split(' ')[0];
  const cards = data
    ? [
        { label: 'Upcoming events', value: data.stats.upcomingEvents, href: '/tickets' },
        { label: 'Confirmed tickets', value: data.stats.tickets, href: '/tickets' },
        { label: 'Fellowship applications', value: data.stats.applications, href: '/fellowships' },
        { label: 'Profile complete', value: `${data.stats.profileComplete}%`, href: '/profile' },
      ]
    : [];

  const nextSteps: Array<{ text: string; href: string }> = [];
  if (data) {
    if (data.missingProfileFields.length > 0) {
      nextSteps.push({ text: `Add your ${listWithAnd(data.missingProfileFields).toLowerCase()} so organisers can match you with opportunities.`, href: '/profile?edit=1' });
    }
    if (data.stats.upcomingEvents === 0) nextSteps.push({ text: 'Register for an upcoming event.', href: '/events' });
    if (data.stats.applications === 0) nextSteps.push({ text: 'Look through open fellowships.', href: '/fellowships' });
    nextSteps.push({ text: 'Discover organisations in the movement.', href: '/organisations' });
  }

  return (
    <main className="page-shell">
      {justVerified && (
        <div className="mb-8">
          <Notice tone="success">Your email is confirmed. Welcome to the Disruptors Movement!</Notice>
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <section>
        <p className="eyebrow">Dashboard</p>
        {data ? (
          <h1 className="section-heading text-4xl sm:text-5xl">{firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}</h1>
        ) : (
          <Skeleton className="mt-4 h-14 w-80 max-w-full" />
        )}
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {data
          ? cards.map((card) => (
              <Link key={card.label} href={card.href} className="metric-card p-6 transition hover:-translate-y-0.5">
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="mt-4 text-3xl font-bold tracking-[-0.06em] text-deepInk">{card.value}</p>
              </Link>
            ))
          : [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[140px] rounded-3xl" />)}
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] bg-deepInk p-8 text-warmPaper shadow-[0_22px_45px_rgba(14,15,26,0.18)]">
          {!data ? (
            <Skeleton className="h-40 bg-white/10" />
          ) : data.upcoming.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold">Your next events</h2>
              <ul className="mt-6 space-y-4">
                {data.upcoming.map((r) => (
                  <EventRow key={r.id} event={r.event} badge={r.status === 'CONFIRMED' ? 'Confirmed' : 'Awaiting payment'} />
                ))}
              </ul>
              {data.stats.upcomingEvents > data.upcoming.length && (
                <Link href="/tickets" className="mt-6 inline-block text-sm font-semibold text-orange-200">See all {data.stats.upcomingEvents} →</Link>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Coming up</h2>
              <p className="mt-2 text-sm text-orange-100">You have not registered for any events yet. Here is what is next across the movement.</p>
              {data.suggestions.length > 0 ? (
                <ul className="mt-6 space-y-4">
                  {data.suggestions.map((e) => <EventRow key={e.id} event={e} />)}
                </ul>
              ) : (
                <p className="mt-6 text-orange-100">No upcoming events have been published yet. Check back soon.</p>
              )}
              <Link href="/events" className="mt-6 inline-block text-sm font-semibold text-orange-200">Browse all events →</Link>
            </>
          )}
        </div>

        <aside className="rounded-[28px] border border-gray-200 bg-white/75 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-bold text-deepInk">Recommended next steps</h2>
          {data ? (
            <ul className="mt-6 space-y-4 text-gray-700">
              {nextSteps.map((s) => (
                <li key={s.text}>
                  <Link href={s.href} className="hover:text-vividOrange">{s.text}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <Skeleton className="mt-6 h-24" />
          )}
        </aside>
      </section>
    </main>
  );
}
