import Link from 'next/link';

const pillars = [
  {
    title: 'Community first',
    description: 'We build spaces where young people can belong, learn and lead with confidence.',
  },
  {
    title: 'Action through collaboration',
    description: 'Events, fellowships and workshops turn insight into momentum across the movement.',
  },
  {
    title: 'Local rooted, national connected',
    description: 'We support grassroots action while connecting organisations and changemakers nationwide.',
  },
];

export default function AboutPage() {
  return (
    <main className="page-shell">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="eyebrow mb-4">About</p>
          <h1 className="section-heading text-4xl sm:text-5xl">Building a stronger youth movement.</h1>
          <p className="subheading max-w-xl">
            Disruptors Movement brings together organisers, partners and emerging leaders to elevate
            opportunities for action, learning and belonging across communities.
          </p>
        </div>
        <div className="rounded-[28px] bg-deepInk p-8 text-warmPaper shadow-[0_26px_55px_rgba(14,15,26,0.18)]">
          <p className="text-sm uppercase tracking-[0.2em] text-orange-200">Our mission</p>
          <p className="mt-4 text-2xl font-bold leading-relaxed text-white sm:text-3xl">
            To create connected spaces where young people can build practical skills, relationships and
            confidence to shape the future.
          </p>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="feature-card p-6">
            <h2 className="text-2xl font-bold text-deepInk">{pillar.title}</h2>
            <p className="mt-4 text-gray-700">{pillar.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-16 rounded-[28px] border border-gray-200 bg-white/70 p-8 shadow-sm">
        <h2 className="text-3xl font-bold text-deepInk">How we work</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ['01', 'Connect', 'We help members discover the organisations, events and programmes that match their interests.'],
            ['02', 'Collaborate', 'We create pathways for shared learning, planning and collective action across networks.'],
            ['03', 'Grow', 'We support practical skill-building, leadership and opportunities for local impact.'],
          ].map(([number, title, description]) => (
            <div key={number} className="rounded-2xl bg-orange-50 p-5">
              <p className="text-3xl font-bold text-vividOrange">{number}</p>
              <h3 className="mt-3 text-xl font-bold text-deepInk">{title}</h3>
              <p className="mt-2 text-gray-700">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 text-center">
        <h2 className="text-3xl font-bold text-deepInk">Ready to be part of it?</h2>
        <Link href="/join" className="primary-btn mt-6">
          Join the movement
        </Link>
      </section>
    </main>
  );
}
