import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  House,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  ScrollText,
  ShieldCheck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { WeaveBand } from "@/components/brand/WeaveBand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageTransition } from "@/components/shared/PageTransition";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/useAuth";
import { ADMIN_ACCESS } from "@/types/auth";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Entries the user lacks are hidden (the backend refuses the data anyway). No permission = everyone. */
  permission?: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// The app shell is shared by every signed-in user. Members see the first group; admin groups
// appear only for people holding the matching permission.
const NAV_GROUPS: NavGroup[] = [
  {
    id: "me",
    label: "Me",
    items: [
      { to: "/dashboard", label: "Home", icon: House },
      { to: "/account", label: "My account", icon: UserCircle },
    ],
  },
  {
    id: "overview",
    label: "Overview",
    items: [{ to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: ADMIN_ACCESS }],
  },
  {
    id: "people",
    label: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: Users, permission: "users.read" },
      { to: "/admin/roles", label: "Roles", icon: ShieldCheck, permission: "roles.read" },
    ],
  },
  {
    id: "records",
    label: "Records",
    items: [
      { to: "/admin/audit", label: "Audit log", icon: ScrollText, permission: "audit.read" },
      { to: "/admin/email-log", label: "Email log", icon: Mail, permission: "email_log.read" },
    ],
  },
];

const EASE = [0.4, 0, 0.2, 1] as const;

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const { logout, user, hasPermission, landingPath } = useAuth();
  const reduce = useReducedMotion();
  const [closed, setClosed] = useState<Set<string>>(new Set());

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(`${path}/`) ||
    (path === "/admin/dashboard" && location.pathname === "/admin");

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.permission || hasPermission(i.permission)),
  })).filter((g) => g.items.length > 0);

  const toggle = (id: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 flex-shrink-0 items-center", collapsed ? "justify-center" : "px-6")}>
        <Link to={landingPath} aria-label="Motherland dashboard" onClick={onNavigate}>
          {collapsed ? (
            <span className="font-display text-lg font-extrabold tracking-wider text-ink">M</span>
          ) : (
            <Wordmark size={18} descriptor={hasPermission(ADMIN_ACCESS) ? "Admin" : undefined} />
          )}
        </Link>
      </div>

      <nav aria-label="Main" className="scrollbar-thin-sand flex-1 overflow-y-auto px-3 py-2">
        <LayoutGroup id="app-nav">
          {groups.map((group) => {
            const open = collapsed || !closed.has(group.id);
            const hasActive = group.items.some((i) => isActive(i.to));
            return (
              <div key={group.id} className="mb-2">
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggle(group.id)}
                    aria-expanded={open}
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-xl px-3 transition-colors duration-150",
                      hasActive ? "text-brand-strong" : "text-ink-muted hover:text-ink",
                    )}
                  >
                    <span className="flex-1 text-left text-[11px] font-bold uppercase tracking-wider">{group.label}</span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reduce ? 0 : 0.2, ease: EASE }}>
                      <ChevronDown size={14} aria-hidden="true" />
                    </motion.span>
                  </button>
                )}
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.ul
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
                      className="space-y-0.5 overflow-hidden"
                    >
                      {group.items.map((item) => {
                        const active = isActive(item.to);
                        return (
                          <li key={item.to}>
                            <Link
                              to={item.to}
                              onClick={onNavigate}
                              aria-current={active ? "page" : undefined}
                              title={collapsed ? item.label : undefined}
                              className={cn(
                                "group relative flex h-11 items-center gap-3 rounded-xl text-sm font-semibold transition-colors duration-150",
                                collapsed ? "justify-center px-0" : "px-3.5",
                                active ? "bg-brand-soft text-brand-strong" : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
                              )}
                            >
                              {active && (
                                <motion.span
                                  layoutId="app-nav-indicator"
                                  className="absolute left-0 h-5 w-1 rounded-r-full bg-brand"
                                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 30 }}
                                />
                              )}
                              <item.icon size={20} strokeWidth={2} className="flex-shrink-0" aria-hidden="true" />
                              {!collapsed && <span className="truncate">{item.label}</span>}
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </LayoutGroup>
      </nav>

      <div className={cn("flex-shrink-0 border-t border-line", collapsed ? "p-2" : "p-3")}>
        <div className={cn("flex items-center gap-3 rounded-xl p-2", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-ink text-xs font-bold text-ink-inverse">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-ink">{displayName}</p>
              <p className="truncate text-xs text-ink-muted">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => logout()}
          title="Sign out"
          className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded-xl px-2 text-xs font-semibold text-ink-muted transition-colors duration-150 hover:bg-danger-soft hover:text-danger"
        >
          <LogOut size={16} aria-hidden="true" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
}

/** The signed-in app: sidebar, top bar and routed page. Used for member and admin pages alike. */
export default function AppLayout() {
  const location = useLocation();
  const { landingPath } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setDrawer(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-ink focus:px-4 focus:py-2 focus:text-ink-inverse"
      >
        Skip to content
      </a>
      <WeaveBand variant="thread" />

      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "relative hidden flex-shrink-0 border-r border-line bg-surface-raised transition-[width] duration-300 ease-spring lg:block",
            collapsed ? "w-[72px]" : "w-[250px]",
          )}
        >
          <SidebarBody collapsed={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-surface-raised text-ink-muted shadow-1 transition-colors duration-150 hover:text-ink"
          >
            {collapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronLeft size={14} aria-hidden="true" />}
          </button>
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {drawer && (
            <>
              <motion.div
                key="scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-[rgba(30,20,16,0.55)] lg:hidden"
                onClick={() => setDrawer(false)}
                aria-hidden="true"
              />
              <motion.aside
                key="drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.2, ease: EASE }}
                className="fixed inset-y-0 left-0 z-50 w-[260px] border-r border-line bg-surface-raised shadow-3 lg:hidden"
              >
                <SidebarBody collapsed={false} onNavigate={() => setDrawer(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar: only needed on small screens, where it holds the menu button */}
          <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-line bg-surface-raised px-4 md:px-6 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-surface-sunken"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
            <Link to={landingPath} aria-label="Motherland dashboard">
              <Wordmark size={16} band={false} />
            </Link>
          </header>

          <main id="main" className="scrollbar-thin-sand flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto w-full max-w-content">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
      {drawer && (
        <button
          type="button"
          onClick={() => setDrawer(false)}
          aria-label="Close menu"
          className="fixed right-3 top-3 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-raised text-ink shadow-2 lg:hidden"
        >
          <X size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
