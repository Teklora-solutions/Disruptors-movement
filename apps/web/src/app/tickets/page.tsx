const tickets = [
  {
    title: 'Youth Leadership Summit',
    date: '12 Oct 2026',
    status: 'Confirmed',
  },
  {
    title: 'Community Organising Lab',
    date: '25 Oct 2026',
    status: 'Waiting list',
  },
];

export default function TicketsPage() {
  return (
    <main className="page-shell">
      <section className="max-w-xl">
        <p className="eyebrow">My tickets</p>
        <h1 className="section-heading text-4xl sm:text-5xl">Your upcoming access.</h1>
      </section>

      <section className="mt-12 space-y-6">
        {tickets.map((ticket) => (
          <article
            key={ticket.title}
            className="flex flex-col justify-between gap-6 rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:flex-row md:items-center md:p-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-deepInk">{ticket.title}</h2>
              <p className="mt-2 text-gray-700">{ticket.date}</p>
            </div>
            <span className="inline-flex rounded-full bg-orange-100 px-3 py-2 text-sm font-semibold text-vividOrange">
              {ticket.status}
            </span>
          </article>
        ))}
      </section>
    </main>
  );
}
