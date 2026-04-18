/*
 * Canonical keyboard shortcut registry.
 *
 * Every shortcut the app supports is listed here. The Command Palette,
 * the Shortcut Cheatsheet, and individual pages all read from this list —
 * no drift between "what the UI advertises" and "what actually works".
 */

export interface Shortcut {
  id: string;
  keys: string; // react-hotkeys-hook format, e.g. "mod+k" or "g,d"
  display: string[]; // display tokens, e.g. ["⌘", "K"] or ["g", "d"]
  label: string;
  group: "Navigate" | "Actions" | "View" | "Global";
  scope?: string; // page where it's active, default "global"
}

export const SHORTCUTS: Shortcut[] = [
  // Global
  { id: "palette.open", keys: "mod+k", display: ["⌘", "K"], label: "Open command palette", group: "Global" },
  { id: "palette.open.slash", keys: "/", display: ["/"], label: "Open command palette", group: "Global" },
  { id: "help.open", keys: "shift+?", display: ["?"], label: "Show keyboard shortcuts", group: "Global" },
  { id: "theme.toggle", keys: "mod+shift+l", display: ["⌘", "⇧", "L"], label: "Toggle theme", group: "Global" },
  { id: "density.toggle", keys: "mod+shift+d", display: ["⌘", "⇧", "D"], label: "Toggle dense mode", group: "Global" },

  // Navigate (g-prefixed)
  { id: "nav.dashboard", keys: "g>d", display: ["G", "D"], label: "Go to Dashboard", group: "Navigate" },
  { id: "nav.users", keys: "g>u", display: ["G", "U"], label: "Go to Users", group: "Navigate" },
  { id: "nav.verification", keys: "g>v", display: ["G", "V"], label: "Go to Verification", group: "Navigate" },
  { id: "nav.orders", keys: "g>o", display: ["G", "O"], label: "Go to Orders", group: "Navigate" },
  { id: "nav.deliveries", keys: "g>r", display: ["G", "R"], label: "Go to Deliveries (Runners)", group: "Navigate" },
  { id: "nav.finance", keys: "g>f", display: ["G", "F"], label: "Go to Finance", group: "Navigate" },
  { id: "nav.disputes", keys: "g>p", display: ["G", "P"], label: "Go to Disputes", group: "Navigate" },
  { id: "nav.support", keys: "g>s", display: ["G", "S"], label: "Go to Support", group: "Navigate" },

  // List actions
  { id: "list.search", keys: "/", display: ["/"], label: "Focus search", group: "Actions", scope: "list" },
  { id: "list.next", keys: "j", display: ["J"], label: "Next row", group: "Actions", scope: "list" },
  { id: "list.prev", keys: "k", display: ["K"], label: "Previous row", group: "Actions", scope: "list" },
  { id: "list.open", keys: "enter", display: ["↵"], label: "Open selected row", group: "Actions", scope: "list" },
  { id: "list.close", keys: "escape", display: ["Esc"], label: "Close detail", group: "Actions", scope: "list" },

  // Verification queue
  { id: "verify.approve", keys: "a", display: ["A"], label: "Approve verification", group: "Actions", scope: "verification" },
  { id: "verify.reject", keys: "r", display: ["R"], label: "Reject verification", group: "Actions", scope: "verification" },
  { id: "verify.claim", keys: "c", display: ["C"], label: "Claim verification", group: "Actions", scope: "verification" },
];

export function findShortcut(id: string) {
  return SHORTCUTS.find((s) => s.id === id);
}

export function shortcutsByGroup() {
  const groups: Record<string, Shortcut[]> = {};
  for (const s of SHORTCUTS) {
    (groups[s.group] ||= []).push(s);
  }
  return groups;
}
