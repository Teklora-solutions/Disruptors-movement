import Link from 'next/link';

const highlights = [
  { title: 'Events', value: '24+', description: 'Opportunities to connect and act.' },
  { title: 'Fellowships', value: '8', description: 'Leadership pathways growing across the network.' },
  { title: 'Activities', value: '31', description: 'Hands-on learning and local impact projects.' },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="mx-auto max-w-5xl pt-8 text-center sm:pt-10 lg:pt-14">
        <div className="inline-flex items-center rounded-full border border-vividOrange/20 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-vividOrange">
          Community • Leadership • Action
        </div>
        <h1 className="section-heading mx-auto text-balance">Disruptors Movement</h1>
        <p className="subheading mx-auto text-balance">
          Events, fellowships and activities from organisations across the movement.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/join" className="primary-btn min-w-[190px]">
            Join the movement
          </Link>
          <Link href="/events" className="secondary-btn min-w-[190px]">
            Explore events
          </Link>
        </div>
      </section>

      <section className="mt-14 grid gap-5 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="feature-card p-6 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-vividOrange">{item.title}</p>
            <p className="mt-4 text-4xl font-bold tracking-[-0.06em] text-deepInk">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-gray-700">{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

