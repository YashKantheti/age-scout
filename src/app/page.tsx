import Link from 'next/link';

const FEATURES = [
  {
    icon: 'barcode_scanner',
    title: 'AI-Powered Identification',
    desc: 'Point your camera at any AGE part. Our AI identifies it in seconds — NSN, T.O. references, stock status, and more.',
  },
  {
    icon: 'menu_book',
    title: 'Instant Technical Orders',
    desc: 'Every scan surfaces the relevant T.O.s automatically. No more manual lookups through binders.',
  },
  {
    icon: 'chat',
    title: 'AI Maintenance Advisor',
    desc: 'Ask follow-up questions about any part. Get sourcing guidance, compatibility checks, and maintenance notes.',
  },
  {
    icon: 'inventory_2',
    title: 'Supply Cart & History',
    desc: 'Add parts to a cart for procurement, track your scan history, and share findings with your team.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060d1a] text-white flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#005A9C] rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[18px]">flight_takeoff</span>
          </div>
          <span className="text-base font-black uppercase tracking-[0.12em]">AGE Scout</span>
        </div>
        <Link
          href="/app"
          className="bg-[#005A9C] hover:bg-[#004d87] text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors"
        >
          Open App
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 md:py-32">
        <div className="inline-flex items-center gap-2 bg-[#005A9C]/20 border border-[#005A9C]/40 text-[#60a5fa] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
          <span className="material-symbols-outlined text-[14px]">military_tech</span>
          USAF Aerospace Ground Equipment
        </div>

        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none mb-6">
          Identify Any<br />
          <span className="text-[#005A9C]">AGE Part</span><br />
          In Seconds
        </h1>

        <p className="text-white/60 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
          Snap a photo. Get the NSN, technical orders, stock status, and AI-powered maintenance guidance — instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/app"
            className="flex items-center gap-2.5 bg-[#005A9C] hover:bg-[#004d87] text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg shadow-[#005A9C]/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
            Start Scanning
          </Link>
          <span className="text-white/30 text-sm">No account required</span>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold text-white/30 uppercase tracking-widest mb-10">Capabilities</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#005A9C]/50 transition-colors">
                <span className="material-symbols-outlined text-[#005A9C] text-[28px] block mb-3">{f.icon}</span>
                <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 text-center">
        <p className="text-white/30 text-xs">
          Built by <span className="text-white/60 font-bold">Team Falcon</span> · Virginia Tech · Spring 2026
        </p>
      </footer>

      {/* Material Icons */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
