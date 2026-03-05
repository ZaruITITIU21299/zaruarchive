import { useNavigate } from "react-router-dom";

const eventData = {
  category: "Cataclysmic Event",
  classification: "OMEGA-CLASS",
  title: "The Great Collapse",
  date: "Year 1024 — Third Epoch",
  heroImage: "https://picsum.photos/seed/collapse-hero/800/450",
  stats: [
    { label: "Casualties", value: "~2.4 Million", icon: "skull" },
    { label: "Duration", value: "47 Days", icon: "schedule" },
  ],
  tags: [
    "#Cataclysm",
    "#Solaris-3",
    "#Energy-Crisis",
    "#Displacement",
    "#Third-Epoch",
    "#Core-Failure",
  ],
  artifacts: Array.from({ length: 9 }, (_, i) => ({
    id: i,
    image: `https://picsum.photos/seed/artifact-${i}/200/200`,
    label: `Fragment ${String(i + 1).padStart(2, "0")}`,
  })),
};

export function TimelineDetailPanel() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => navigate(-1)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-2xl h-screen flex flex-col bg-[#101e23] border-l border-primary/20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] overflow-y-auto">
        {/* Header bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#101e23] border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[20px]">
              history
            </span>
            <span className="text-sm font-semibold text-slate-300 tracking-wider uppercase">
              Timeline Archive
            </span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 transition-all group"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-primary transition-colors">
              close
            </span>
          </button>
        </div>

        {/* Hero image */}
        <div className="relative aspect-video flex-shrink-0">
          <img
            src={eventData.heroImage}
            alt={eventData.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101e23] via-[#101e23]/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-bold border border-accent-purple/30">
                {eventData.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-bold border border-red-500/30">
                {eventData.classification}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-[--font-display] text-white mb-1">
              {eventData.title}
            </h2>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">
                calendar_month
              </span>
              {eventData.date}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-8">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            {eventData.stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 p-4 rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-accent-purple">
                    {stat.icon}
                  </span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <p className="text-lg font-bold text-white font-[--font-display]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Narrative */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                description
              </span>
              Event Narrative
            </h3>
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <p>
                The Great Collapse began without warning on the 14th day of the
                Third Epoch's final cycle. Deep beneath the surface of{" "}
                <span className="glossary-link">Solaris-3</span>, the planet's
                core — long stabilized by the{" "}
                <span className="glossary-link">Helix Containment Array</span> —
                experienced a catastrophic resonance failure.
              </p>
              <p>
                Within hours, seismic events cascaded across every continental
                plate. The <span className="glossary-link">Aetherium Grid</span>
                , which had powered civilizations for over three centuries, went
                dark. Communications collapsed. The orbital stations lost
                telemetry. For the first time in recorded history, Solaris-3 was
                silent.
              </p>
              <p>
                Survivors describe the sky turning a deep violet as energy bled
                from the fractured core into the upper atmosphere. The{" "}
                <span className="glossary-link">Remnant Council</span> would
                later classify this event as an "Omega-Class extinction-level
                scenario" — the first and only such designation in the archive's
                history.
              </p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                sell
              </span>
              Related Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {eventData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 text-xs text-slate-400 hover:text-primary cursor-pointer transition-all"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Recovered artifacts */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                grid_view
              </span>
              Recovered Artifacts
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {eventData.artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-white/5 hover:border-primary/30 transition-all"
                >
                  <img
                    src={artifact.image}
                    alt={artifact.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {artifact.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 px-6 py-4 bg-[#101e23] border-t border-white/5">
          <button className="relative w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent-purple text-white font-bold font-[--font-display] text-sm tracking-wide overflow-hidden group">
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">
                account_tree
              </span>
              View Sub-Timeline
            </span>
            {/* Shimmer effect */}
            <span className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_0.8s_ease-in-out] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </button>
          <p className="text-center text-[10px] text-slate-600 mt-2 tracking-widest uppercase">
            Clearance Level: Public — Restricted sections redacted
          </p>
        </div>
      </div>
    </div>
  );
}
