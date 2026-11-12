export default function ProfilePage() {
  return (
    <main className="page-shell">
      <section>
        <p className="eyebrow">Profile</p>
        <h1 className="section-heading text-4xl sm:text-5xl">Your profile</h1>
      </section>

      <section className="mt-10 rounded-[30px] border border-gray-200 bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            ['Name', 'Aisha Karim'],
            ['County', 'Greater Manchester'],
            ['Interests', 'Leadership, campaigning, community projects'],
            ['Contact', 'aisha@example.com'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-orange-50 p-5">
              <p className="text-sm text-gray-600">{label}</p>
              <p className="mt-2 text-xl font-semibold text-deepInk">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
