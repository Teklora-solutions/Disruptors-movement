import { notFound } from 'next/navigation';

const partners = {
  'partner-a': {
    name: 'Partner A',
    tagline: 'Innovating together',
    description: 'Partner A brings grassroots youth innovation, mentoring and practical collaboration to local change initiatives.',
  },
  'partner-b': {
    name: 'Partner B',
    tagline: 'Driving change',
    description: 'Partner B helps communities build collaborative strategy and action plans that translate energy into visible impact.',
  },
  'partner-c': {
    name: 'Partner C',
    tagline: 'Empowering communities',
    description: 'Partner C supports practical learning, resilience and stronger local leadership across the movement.',
  },
  'partner-d': {
    name: 'Partner D',
    tagline: 'Future forward',
    description: 'Partner D explores new models for leadership, storytelling and creative engagement with young people across sectors.',
  },
} as const;

export default async function OrganisationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const partner = partners[slug as keyof typeof partners];

  if (!partner) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="rounded-[30px] bg-deepInk p-8 text-warmPaper shadow-[0_26px_55px_rgba(14,15,26,0.18)] sm:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-orange-200">{partner.tagline}</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">{partner.name}</h1>
      </section>

      <section className="mt-8 rounded-[28px] border border-gray-200 bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-8">
        <p className="text-lg leading-8 text-gray-700">{partner.description}</p>
      </section>
    </main>
  );
}
