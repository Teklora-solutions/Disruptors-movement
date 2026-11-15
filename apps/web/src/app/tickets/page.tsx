'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Skeleton } from '../components/Skeleton';
import { Notice } from '../components/AuthCard';
import { formatEventDate, getMemberJson } from '../lib/auth-client';

type Registration = {
  id: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  ticketCode: string | null;
  event: {
    title: string;
    startsAt: string;
    location: string | null;
    onlineUrl: string | null;
    organisation: { name: string };
  };
};

const STATUS: Record<Registration['status'], { label: string; className: string }> = {
  CONFIRMED: { label: 'Confirmed', className: 'bg-green-100 text-green-800' },
  PENDING_PAYMENT: { label: 'Awaiting payment', className: 'bg-orange-100 text-vividOrange' },
  EXPIRED: { label: 'Hold expired', className: 'bg-gray-100 text-gray-600' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600' },
};

function TicketCard({ r }: { r: Registration }) {
  const isPast = new Date(r.event.startsAt).getTime() < Date.now();
  // A held place for an event that has happened is just history now.
  const s = isPast && (r.status === 'CONFIRMED' || r.status === 'PENDING_PAYMENT')
    ? { label: 'Past event', className: 'bg-gray-100 text-gray-600' }
    : STATUS[r.status];
  return (
    <article className="flex flex-col justify-between gap-6 rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:flex-row md:items-center md:p-6">
      <div>
        <h2 className="text-2xl font-bold text-deepInk">{r.event.title}</h2>
        <p className="mt-2 text-gray-700">
          {formatEventDate(r.event.startsAt)} • {r.event.location ?? (r.event.onlineUrl ? 'Online' : 'Location to be confirmed')}
        </p>
        <p className="mt-1 text-sm text-gray-500">{r.event.organisation.name}</p>
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        <span className={`inline-flex rounded-full px-3 py-2 text-sm font-semibold ${s.className}`}>{s.label}</span>
        {r.status === 'CONFIRMED' && r.ticketCode && !isPast && (
          <span className="font-mono text-sm text-gray-600">Ticket {r.ticketCode.toUpperCase()}</span>
        )}
      </div>
    </article>
  );
}

export default function TicketsPage() {
  const [regs, setRegs] = useState<Registration[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMemberJson<Registration[]>('/api/registrations/me').then(setRegs, () =>
      setError('We could not load your tickets. Please refresh the page.'),
    );
  }, []);

  const now = Date.now();
  const upcoming = regs?.filter((r) => new Date(r.event.startsAt).getTime() >= now && (r.status === 'CONFIRMED' || r.status === 'PENDING_PAYMENT')) ?? [];
  const past = regs?.filter((r) => !upcoming.includes(r)).reverse() ?? [];

  return (
    <main className="page-shell">
      <section className="max-w-xl">
        <p className="eyebrow">My tickets</p>
        <h1 className="section-heading text-4xl sm:text-5xl">Your upcoming access.</h1>
      </section>

      {error && <div className="mt-8"><Notice tone="error">{error}</Notice></div>}

      <section className="mt-12 space-y-6">
        {!regs && !error && [0, 1].map((i) => <Skeleton key={i} className="h-[120px] rounded-[28px]" />)}
        {regs && upcoming.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-gray-300 bg-white/60 p-8 text-center">
            <p className="text-lg font-semibold text-deepInk">No upcoming tickets yet.</p>
            <p className="mt-2 text-gray-600">When you register for an event, your ticket shows up here.</p>
            <Link href="/events" className="primary-btn mt-6">Find an event</Link>
          </div>
        )}
        {upcoming.map((r) => <TicketCard key={r.id} r={r} />)}
      </section>

      {past.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-deepInk">Past and cancelled</h2>
          <div className="mt-6 space-y-6 opacity-80">
            {past.map((r) => <TicketCard key={r.id} r={r} />)}
          </div>
        </section>
      )}
    </main>
  );
}
