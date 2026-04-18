"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  LayoutDashboard, Users, ShieldCheck, ShoppingCart, Truck,
  Wallet, MessageSquare, BarChart3, Settings, MessagesSquare,
  LifeBuoy, Sun, Moon, Keyboard, LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";

interface PaletteItem {
  id: string;
  label: string;
  group: string;
  kbd?: string;
  icon: React.ReactNode;
  run: (router: ReturnType<typeof useRouter>) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const { theme, setTheme, density, setDensity } = useTheme();
  const { logout } = useAuth();
  const [value, setValue] = React.useState("");

  // ⌘K / Ctrl+K opens, Esc closes.
  useHotkeys("mod+k, /", (e) => {
    e.preventDefault();
    onOpenChange(!open);
  }, { enableOnFormTags: false, enableOnContentEditable: false });

  React.useEffect(() => {
    if (!open) setValue("");
  }, [open]);

  const runAndClose = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  const navItems: PaletteItem[] = [
    { id: "dashboard", label: "Dashboard", group: "Navigate", kbd: "G D", icon: <LayoutDashboard className="h-4 w-4" />, run: (r) => r.push("/dashboard") },
    { id: "users", label: "Users", group: "Navigate", kbd: "G U", icon: <Users className="h-4 w-4" />, run: (r) => r.push("/users") },
    { id: "verification", label: "Verification Queue", group: "Navigate", kbd: "G V", icon: <ShieldCheck className="h-4 w-4" />, run: (r) => r.push("/verification") },
    { id: "orders", label: "Demand Center", group: "Navigate", kbd: "G O", icon: <ShoppingCart className="h-4 w-4" />, run: (r) => r.push("/orders") },
    { id: "deliveries", label: "Deliveries", group: "Navigate", kbd: "G R", icon: <Truck className="h-4 w-4" />, run: (r) => r.push("/deliveries") },
    { id: "finance", label: "Finance", group: "Navigate", kbd: "G F", icon: <Wallet className="h-4 w-4" />, run: (r) => r.push("/finance") },
    { id: "disputes", label: "Disputes", group: "Navigate", kbd: "G P", icon: <MessagesSquare className="h-4 w-4" />, run: (r) => r.push("/disputes") },
    { id: "support", label: "Support Tickets", group: "Navigate", kbd: "G S", icon: <LifeBuoy className="h-4 w-4" />, run: (r) => r.push("/support") },
    { id: "communications", label: "Communications", group: "Navigate", icon: <MessageSquare className="h-4 w-4" />, run: (r) => r.push("/communications") },
    { id: "analytics", label: "Analytics — Marketplace", group: "Navigate", icon: <BarChart3 className="h-4 w-4" />, run: (r) => r.push("/analytics/marketplace") },
    { id: "settings", label: "Settings", group: "Navigate", icon: <Settings className="h-4 w-4" />, run: (r) => r.push("/settings") },
    { id: "audit-log", label: "Audit Log", group: "Navigate", icon: <Settings className="h-4 w-4" />, run: (r) => r.push("/settings/audit-log") },
  ];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--color-overlay-scrim)] backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-[15%] z-50 -translate-x-1/2 w-full max-w-xl",
            "bg-overlay border border-muted rounded-xl shadow-elev-4 overflow-hidden",
            "data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
            "focus:outline-none"
          )}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <Command
            value={value}
            onValueChange={setValue}
            filter={(itemValue, search) => {
              if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1;
              return 0;
            }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2 border-b border-muted px-3">
              <svg className="h-4 w-4 text-fg-subtle shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <Command.Input
                placeholder="Type a command or search…"
                className="flex-1 h-11 bg-transparent outline-none text-sm text-fg placeholder:text-fg-subtle"
                autoFocus
              />
              <kbd className="kbd">ESC</kbd>
            </div>
            <Command.List className="max-h-[60vh] overflow-y-auto p-1.5">
              <Command.Empty className="py-6 text-center text-sm text-fg-muted">
                No results for &quot;{value}&quot;
              </Command.Empty>

              <Command.Group heading="Navigate" className="text-2xs uppercase tracking-wider text-fg-subtle px-2 pt-2 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-1">
                {navItems.map((item) => (
                  <PaletteRow key={item.id} item={item} onSelect={() => runAndClose(() => item.run(router))} />
                ))}
              </Command.Group>

              <Command.Group heading="Preferences">
                <PaletteRow
                  item={{
                    id: "theme.toggle",
                    label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
                    group: "Preferences",
                    kbd: "⌘⇧L",
                    icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
                    run: () => setTheme(theme === "dark" ? "light" : "dark"),
                  }}
                  onSelect={() => runAndClose(() => setTheme(theme === "dark" ? "light" : "dark"))}
                />
                <PaletteRow
                  item={{
                    id: "density.toggle",
                    label: density === "compact" ? "Switch to comfortable density" : "Switch to compact density",
                    group: "Preferences",
                    kbd: "⌘⇧D",
                    icon: <Keyboard className="h-4 w-4" />,
                    run: () => setDensity(density === "compact" ? "comfortable" : "compact"),
                  }}
                  onSelect={() => runAndClose(() => setDensity(density === "compact" ? "comfortable" : "compact"))}
                />
              </Command.Group>

              <Command.Group heading="Account">
                <PaletteRow
                  item={{
                    id: "logout",
                    label: "Sign out",
                    group: "Account",
                    icon: <LogOut className="h-4 w-4" />,
                    run: () => logout(),
                  }}
                  onSelect={() => runAndClose(() => logout())}
                />
              </Command.Group>
            </Command.List>
            <div className="flex items-center justify-between gap-2 border-t border-muted px-3 py-2 text-2xs text-fg-subtle">
              <div className="flex items-center gap-2">
                <kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd><span>navigate</span>
                <kbd className="kbd">↵</kbd><span>select</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Shortcut cheatsheet</span>
                <kbd className="kbd">?</kbd>
              </div>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PaletteRow({ item, onSelect }: { item: PaletteItem; onSelect: () => void }) {
  return (
    <Command.Item
      value={`${item.label} ${item.group}`}
      onSelect={onSelect}
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-md text-sm-compact text-fg cursor-pointer",
        "data-[selected=true]:bg-raised",
        "aria-selected:bg-raised"
      )}
    >
      <span className="text-fg-subtle">{item.icon}</span>
      <span className="flex-1 truncate">{item.label}</span>
      {item.kbd && <span className="text-2xs text-fg-subtle font-mono">{item.kbd}</span>}
    </Command.Item>
  );
}
