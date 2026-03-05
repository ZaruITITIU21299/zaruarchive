import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { useGame } from "@/contexts/GameContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminService } from "@/services/AdminService";
import { CharacterForm, type CharacterFormData } from "@/components/admin/forms/CharacterForm";
import { AttributeDefinitionForm } from "@/components/admin/forms/AttributeDefinitionForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface PlaceholderCharacter {
  id: string;
  name: string;
  faction: string;
  element: string;
  elementBg: string;
  elementBorder: string;
  elementText: string;
  description: string;
  related: string[];
}

const PLACEHOLDER_CHARACTERS: PlaceholderCharacter[] = [
  {
    id: "BS-992-X",
    name: "Kaelen Vos",
    faction: "Black Shores Mercenary",
    element: "HAVOC",
    elementBg: "bg-red-500/20",
    elementBorder: "border-red-500/50",
    elementText: "text-red-400",
    description:
      "Ex-military operative with a personal vendetta against the Corporate Council. Specialized in guerrilla warfare and demolitions.",
    related: ["S", "A"],
  },
  {
    id: "CD-004-A",
    name: "Lyra 'Echo' Xin",
    faction: "Cyber District Hacker",
    element: "ELECTRO",
    elementBg: "bg-secondary/20",
    elementBorder: "border-secondary/50",
    elementText: "text-secondary",
    description:
      "Notorious for bypassing the Citadel's firewalls. Rumored to have consciousness uploaded partially to the cloud.",
    related: ["I"],
  },
  {
    id: "CF-101-Z",
    name: "Cmdr. Rake",
    faction: "Crimson Fleet Admiral",
    element: "PYRO",
    elementBg: "bg-orange-500/20",
    elementBorder: "border-orange-500/50",
    elementText: "text-orange-400",
    description:
      "Ruthless tactician commanding the largest starship in the sector. Known for 'scorched earth' orbital bombardment strategies.",
    related: ["S", "C"],
  },
  {
    id: "SC-777-B",
    name: "Seraphina",
    faction: "Sky Citadel Guardian",
    element: "AERO",
    elementBg: "bg-teal-500/20",
    elementBorder: "border-teal-500/50",
    elementText: "text-teal-400",
    description:
      "A genetically enhanced sentinel patrolling the upper atmosphere. Her suit utilizes wind currents for silent flight.",
    related: ["H"],
  },
  {
    id: "AI-NULL",
    name: "Unit 734",
    faction: "Rogue AI - The Wastes",
    element: "CRYO",
    elementBg: "bg-blue-500/20",
    elementBorder: "border-blue-500/50",
    elementText: "text-blue-400",
    description:
      "Originally a climate control unit for the terraforming project. Now wanders the frozen wastes seeking its original programming key.",
    related: ["M"],
  },
  {
    id: "HC-001-A",
    name: "General Harth",
    faction: "High Council Leader",
    element: "LIGHT",
    elementBg: "bg-yellow-500/20",
    elementBorder: "border-yellow-500/50",
    elementText: "text-yellow-400",
    description:
      "The public face of order in Solaris. Believes that absolute control is the only way to prevent another Collapse.",
    related: ["S", "P"],
  },
  {
    id: "UN-XXX-X",
    name: "Nyx",
    faction: "Undercity Assassin",
    element: "DARK",
    elementBg: "bg-purple-900/40",
    elementBorder: "border-purple-500/50",
    elementText: "text-purple-300",
    description:
      "A shadow whisper. No records exist prior to the first assassination. Wields dark matter technology.",
    related: ["?"],
  },
];

const ELEMENTS = [
  "all",
  "HAVOC",
  "ELECTRO",
  "PYRO",
  "AERO",
  "CRYO",
  "LIGHT",
  "DARK",
] as const;

export default function CharacterGridPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [element, setElement] = useState("all");
  const { editMode } = useAdmin();
  const { gameId } = useGame();
  const { lang } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<(typeof PLACEHOLDER_CHARACTERS)[number] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [attrPanelOpen, setAttrPanelOpen] = useState(false);

  const handleSave = async (data: CharacterFormData) => {
    const svc = new AdminService(gameId, lang);
    const charInput = {
      name: { en: data.name_en, vi: data.name_vi },
      alias: { en: data.alias_en, vi: data.alias_vi },
      title: { en: data.title_en, vi: data.title_vi },
      summary: { en: data.summary_en, vi: data.summary_vi },
      backstory: { en: data.backstory_en, vi: data.backstory_vi },
      element: data.element || null,
      weapon: data.weapon || null,
      rarity: data.rarity,
      faction: data.faction || null,
      image_path: data.image_path,
      is_featured: data.is_featured,
    };

    let characterId: string;
    if (editingChar) {
      await svc.updateCharacter(editingChar.id, charInput);
      characterId = editingChar.id;
    } else {
      characterId = await svc.createCharacter(charInput);
    }

    if (data.dynamicAttributes.length > 0) {
      await svc.saveEntityAttributes('character', characterId, data.dynamicAttributes);
    }

    setFormOpen(false);
    setEditingChar(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const svc = new AdminService(gameId, lang);
    await svc.deleteCharacter(deleteTarget);
    setDeleteTarget(null);
    setDeleting(false);
  };

  const filteredCharacters = PLACEHOLDER_CHARACTERS.filter((char) => {
    const matchesSearch =
      !searchQuery ||
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.faction.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesElement = element === "all" || char.element === element;
    return matchesSearch && matchesElement;
  });

  return (
    <div className="min-h-screen text-slate-100">
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-primary text-3xl">
              group
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Character{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Registry
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-slate-400 text-lg">
              Access classified profiles of the Solaris system's most notable
              entities.
            </p>
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/30 rounded-full px-3 py-0.5 text-xs font-bold">
              {filteredCharacters.length} operatives
            </span>
          </div>
        </div>

        {/* Sticky toolbar */}
        <div className="sticky top-3 z-40 bg-surface-dark p-4 rounded-xl border border-border-dark/30 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, alias, or ID..."
                className="w-full bg-background-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            {editMode && (
              <button
                onClick={() => setAttrPanelOpen(true)}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-purple/15 border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/25 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                Attributes
              </button>
            )}
          </div>

          {/* Element chips */}
          <div className="flex flex-wrap gap-2">
            {ELEMENTS.map((el) => (
              <button
                key={el}
                onClick={() => setElement(el)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  element === el
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-white"
                }`}
              >
                {el === "all"
                  ? "All Elements"
                  : el.charAt(0) + el.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {editMode && (
            <button
              onClick={() => { setEditingChar(null); setFormOpen(true); }}
              className="rounded-xl border-2 border-dashed border-white/10 hover:border-primary/40 flex flex-col items-center justify-center gap-3 min-h-[280px] text-slate-400 hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-4xl">add</span>
              <span className="text-sm font-medium">Add Character</span>
            </button>
          )}
          {filteredCharacters.map((char) => (
            <Link
              key={char.id}
              to={`/characters/${char.id}`}
              className="glass-card rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 group neon-glow flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent z-10" />
                <div className="w-full h-full bg-surface-dark flex items-center justify-center group-hover:scale-110 transition-transform duration-700 ease-out">
                  <span className="material-symbols-outlined text-6xl text-slate-700">
                    person
                  </span>
                </div>
                {editMode && (
                  <div className="absolute top-2 left-2 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingChar(char); setFormOpen(true); }}
                      className="px-2 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(char.id); }}
                      className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
                <div className="absolute top-3 right-3 z-20">
                  <span
                    className={`px-2 py-1 rounded ${char.elementBg} border ${char.elementBorder} ${char.elementText} text-xs font-bold`}
                  >
                    {char.element}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 z-20">
                  <h3 className="text-white text-xl font-bold leading-tight">
                    {char.name}
                  </h3>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mt-0.5">
                    {char.faction}
                  </p>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-3 flex-1 bg-surface-mid/80">
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                  {char.description}
                </p>
                <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {char.related.map((initial, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-slate-700 border border-surface-dark flex items-center justify-center text-[10px] text-white"
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                  <span className="text-primary hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                    View File
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="text-slate-300 font-medium">
              {filteredCharacters.length}
            </span>{" "}
            operatives
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-400 border border-border-dark hover:bg-white/10 hover:text-white transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors">
              Next
            </button>
          </div>
        </div>
      </main>

      {formOpen && (
        <CharacterForm
          character={editingChar ? {
            id: editingChar.id, gameId, imagePath: null, element: editingChar.element,
            weapon: null, rarity: null, faction: editingChar.faction, displayOrder: 0,
            isFeatured: false, name: editingChar.name, alias: '', title: '',
            summary: editingChar.description, backstory: '', attributes: [],
          } : null}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditingChar(null); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Character"
        message="This character will be soft-deleted and hidden from visitors. This action can be reversed from the database."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {attrPanelOpen && (
        <AttributeDefinitionForm
          entityType="character"
          onClose={() => setAttrPanelOpen(false)}
        />
      )}
    </div>
  );
}
