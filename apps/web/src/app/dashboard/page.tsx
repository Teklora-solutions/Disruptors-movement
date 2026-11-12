const cards = [
  { label: 'Upcoming events', value: '04' },
  { label: 'Saved activities', value: '12' },
  { label: 'Fellowships', value: '03' },
  { label: 'Profile progress', value: '82%' },
];

const recent = [
  { title: 'Community Organising Lab', date: '25 Oct • Birmingham' },
  { title: 'Youth Leadership Summit', date: '12 Oct • Manchester' },
  { title: 'Creative Leadership Fellowship', date: 'Applications open' },
];

export default function DashboardPage() {
  return (
    <main className="page-shell">
      <section>
        <p className="eyebrow">Dashboard</p>
        <h1 className="section-heading text-4xl sm:text-5xl">Welcome back, Aisha.</h1>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="metric-card p-6">
            <p className="text-sm text-gray-600">{card.label}</p>
            <p className="mt-4 text-3xl font-bold tracking-[-0.06em] text-deepInk">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] bg-deepInk p-8 text-warmPaper shadow-[0_22px_45px_rgba(14,15,26,0.18)]">
          <h2 className="text-2xl font-bold">This week</h2>
          <ul className="mt-6 space-y-4">
            {recent.map((item) => (
              <li key={item.title} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-1 text-sm text-orange-200">{item.date}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-[28px] border border-gray-200 bg-white/75 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-bold text-deepInk">Recommended next steps</h2>
          <ul className="mt-6 space-y-4 text-gray-700">
            <li>Complete your profile so organisers can match you with opportunities.</li>
            <li>Save two activities that align with your interests.</li>
            <li>Review the leadership fellowship application window.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
