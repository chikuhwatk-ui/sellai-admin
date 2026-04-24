"use client";

import { useState } from "react";
import { Menu, Search, Bell, ChevronDown, Sun, Moon, LogOut, Keyboard, User, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Kbd, modKey } from "@/components/ui/Kbd";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Breadcrumbs } from "./Breadcrumbs";
import { cn } from "@/lib/cn";

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
  onOpenPalette: () => void;
}

export default function Header({ title, onMenuToggle, onOpenPalette }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex items-center justify-between h-12 px-3 sm:px-5 bg-canvas border-b border-muted shrink-0 shadow-elev-1">
      {/* Left: menu + breadcrumbs/title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 -ml-1 rounded-md text-fg-muted hover:text-fg hover:bg-raised transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <Breadcrumbs className="hidden md:flex" />
          <h1 className="md:hidden text-sm font-semibold text-fg truncate">{title}</h1>
        </div>
      </div>

      {/* Right: palette trigger + notifications + avatar */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenPalette}
          className={cn(
            "hidden md:flex items-center gap-2 h-8 px-2.5 w-60",
            "bg-panel border border-default rounded-md",
            "text-xs text-fg-subtle hover:border-strong hover:text-fg-muted transition-colors"
          )}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search or run a command…</span>
          <span className="flex items-center gap-0.5">
            <Kbd>{modKey()}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <button
          onClick={onOpenPalette}
          className="md:hidden p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-raised transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          className="relative p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-raised transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-danger rounded-full" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-md hover:bg-raised transition-colors"
              aria-label={`Account menu for ${user?.name || "admin"}`}
            >
              <div
                className="w-6 h-6 rounded-full bg-accent-bg text-accent flex items-center justify-center text-xs font-medium"
                aria-hidden="true"
              >
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <ChevronDown className="h-3 w-3 text-fg-subtle" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-medium text-fg">{user?.name || "Admin"}</div>
              <div className="text-2xs font-normal text-fg-muted mt-0.5">{user?.phoneNumber || ""}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => (window.location.href = "/settings")}>
              <User className="h-3.5 w-3.5 text-fg-subtle" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => (window.location.href = "/settings")}>
              <SettingsIcon className="h-3.5 w-3.5 text-fg-subtle" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} kbd="⌘⇧L">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-fg-subtle" /> : <Moon className="h-3.5 w-3.5 text-fg-subtle" />}
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </DropdownMenuItem>
            <DropdownMenuItem kbd="?" onClick={() => {
              const ev = new KeyboardEvent("keydown", { key: "?", shiftKey: true, bubbles: true });
              document.dispatchEvent(ev);
            }}>
              <Keyboard className="h-3.5 w-3.5 text-fg-subtle" />
              Keyboard shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger" onClick={logout}>
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
