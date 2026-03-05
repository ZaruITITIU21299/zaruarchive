import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { useGame } from "@/contexts/GameContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminService } from "@/services/AdminService";
import { supabase } from "@/lib/supabase";
import { TermForm, type TermFormData } from "@/components/admin/forms/TermForm";
import { TagManagementForm } from "@/components/admin/forms/TagManagementForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface TermEntry {
  id: string;
  term: string;
  definition: string;
  tagIds: string[];
}

interface TagOption {
  id: string;
  slug: string;
  label: string;
}

const TAG_COLORS: Record<string, { bg: string; text: string; dot: string }> = {};
const PALETTE = [
  { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
  { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  { bg: "bg-pink-500/15", text: "text-pink-400", dot: "bg-pink-400" },
  { bg: "bg-teal-500/15", text: "text-teal-400", dot: "bg-teal-400" },
  { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
  { bg: "bg-cyan-500/15", text: "text-cyan-400", dot: "bg-cyan-400" },
  { bg: "bg-indigo-500/15", text: "text-indigo-400", dot: "bg-indigo-400" },
];

function getTagColor(slug: string) {
  if (!TAG_COLORS[slug]) {
    const idx = Object.keys(TAG_COLORS).length % PALETTE.length;
    TAG_COLORS[slug] = PALETTE[idx];
  }
  return TAG_COLORS[slug];
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SORT_OPTIONS = ["A → Z", "Z → A", "Newest", "Oldest"] as const;

export default function TerminologyPage() {
  const navigate = useNavigate();
  const { editMode } = useAdmin();
  const { gameId } = useGame();
  const { lang } = useLanguage();

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>("A → Z");

  const [tags, setTags] = useState<TagOption[]>([]);
  const [entries, setEntries] = useState<TermEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<TermEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tagPanelOpen, setTagPanelOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const svc = new AdminService(gameId, lang);
      const allTags = await svc.fetchTags();
      setTags(allTags);

      const { data: terms } = await supabase
        .from("terms")
        .select("id")
        .eq("game_id", gameId)
        .is("deleted_at", null)
        .eq("status", "published")
        .order("display_order", { ascending: true });

      if (!terms?.length) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const termIds = terms.map((t) => t.id as string);

      const { data: translations } = await supabase
        .from("term_translations")
        .select("term_id, term, definition")
        .in("term_id", termIds)
        .eq("lang", lang);

      const transMap = new Map(
        (translations ?? []).map((t) => [
          t.term_id as string,
          { term: t.term as string, definition: t.definition as string },
        ])
      );

      const { data: contentTags } = await supabase
        .from("content_tags")
        .select("entity_id, tag_id")
        .eq("entity_type", "term")
        .in("entity_id", termIds);

      const tagMap = new Map<string, string[]>();
      for (const ct of contentTags ?? []) {
        const eid = ct.entity_id as string;
        const tid = ct.tag_id as string;
        tagMap.set(eid, [...(tagMap.get(eid) ?? []), tid]);
      }

      const result: TermEntry[] = termIds
        .map((id) => {
          const trans = transMap.get(id);
          if (!trans) return null;
          return {
            id,
            term: trans.term,
            definition: trans.definition,
            tagIds: tagMap.get(id) ?? [],
          };
        })
        .filter(Boolean) as TermEntry[];

      setEntries(result);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [gameId, lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: TermFormData) => {
    const svc = new AdminService(gameId, lang);
    const relTerms = data.related_terms
      ? data.related_terms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    let termId: string;
    if (editingTerm) {
      await svc.updateTerm(editingTerm.id, {
        term: { en: data.term_en, vi: data.term_vi },
        definition: { en: data.definition_en, vi: data.definition_vi },
        related_terms: relTerms,
      });
      termId = editingTerm.id;
    } else {
      termId = await svc.createTerm({
        term: { en: data.term_en, vi: data.term_vi },
        definition: { en: data.definition_en, vi: data.definition_vi },
        related_terms: relTerms,
      });
    }

    await svc.setEntityTags("term", termId, data.tag_ids);

    setFormOpen(false);
    setEditingTerm(null);
    await loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const svc = new AdminService(gameId, lang);
    await svc.deleteTerm(deleteTarget);
    setDeleteTarget(null);
    setDeleting(false);
    await loadData();
  };

  const filtered = useMemo(() => {
    let results = entries.filter((e) => {
      const matchesSearch =
        e.term.toLowerCase().includes(search.toLowerCase()) ||
        e.definition.toLowerCase().includes(search.toLowerCase());
      const matchesTag =
        activeTag === "all" || e.tagIds.includes(activeTag);
      return matchesSearch && matchesTag;
    });

    if (sort === "A → Z")
      results = [...results].sort((a, b) => a.term.localeCompare(b.term));
    if (sort === "Z → A")
      results = [...results].sort((a, b) => b.term.localeCompare(a.term));

    return results;
  }, [entries, search, activeTag, sort]);

  const getTermTags = (entry: TermEntry) =>
    tags.filter((t) => entry.tagIds.includes(t.id));

  return (
    <div className="min-h-screen text-slate-100">
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-primary text-3xl">
              menu_book
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Terminology Index
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-slate-400 text-lg">
              Comprehensive glossary of terms, locations, and classifications
            </p>
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/30 rounded-full px-3 py-0.5 text-xs font-bold">
              {filtered.length} / {entries.length} entries
            </span>
          </div>
        </div>

        {/* Sticky toolbar */}
        <div className="sticky top-3 z-40 bg-surface-dark p-4 rounded-xl border border-border-dark/30 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search terms, definitions..."
                className="w-full bg-[#0a1216] border border-[#223f49] rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-surface-dark border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Manage Tags button */}
            {editMode && (
              <button
                onClick={() => setTagPanelOpen(true)}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-purple/15 border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/25 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">label</span>
                Tags
              </button>
            )}
          </div>

          {/* Tag chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTag === "all"
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-white"
              }`}
            >
              All
            </button>
            {tags.map((tag) => {
              const c = getTagColor(tag.slug);
              const isActive = activeTag === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => setActiveTag(tag.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? `${c.bg} ${c.text} border ${c.dot.replace("bg-", "border-")}/40`
                      : "bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add button */}
        {editMode && (
          <div className="mb-6">
            <button
              onClick={() => {
                setEditingTerm(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Term
            </button>
          </div>
        )}

        {/* Alphabet quick links */}
        <div className="flex flex-wrap gap-1.5 mb-8 justify-center">
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              className="w-8 h-8 rounded-md text-xs font-bold text-slate-400 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-3 block animate-spin">
              progress_activity
            </span>
            <p className="text-lg">Loading terminology...</p>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <div className="space-y-3">
            {filtered.map((entry) => {
              const entryTags = getTermTags(entry);
              const firstTag = entryTags[0];
              const c = firstTag
                ? getTagColor(firstTag.slug)
                : { bg: "bg-slate-500/15", text: "text-slate-400", dot: "bg-slate-400" };

              return (
                <div
                  key={entry.id}
                  onClick={() =>
                    navigate(
                      `/terminology/${encodeURIComponent(entry.term)}`
                    )
                  }
                  className="group bg-[#16262c]/50 hover:bg-[#16262c] border border-[#223f49] hover:border-primary/50 rounded-lg p-5 md:px-6 md:py-4 cursor-pointer transition-all md:grid md:grid-cols-12 gap-4 items-center"
                >
                  {/* Term */}
                  <div className="md:col-span-3 flex items-center gap-3 mb-2 md:mb-0">
                    <span
                      className={`w-2 h-2 rounded-full ${c.dot} shrink-0`}
                    />
                    <span className="text-white font-semibold text-base group-hover:text-primary transition-colors">
                      {entry.term}
                    </span>
                  </div>

                  {/* Definition */}
                  <p className="md:col-span-6 text-sm text-slate-400 leading-relaxed mb-2 md:mb-0 line-clamp-2">
                    {entry.definition}
                  </p>

                  {/* Tags */}
                  <div className="md:col-span-2 flex flex-wrap items-center gap-1">
                    {entryTags.map((tag) => {
                      const tc = getTagColor(tag.slug);
                      return (
                        <span
                          key={tag.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${tc.bg} ${tc.text}`}
                        >
                          {tag.label}
                        </span>
                      );
                    })}
                    {entryTags.length === 0 && (
                      <span className="text-xs text-slate-600 italic">
                        untagged
                      </span>
                    )}
                  </div>

                  {/* Arrow / Admin */}
                  <div className="md:col-span-1 hidden md:flex justify-end gap-1.5">
                    {editMode ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTerm(entry);
                            setFormOpen(true);
                          }}
                          className="p-1.5 rounded text-amber-400 hover:bg-amber-500/20 transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(entry.id);
                          }}
                          className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </>
                    ) : (
                      <span className="material-symbols-outlined text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all text-[20px]">
                        arrow_forward
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && !loading && (
              <div className="text-center py-16 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-3 block">
                  search_off
                </span>
                <p className="text-lg">
                  {entries.length === 0
                    ? "No terms yet. Add one to get started."
                    : "No entries match your search."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && entries.length > 0 && (
          <div className="mt-10 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="text-slate-300 font-medium">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="text-slate-300 font-medium">
                {entries.length}
              </span>{" "}
              entries
            </p>
          </div>
        )}
      </main>

      {formOpen && (
        <TermForm
          term={
            editingTerm
              ? {
                  id: editingTerm.id,
                  gameId,
                  category: "",
                  relatedTerms: [],
                  displayOrder: 0,
                  term: editingTerm.term,
                  definition: editingTerm.definition,
                  attributes: [],
                }
              : null
          }
          onSave={handleSave}
          onCancel={() => {
            setFormOpen(false);
            setEditingTerm(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Term"
        message="This term will be soft-deleted and hidden from visitors."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {tagPanelOpen && (
        <TagManagementForm
          onClose={() => {
            setTagPanelOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
