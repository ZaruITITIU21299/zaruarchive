import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { useGame } from "@/contexts/GameContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminService } from "@/services/AdminService";
import { ArticleService } from "@/services/ArticleService";
import { ArticleForm, type ArticleFormData } from "@/components/admin/forms/ArticleForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { ArticleListItem } from "@/types";

type Status = "All" | "Speculative" | "Plausible" | "Proven" | "Debunked";

/** Display shape for a theory card (API data + optional placeholder fields for UI). */
interface TheoryEntry {
  id: string;
  title: string;
  summary: string;
  status: Exclude<Status, "All">;
  tags: string[];
  author: string;
  date: string;
}

function formatListDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toTheoryEntry(item: ArticleListItem): TheoryEntry {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    status: "Speculative",
    author: "—",
    date: formatListDate(item.publishedAt),
    tags: [],
  };
}

const STATUSES: Status[] = [
  "All",
  "Speculative",
  "Plausible",
  "Proven",
  "Debunked",
];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> =
  {
    Speculative: {
      bg: "bg-purple-500/15",
      text: "text-purple-400",
      dot: "bg-purple-400",
    },
    Plausible: { bg: "bg-sky-500/15", text: "text-sky-400", dot: "bg-sky-400" },
    Proven: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    Debunked: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
  };

/** Example/placeholder entries for reference (not used when real data is loaded). */
const EXAMPLE_ENTRIES: TheoryEntry[] = [
  { id: "1", title: "The Great Filter of Sector 7", summary: "Recurring signal anomalies at the edge of Sector 7 may correlate with Void Walker migration patterns, suggesting intentional communication beacons.", status: "Speculative", tags: ["Anomaly", "Sector 7"], author: "Dr. Elara Voss", date: "Feb 24" },
  { id: "2", title: "Resonance Cascade Hypothesis", summary: "A unified model explaining how Resonance Liberation energy interacts with Tacet Discord at the quantum level, potentially unlocking controlled dissipation.", status: "Plausible", tags: ["Resonance", "Energy"], author: "Dr. Mira Chen", date: "Feb 18" },
  { id: "3", title: "Sentinel Origin Theory", summary: "Archaeological evidence points to Sentinels being engineered rather than evolved, with core signatures matching pre-Lament technology.", status: "Proven", tags: ["Sentinel", "History"], author: "Archivist Kael", date: "Feb 10" },
  { id: "4", title: "Dual-Core Solaris Model", summary: "The hypothesis that Solaris-3 once contained two planetary cores has been disproven by deep seismic scans from the Helix Array restoration project.", status: "Debunked", tags: ["Geology", "Solaris-3"], author: "Geo Division", date: "Jan 30" },
  { id: "5", title: "Chrono-Synapse Neural Pathway", summary: "Temporal perception distortion in affected individuals may be linked to dormant resonance frequencies embedded in pre-Lament neural implants.", status: "Speculative", tags: ["Medical", "Chrono-Synapse"], author: "Dr. Mira Chen", date: "Jan 22" },
  { id: "6", title: "Aetherium Grid Overload Cause", summary: "New evidence suggests the Grid failure during the Collapse was triggered by a coordinated external signal, not internal resonance feedback.", status: "Plausible", tags: ["Aetherium", "Collapse"], author: "Intel Division", date: "Jan 15" },
];

const SORT_OPTIONS = ["Newest", "Oldest", "A → Z"] as const;

export default function TheoryPage() {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<Status>("All");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>("Newest");
  const { editMode } = useAdmin();
  const { gameId } = useGame();
  const { lang } = useLanguage();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TheoryEntry | null>(null);
  const [editingArticle, setEditingArticle] = useState<Awaited<ReturnType<AdminService["getArticle"]>> | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTheories = () => {
    if (!gameId || !lang) return;
    setLoadingList(true);
    const svc = new ArticleService(gameId, lang);
    svc.fetchAll("theory").then((data) => {
      setArticles(data);
    }).finally(() => setLoadingList(false));
  };

  useEffect(() => {
    fetchTheories();
  }, [gameId, lang]);

  const entries: TheoryEntry[] = useMemo(
    () => articles.map(toTheoryEntry),
    [articles]
  );

  const handleSave = async (data: ArticleFormData) => {
    const svc = new AdminService(gameId, lang);
    if (editingEntry) {
      await svc.updateArticle(editingEntry.id, {
        title: { en: data.title_en, vi: data.title_vi },
        summary: { en: data.summary_en, vi: data.summary_vi },
        content: { en: data.content_en, vi: data.content_vi },
        section: 'theory',
        image_path: data.image_path,
        read_time_min: data.read_time_min,
        is_featured: data.is_featured,
      });
    } else {
      await svc.createArticle({
        title: { en: data.title_en, vi: data.title_vi },
        summary: { en: data.summary_en, vi: data.summary_vi },
        content: { en: data.content_en, vi: data.content_vi },
        section: 'theory',
        image_path: data.image_path,
        read_time_min: data.read_time_min,
        is_featured: data.is_featured,
      });
    }
    setFormOpen(false);
    setEditingEntry(null);
    setEditingArticle(null);
    fetchTheories();
  };

  const openEditForm = (entry: TheoryEntry) => {
    setEditingEntry(entry);
    setEditingArticle(null);
    setLoadingArticle(true);
    const svc = new AdminService(gameId, lang);
    svc.getArticle(entry.id).then((article) => {
      setEditingArticle(article ?? null);
      if (article) setFormOpen(true);
    }).finally(() => {
      setLoadingArticle(false);
    });
  };

  const openAddForm = () => {
    setEditingEntry(null);
    setEditingArticle(null);
    setFormOpen(true);
  };

  const formArticle = formOpen && editingEntry && editingArticle
    ? {
        id: editingArticle.id,
        title: editingArticle.translations.en?.title ?? '',
        summary: editingArticle.translations.en?.summary ?? '',
        content_en: editingArticle.translations.en?.content ?? undefined,
        content_vi: editingArticle.translations.vi?.content ?? undefined,
        title_vi: editingArticle.translations.vi?.title ?? '',
        summary_vi: editingArticle.translations.vi?.summary ?? '',
        imagePath: editingArticle.image_path,
        section: editingArticle.section,
        readTimeMin: editingArticle.read_time_min,
        isFeatured: editingArticle.is_featured,
      }
    : formOpen && editingEntry
      ? {
          id: editingEntry.id,
          title: editingEntry.title,
          summary: editingEntry.summary,
          imagePath: null as string | null,
          section: 'theory' as const,
          readTimeMin: null as number | null,
          isFeatured: false,
        }
      : null;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const svc = new AdminService(gameId, lang);
    await svc.deleteArticle(deleteTarget);
    setDeleteTarget(null);
    setDeleting(false);
    fetchTheories();
  };

  const filtered = useMemo(() => {
    let results = entries.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.summary.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = activeStatus === "All" || e.status === activeStatus;
      return matchesSearch && matchesStatus;
    });
    if (sort === "A → Z") results = [...results].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "Oldest") results = [...results].reverse();
    return results;
  }, [entries, search, activeStatus, sort]);

  const style = (s: string) => STATUS_STYLE[s] ?? STATUS_STYLE.Speculative;

  return (
    <div className="min-h-screen text-slate-100">
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-purple-400 text-3xl">
              lightbulb
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Theory Archive
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-slate-400 text-lg">
              Speculative analysis and hypotheses from the research division
            </p>
            <span className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full px-3 py-0.5 text-xs font-bold">
              {filtered.length} theories
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="sticky top-3 z-40 bg-surface-dark p-4 rounded-xl border border-border-dark/30 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search theories..."
                className="w-full bg-background-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-surface-dark border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeStatus === s
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                    : "bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {editMode && (
          <div className="mb-6">
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Theory
            </button>
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {loadingList ? (
            <div className="flex justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-4xl text-purple-400">progress_activity</span>
            </div>
          ) : (
          <>
          {filtered.map((entry) => {
            const s = style(entry.status);
            return (
              <div key={entry.id} className="relative group">
                <Link
                  to={`/theory/${entry.id}`}
                  className="group bg-surface-light/50 hover:bg-surface-light border border-border-dark hover:border-purple-500/40 rounded-lg p-5 cursor-pointer transition-colors block"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${s.dot} shrink-0 mt-2`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="text-white font-semibold text-base group-hover:text-purple-400 transition-colors">
                          {entry.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed mb-3 line-clamp-2">
                        {entry.summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            person
                          </span>
                          {entry.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            calendar_today
                          </span>
                          {entry.date}
                        </span>
                        <div className="flex items-center gap-1.5 ml-auto">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-500 border border-border-dark/50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {editMode ? (
                      <div className="flex gap-1.5 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditForm(entry); }}
                          className="p-1.5 rounded text-amber-400 hover:bg-amber-500/20 transition-colors"
                          disabled={loadingArticle}
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(entry.id); }}
                          className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    ) : (
                      <span className="material-symbols-outlined text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all text-[20px] shrink-0 mt-1 hidden md:block">
                        arrow_forward
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
          </>
          )}
          {!loadingList && filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-3 block">
                search_off
              </span>
              <p className="text-lg">No theories match your search.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="text-slate-300 font-medium">
              {filtered.length}
            </span>{" "}
            theories
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-400 border border-border-dark hover:bg-white/10 hover:text-white transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-colors">
              Next
            </button>
          </div>
        </div>
      </main>

      {formOpen && (
        <ArticleForm
          article={formArticle}
          defaultSection="theory"
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditingEntry(null); setEditingArticle(null); }}
        />
      )}
      {loadingArticle && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50">
          <span className="material-symbols-outlined animate-spin text-4xl text-white">progress_activity</span>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Theory"
        message="This theory will be soft-deleted and hidden from visitors."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
