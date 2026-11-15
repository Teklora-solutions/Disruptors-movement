import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Server component protecting /admin routes based on role
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get('dm_session')?.value;
  if (!token) redirect('/signin');

  // Fetch user profile (including role) from API
  // Server-side call, so it goes straight to the API (http://api:4000 in Docker).
  // Not NEXT_PUBLIC_*: those are frozen into the bundle at build time.
  const apiOrigin = process.env.API_ORIGIN || 'http://localhost:4000';
  const res = await fetch(`${apiOrigin}/api/members/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store', // always fresh for auth checks
  });
  if (!res.ok) redirect('/signin');
  const user = await res.json();

  const allowedRoles = ['SUPER_ADMIN', 'MOVEMENT_ADMIN'];
  if (!allowedRoles.includes(user.platformRole)) redirect('/');

  return (
    <section className="min-h-screen bg-warmPaper dark:bg-deepInk p-4">
      {/* Admin navigation placeholder */}
      {children}
    </section>
  );
}

