import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useImageCrossfade } from "@/hooks/useImageCrossfade";
import { GameSwitcher } from "./GameSwitcher";
import { LoginModal } from "@/components/admin/LoginModal";
import ShinyText from "@/components/ShinyText";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();
  const { game } = useGame();
  const { user, isAdmin, signOut } = useAuth();
  const { editMode, toggleEditMode } = useAdmin();
  const [loginOpen, setLoginOpen] = useState(false);

  const bgImages = game.sidebarBackgrounds;
  const activeIndex = useImageCrossfade(bgImages);

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen z-40 flex flex-col border-r border-glass-border transition-[width] duration-500 ease-in-out ${
          collapsed ? "w-[72px]" : "w-72"
        }`}
      >
        {/* Background layer */}
        {bgImages && bgImages.length > 0 ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            {bgImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
                style={{ opacity: i === activeIndex ? 1 : 0 }}
              />
            ))}
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-surface-dark" />
        )}

        {/* Header */}
        <div
          className={`relative z-30 flex items-center border-b border-glass-border shrink-0 ${
            collapsed ? "justify-center p-4" : "justify-between p-5"
          }`}
        >
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <GameSwitcher />
              <div className="flex flex-col min-w-0">
                <h1 className="text-white text-lg font-bold tracking-wide font-[--font-display] truncate sidebar-text-stroke">
                  Zaru Archive
                </h1>
                <p className="text-primary/80 text-xs font-normal tracking-wider uppercase truncate sidebar-text-stroke">
                  {game.name}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              onToggle()
              // Emit event for layout components to detect sidebar state
              window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { collapsed: !collapsed } }))
            }}
            className={`flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 ${
              collapsed ? "w-10 h-10" : "w-9 h-9"
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? "right_panel_close" : "left_panel_close"}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`relative z-10 flex-1 flex flex-col gap-1 overflow-y-auto ${
            collapsed ? "px-2 py-4" : "px-3 py-4"
          }`}
        >
          {game.navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? t(item.tKey) : undefined}
                className={`flex items-center rounded-xl transition-colors duration-200 ${
                  collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {item.iconImage ? (
                  <img
                    src={item.iconImage}
                    alt=""
                    className={`shrink-0 object-contain ${
                      isActive
                        ? "brightness-125 drop-shadow-[0_0_4px_var(--color-primary)]"
                        : "opacity-70 brightness-90"
                    } ${collapsed ? "w-9 h-9" : "w-[30px] h-[30px]"}`}
                  />
                ) : (
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 ${
                      isActive ? "" : "group-hover:text-primary"
                    }`}
                  >
                    {item.icon}
                  </span>
                )}
                {!collapsed &&
                  (item.shineColor ? (
                    <ShinyText
                      text={t(item.tKey)}
                      color={isActive ? "var(--color-primary)" : "#ffffff"}
                      shineColor={item.shineColor}
                      speed={3}
                      className="text-[16px] font-medium truncate sidebar-shine-stroke"
                    />
                  ) : (
                    <span className="text-sm font-medium truncate sidebar-text-stroke">
                      {t(item.tKey)}
                    </span>
                  ))}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div
          className={`relative z-10 border-t border-glass-border shrink-0 ${collapsed ? "p-2" : "p-4"}`}
        >
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "vi" : "en")}
            title={collapsed ? t("nav.language") : undefined}
            className={`flex items-center w-full rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-300 hover:text-white ${
              collapsed ? "justify-center p-3" : "gap-3 px-4 py-2.5"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">
              language
            </span>
            {!collapsed && (
              <>
                <span className="text-sm font-medium sidebar-text-stroke">
                  {lang === "en" ? "English" : "Tiếng Việt"}
                </span>
                <span className="ml-auto text-xs text-slate-500 uppercase font-mono sidebar-text-stroke">
                  {lang}
                </span>
              </>
            )}
          </button>

          {/* Edit mode toggle — only shown when logged in */}
          {isAdmin && (
            <button
              onClick={toggleEditMode}
              title={collapsed ? (editMode ? "Edit Mode" : "View Mode") : undefined}
              className={`mt-2 flex items-center w-full rounded-lg transition-colors ${
                collapsed ? "justify-center p-3" : "gap-3 px-4 py-2.5"
              } ${
                editMode
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">
                {editMode ? "edit" : "visibility"}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium sidebar-text-stroke">
                  {editMode ? t("admin.editMode") : t("admin.viewMode")}
                </span>
              )}
            </button>
          )}

          {/* Collapsed: show game switcher at bottom */}
          {collapsed && (
            <div className="mt-2 flex justify-center">
              <GameSwitcher compact />
            </div>
          )}

          {/* Auth: Sign In / User Profile */}
          {!isAdmin ? (
            /* Sign In button */
            <>
              {!collapsed ? (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="mt-3 flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/5 text-slate-300 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">
                    login
                  </span>
                  <span className="text-sm font-medium sidebar-text-stroke">
                    {t("admin.signIn")}
                  </span>
                </button>
              ) : (
                <div className="mt-2 flex justify-center">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={t("admin.signIn")}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      login
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Logged-in user profile */
            <>
              {!collapsed ? (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {userInitials}
                  </div>
                  <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                    <span className="text-sm font-medium text-white truncate sidebar-text-stroke">
                      {user?.email ?? "Admin"}
                    </span>
                    <span className="text-xs text-slate-400 truncate sidebar-text-stroke">
                      {t("admin.admin")}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={t("admin.signOut")}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      logout
                    </span>
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex justify-center">
                  <button
                    onClick={signOut}
                    className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xs font-bold text-white cursor-pointer"
                    title={t("admin.signOut")}
                  >
                    {userInitials}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
