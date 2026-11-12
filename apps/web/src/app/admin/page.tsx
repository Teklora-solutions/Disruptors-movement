const adminCards = [
  { title: 'Members', value: '1,284' },
  { title: 'Events', value: '24' },
  { title: 'Partnerships', value: '12' },
  { title: 'Open tickets', value: '46' },
];

export default function AdminPage() {
  return (
    <main className="page-shell">
      <section>
        <p className="eyebrow">Admin</p>
        <h1 className="section-heading text-4xl sm:text-5xl">Movement operations dashboard</h1>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {adminCards.map((card) => (
          <div key={card.title} className="metric-card p-6">
            <p className="text-sm text-gray-600">{card.title}</p>
            <p className="mt-4 text-3xl font-bold tracking-[-0.06em] text-deepInk">{card.value}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
