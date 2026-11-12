import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Server component protecting /admin routes based on role
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get('authToken')?.value;
  if (!token) redirect('/signin');

  // Fetch user profile (including role) from API
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/members/me`, {
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

