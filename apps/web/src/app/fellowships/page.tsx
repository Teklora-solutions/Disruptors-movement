const fellowships = [
  {
    title: 'Community Organising Fellowship',
    focus: 'Campaign design, partner building and local mobilisation.',
  },
  {
    title: 'Creative Leadership Fellowship',
    focus: 'Storytelling, facilitation and youth engagement strategies.',
  },
  {
    title: 'Policy & Advocacy Fellowship',
    focus: 'Research, public speaking and policy engagement for change-makers.',
  },
];

export default function FellowshipsPage() {
  return (
    <main className="page-shell">
      <section className="max-w-2xl">
        <p className="eyebrow">Fellowships</p>
        <h1 className="section-heading text-4xl sm:text-5xl">Leadership opportunities designed for meaningful change.</h1>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {fellowships.map((fellowship) => (
          <article key={fellowship.title} className="feature-card flex flex-col p-6">
            <div className="inline-flex w-fit rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-vividOrange">
              Fellowship
            </div>
            <h2 className="mt-5 text-2xl font-bold text-deepInk">{fellowship.title}</h2>
            <p className="mt-4 flex-1 text-gray-700">{fellowship.focus}</p>
            <button className="primary-btn mt-6 w-full">Apply now</button>
          </article>
        ))}
      </section>
    </main>
  );
}
