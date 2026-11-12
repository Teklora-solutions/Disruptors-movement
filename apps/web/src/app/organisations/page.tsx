import Link from 'next/link';

const partners = [
  { slug: 'partner-a', name: 'Partner A', tagline: 'Innovating together', description: 'Community-centred experimentation and bold youth-led projects.' },
  { slug: 'partner-b', name: 'Partner B', tagline: 'Driving change', description: 'Strategy, engagement and partner coordination across communities.' },
  { slug: 'partner-c', name: 'Partner C', tagline: 'Empowering communities', description: 'Support for local organising, learning and resilience-building.' },
  { slug: 'partner-d', name: 'Partner D', tagline: 'Future forward', description: 'New ideas, digital tools and leadership pathways for the next generation.' },
];

export default function OrganisationsPage() {
  return (
    <main className="page-shell">
      <section className="max-w-2xl">
        <p className="eyebrow">Organisations</p>
        <h1 className="section-heading text-4xl sm:text-5xl">Across the movement, from local action to national collaboration.</h1>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {partners.map((partner) => (
          <Link
            key={partner.slug}
            href={`/organisations/${partner.slug}`}
            className="feature-card flex flex-col p-6"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-vividOrange">{partner.tagline}</p>
            <h2 className="mt-4 text-2xl font-bold text-deepInk">{partner.name}</h2>
            <p className="mt-3 text-gray-700">{partner.description}</p>
            <span className="mt-6 text-sm font-semibold text-vividOrange">Learn more →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
