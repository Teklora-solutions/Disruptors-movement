const activities = [
  {
    title: 'Community hack sessions',
    description: 'Hands-on sessions where members learn, prototype and test ideas for positive local change.',
    tag: 'Creative',
  },
  {
    title: 'Leadership circles',
    description: 'Small-group conversations focused on confidence, communication and collective decision-making.',
    tag: 'Growth',
  },
  {
    title: 'Local action projects',
    description: 'Practical opportunities to implement community initiatives and collaborate with partners.',
    tag: 'Impact',
  },
  {
    title: 'Skills clinics',
    description: 'Rapid learning sessions on storytelling, campaigning, organising, and digital tools.',
    tag: 'Learning',
  },
];

export default function ActivitiesPage() {
  return (
    <main className="page-shell">
      <section className="max-w-2xl">
        <p className="eyebrow">Activities</p>
        <h1 className="section-heading text-4xl sm:text-5xl">Projects and experiences that turn ideas into action.</h1>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        {activities.map((activity) => (
          <article key={activity.title} className="feature-card p-6">
            <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-vividOrange">
              {activity.tag}
            </span>
            <h2 className="mt-4 text-2xl font-bold text-deepInk">{activity.title}</h2>
            <p className="mt-3 text-gray-700">{activity.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
