const events = [
  {
    date: '12 Oct',
    title: 'Youth Leadership Summit',
    location: 'Manchester',
    description: 'A full-day programme connecting emerging leaders with practical tools and local networks.',
  },
  {
    date: '25 Oct',
    title: 'Community Organising Lab',
    location: 'Birmingham',
    description: 'An interactive workshop exploring campaign design, partnerships and local mobilisation.',
  },
  {
    date: '7 Nov',
    title: 'Movement Mixer',
    location: 'London',
    description: 'A networking evening for volunteers, organisers and grassroots leaders across the movement.',
  },
];

export default function EventsPage() {
  return (
    <main className="page-shell">
      <section className="max-w-2xl">
        <p className="eyebrow">Events</p>
        <h1 className="section-heading text-4xl sm:text-5xl">Find the next space to connect, learn and act.</h1>
      </section>

      <section className="mt-12 space-y-6">
        {events.map((event) => (
          <article
            key={event.title}
            className="grid gap-4 rounded-[28px] border border-gray-200 bg-white/75 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:grid-cols-[140px_1fr_auto] md:items-center md:p-6"
          >
            <div className="flex h-full min-h-[84px] items-center justify-center rounded-2xl bg-orange-100 px-4 py-3 text-center text-vividOrange ring-1 ring-orange-100">
              <div className="text-xl font-bold">{event.date}</div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-deepInk">{event.title}</h2>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.12em] text-gray-500">{event.location}</p>
              <p className="mt-3 text-gray-700">{event.description}</p>
            </div>
            <button className="primary-btn w-full md:w-auto">Register</button>
          </article>
        ))}
      </section>
    </main>
  );
}
